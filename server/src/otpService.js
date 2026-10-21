import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { db } from './db.js';
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5; // Max 5 OTPs per hour per contact
const MAX_VERIFY_ATTEMPTS = 3;
/**
 * Validates and normalizes contact identifier.
 */
export function parseIdentifier(raw) {
    if (!raw || typeof raw !== 'string') {
        return { isValid: false, type: 'invalid', cleanIdentifier: '', error: 'Contact identifier is required.' };
    }
    const trimmed = raw.trim();
    // Email format check
    if (trimmed.includes('@')) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(trimmed)) {
            return { isValid: false, type: 'invalid', cleanIdentifier: '', error: 'Please enter a valid email address.' };
        }
        return { isValid: true, type: 'email', cleanIdentifier: trimmed.toLowerCase() };
    }
    // Indian Phone format check (+91 or 0 prefix optional)
    const digitsOnly = trimmed.replace(/[\s-+()]/g, '');
    const tenDigit = digitsOnly.length > 10 && digitsOnly.startsWith('91')
        ? digitsOnly.slice(2)
        : digitsOnly.length > 10 && digitsOnly.startsWith('0')
            ? digitsOnly.slice(1)
            : digitsOnly;
    if (!/^[6-9]\d{9}$/.test(tenDigit)) {
        return {
            isValid: false,
            type: 'invalid',
            cleanIdentifier: '',
            error: 'Please enter a valid 10-digit Indian mobile number (e.g., 9876543210) or email address.',
        };
    }
    return { isValid: true, type: 'phone', cleanIdentifier: tenDigit };
}
/**
 * Checks provider readiness from environment variables.
 */
export function checkProviderConfig(type) {
    if (type === 'email') {
        const hasSmtp = Boolean(process.env.SMTP_HOST &&
            process.env.SMTP_HOST !== 'smtp.example.com' &&
            process.env.SMTP_USER &&
            process.env.SMTP_USER !== 'YOUR_SMTP_USERNAME');
        const hasResend = Boolean(process.env.RESEND_API_KEY &&
            process.env.RESEND_API_KEY !== 'YOUR_RESEND_API_KEY');
        return {
            isConfigured: hasSmtp || hasResend,
            providerName: hasResend ? 'Resend API' : 'SMTP Transactional Email',
            requiredCredentials: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'],
        };
    }
    else {
        const hasTwilio = Boolean(process.env.TWILIO_ACCOUNT_SID &&
            process.env.TWILIO_AUTH_TOKEN &&
            process.env.TWILIO_PHONE_NUMBER &&
            process.env.TWILIO_ACCOUNT_SID !== 'YOUR_TWILIO_ACCOUNT_SID');
        const hasMsg91 = Boolean(process.env.SMS_GATEWAY_API_KEY &&
            process.env.SMS_GATEWAY_API_KEY !== 'YOUR_SMS_API_KEY');
        return {
            isConfigured: hasTwilio || hasMsg91,
            providerName: hasTwilio ? 'Twilio Carrier SMS' : 'MSG91 / Fast2SMS Gateway',
            requiredCredentials: ['SMS_GATEWAY_API_KEY', 'SMS_GATEWAY_SENDER_ID', 'SMS_DLT_TEMPLATE_ID'],
        };
    }
}
/**
 * Real email dispatch via Nodemailer SMTP or Resend API.
 */
async function sendRealEmail(toEmail, rawOtp, type) {
    const subjectPrefix = type === 'recovery' ? 'Security PIN Recovery' : type === 'contact_update' ? 'Verify New Contact' : 'Account Registration';
    const subject = `Your Griha Saathi Verification Code: ${rawOtp} [${subjectPrefix}]`;
    if (process.env.SMTP_HOST && process.env.SMTP_HOST !== 'smtp.example.com') {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Griha Saathi Security" <noreply@grihasaathi.in>',
            to: toEmail,
            subject,
            text: `Your Griha Saathi security verification code is: ${rawOtp}.\n\nThis single-use code expires in 5 minutes. If you did not initiate this request, please disregard this email. Griha Saathi will never ask for your PIN or OTP.`,
            html: `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #E1E6E2; border-radius: 12px; background-color: #FAF9F6;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #10261A; margin: 0;">Griha Saathi / गृह साथी</h2>
            <p style="color: #40916C; font-size: 14px; margin-top: 4px;">Trustworthy Rental Housing Platform</p>
          </div>
          <div style="background-color: #FFFFFF; padding: 24px; border-radius: 8px; border: 1px solid #ECF0ED; text-align: center;">
            <p style="font-size: 15px; color: #19201C; margin-bottom: 16px;">
              Your security verification code for <strong>${subjectPrefix}</strong> is:
            </p>
            <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1B4332; background-color: #EBF3EE; padding: 14px; border-radius: 8px; margin: 16px 0;">
              ${rawOtp}
            </div>
            <p style="font-size: 13px; color: #66736C; margin-top: 12px;">
              This code is valid for <strong>5 minutes</strong>. Never share this code with anyone.
            </p>
          </div>
          <p style="font-size: 12px; color: #91A098; text-align: center; margin-top: 20px;">
            Griha Saathi Security Team &bull; Jammu & Kashmir &bull; Haryana &bull; Punjab &bull; HP &bull; Delhi
          </p>
        </div>
      `,
        });
    }
    else if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'YOUR_RESEND_API_KEY') {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: process.env.EMAIL_FROM || 'Griha Saathi <onboarding@resend.dev>',
                to: [toEmail],
                subject,
                text: `Your Griha Saathi verification code is: ${rawOtp}. Valid for 5 minutes.`,
            }),
        });
        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(`Resend API delivery error: ${errBody}`);
        }
    }
}
/**
 * Real SMS dispatch via Twilio API or MSG91 gateway.
 */
async function sendRealSms(phone10Digit, rawOtp, type) {
    const e164 = `+91${phone10Digit}`;
    const messageBody = `Your Griha Saathi verification code is ${rawOtp}. Valid for 5 mins. Do not share. GRHSAT`;
    if (process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER &&
        process.env.TWILIO_ACCOUNT_SID !== 'YOUR_TWILIO_ACCOUNT_SID') {
        const authHeader = 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const params = new URLSearchParams();
        params.append('To', e164);
        params.append('From', process.env.TWILIO_PHONE_NUMBER);
        params.append('Body', messageBody);
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Twilio SMS dispatch failed: ${errText}`);
        }
    }
    else if (process.env.SMS_GATEWAY_API_KEY &&
        process.env.SMS_GATEWAY_API_KEY !== 'YOUR_SMS_API_KEY') {
        // MSG91 Send OTP endpoint
        const sender = process.env.SMS_GATEWAY_SENDER_ID || 'GRHSAT';
        const templateId = process.env.SMS_DLT_TEMPLATE_ID || '';
        const res = await fetch(`https://api.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${e164}&authkey=${process.env.SMS_GATEWAY_API_KEY}&otp=${rawOtp}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`MSG91 SMS dispatch failed: ${errText}`);
        }
    }
}
/**
 * Creates, hashes, rate-limits, and dispatches a cryptographically secure 6-digit OTP.
 */
export async function createAndDispatchOtp(identifier, type, metadata) {
    const parsed = parseIdentifier(identifier);
    if (!parsed.isValid) {
        return {
            success: false,
            providerStatus: 'failed',
            error: parsed.error,
        };
    }
    const cleanIdentifier = parsed.cleanIdentifier;
    const now = Date.now();
    const existingChallenge = db.otpChallenges.get(cleanIdentifier);
    // 1. Resend cooldown check (60 seconds)
    if (existingChallenge && now - existingChallenge.lastRequestedAt < RESEND_COOLDOWN_MS) {
        const secondsLeft = Math.ceil((RESEND_COOLDOWN_MS - (now - existingChallenge.lastRequestedAt)) / 1000);
        return {
            success: false,
            providerStatus: 'failed',
            error: `Please wait ${secondsLeft} second(s) before requesting another verification code.`,
            cooldownSeconds: secondsLeft,
        };
    }
    // 2. Hourly rate limit check (max 5 requests per 1 hour)
    let requestCountInWindow = 1;
    let windowStartedAt = now;
    if (existingChallenge) {
        if (now - existingChallenge.windowStartedAt < RATE_LIMIT_WINDOW_MS) {
            requestCountInWindow = existingChallenge.requestCountInWindow + 1;
            windowStartedAt = existingChallenge.windowStartedAt;
            if (requestCountInWindow > MAX_REQUESTS_PER_WINDOW) {
                const minutesLeft = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - windowStartedAt)) / 60000);
                return {
                    success: false,
                    providerStatus: 'failed',
                    error: `Too many verification requests for this contact. Please try again after ${minutesLeft} minute(s).`,
                };
            }
        }
    }
    // 3. Provider Configuration Verification
    const providerCheck = checkProviderConfig(parsed.type);
    if (!providerCheck.isConfigured) {
        return {
            success: false,
            providerStatus: 'unconfigured',
            error: `The ${providerCheck.providerName} is not configured on this server.`,
            warning: `Production credentials for ${providerCheck.providerName} must be configured in .env before live verification codes can be dispatched.`,
            instructions: `Please provide: ${providerCheck.requiredCredentials.join(', ')} in the server .env configuration.`,
            requiredCredentials: providerCheck.requiredCredentials,
            maskedRecipient: db.maskIdentifier(cleanIdentifier),
        };
    }
    // 4. Generate cryptographically unpredictable 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);
    // 5. Save challenge with strict TTL and attempt tracking
    const challenge = {
        id: `otp_${crypto.randomUUID().slice(0, 8)}`,
        identifier: cleanIdentifier,
        type,
        otpHash,
        expiresAt: now + OTP_TTL_MS,
        attemptsRemaining: MAX_VERIFY_ATTEMPTS,
        lastRequestedAt: now,
        requestCountInWindow,
        windowStartedAt,
        verified: false,
        metadata,
    };
    db.otpChallenges.set(cleanIdentifier, challenge);
    // 6. Real Provider Delivery
    try {
        if (parsed.type === 'email') {
            await sendRealEmail(cleanIdentifier, rawOtp, type);
        }
        else {
            await sendRealSms(cleanIdentifier, rawOtp, type);
        }
        return {
            success: true,
            providerStatus: 'connected',
            message: `Verification code successfully dispatched to ${db.maskIdentifier(cleanIdentifier)}.`,
            maskedRecipient: db.maskIdentifier(cleanIdentifier),
            expiresInSeconds: 300,
            cooldownSeconds: 60,
        };
    }
    catch (deliveryError) {
        // If delivery fails, remove challenge to avoid locking out the user
        db.otpChallenges.delete(cleanIdentifier);
        console.error(`[OTP Delivery Failure] Failed to send to ${db.maskIdentifier(cleanIdentifier)}:`, deliveryError?.message || deliveryError);
        return {
            success: false,
            providerStatus: 'failed',
            error: `Provider delivery failed: ${deliveryError?.message || 'Carrier gateway rejected dispatch'}. Please verify contact address or provider credentials.`,
        };
    }
}
/**
 * Verifies an OTP securely against the stored bcrypt hash.
 * Enforces TTL, attempt limits, and single-use replay protection.
 */
export async function verifyOtpChallenge(identifier, rawOtp) {
    const parsed = parseIdentifier(identifier);
    if (!parsed.isValid) {
        return { success: false, error: parsed.error };
    }
    const cleanIdentifier = parsed.cleanIdentifier;
    const challenge = db.otpChallenges.get(cleanIdentifier);
    if (!challenge) {
        return {
            success: false,
            error: 'No active verification code found for this contact. Please request a new code.',
        };
    }
    if (Date.now() > challenge.expiresAt) {
        db.otpChallenges.delete(cleanIdentifier);
        return {
            success: false,
            error: 'This verification code has expired (validity is 5 minutes). Please request a new code.',
        };
    }
    if (challenge.attemptsRemaining <= 0) {
        db.otpChallenges.delete(cleanIdentifier);
        return {
            success: false,
            error: 'Maximum verification attempts exceeded. For security, please request a new verification code.',
        };
    }
    // Compare OTP with bcrypt hash
    const isMatch = await bcrypt.compare(String(rawOtp).trim(), challenge.otpHash);
    if (!isMatch) {
        challenge.attemptsRemaining -= 1;
        const remaining = challenge.attemptsRemaining;
        if (remaining <= 0) {
            db.otpChallenges.delete(cleanIdentifier);
            return {
                success: false,
                error: 'Incorrect code. Maximum attempts reached. Please request a new code.',
                attemptsRemaining: 0,
            };
        }
        return {
            success: false,
            error: `Incorrect verification code. ${remaining} attempt(s) remaining.`,
            attemptsRemaining: remaining,
        };
    }
    // Single-use verification token for the next step (PIN setup or reset)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    challenge.verified = true;
    challenge.verificationToken = verificationToken;
    challenge.verificationTokenExpiresAt = Date.now() + 15 * 60 * 1000; // 15 mins to complete set/reset PIN
    return {
        success: true,
        verificationToken,
    };
}
/**
 * Internal test helper to create an active challenge for unit tests
 * without logging secrets or needing network connectivity.
 */
export async function _createTestChallengeForUnitTests(identifier, type, plainOtp) {
    const parsed = parseIdentifier(identifier);
    const cleanIdentifier = parsed.cleanIdentifier;
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(plainOtp, salt);
    const challenge = {
        id: `test_${crypto.randomUUID().slice(0, 8)}`,
        identifier: cleanIdentifier,
        type,
        otpHash,
        expiresAt: Date.now() + OTP_TTL_MS,
        attemptsRemaining: MAX_VERIFY_ATTEMPTS,
        lastRequestedAt: Date.now(),
        requestCountInWindow: 1,
        windowStartedAt: Date.now(),
        verified: false,
    };
    db.otpChallenges.set(cleanIdentifier, challenge);
    return challenge;
}
