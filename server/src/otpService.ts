import './loadEnv.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { db, OtpChallenge } from './db.js';
import { isCredentialSet, getGatewayDiagnostics } from './loadEnv.js';

export type OtpDeliveryStatus = 
  | 'otp_generated'
  | 'provider_accepted'
  | 'provider_rejected'
  | 'delivery_confirmed'
  | 'delivery_unknown';

export interface OtpDispatchResult {
  success: boolean;
  deliveryStatus: OtpDeliveryStatus;
  providerAccepted: boolean;
  providerStatus: 'connected' | 'unconfigured' | 'failed';
  providerName?: string;
  providerReferenceId?: string;
  providerRawStatus?: string;
  message?: string;
  error?: string;
  warning?: string;
  instructions?: string;
  requiredCredentials?: string[];
  maskedRecipient?: string;
  expiresInSeconds?: number;
  cooldownSeconds?: number;
  attemptsRemaining?: number;
}

export interface OtpConfig {
  expirySeconds: number;
  resendCooldownSeconds: number;
  maxAttempts: number;
  rateLimitWindowMs: number;
  maxRequestsPerWindow: number;
}

export function getOtpConfig(): OtpConfig {
  return {
    expirySeconds: Number(process.env.OTP_EXPIRY_SECONDS) || 300, // 5 minutes default
    resendCooldownSeconds: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 60, // 60 seconds default
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS) || 5, // 5 verification attempts default
    rateLimitWindowMs: 60 * 60 * 1000, // 1 hour window
    maxRequestsPerWindow: 5, // max 5 requests per hour
  };
}

/**
 * Safe Diagnostic Logging (Never leaks raw OTPs, PINs, or credentials)
 */
export function logOtpDiagnostic(entry: {
  event: 'otp_requested' | 'provider_dispatched' | 'provider_failed' | 'otp_verified' | 'otp_verification_failed' | 'rate_limited' | 'challenge_expired';
  channel: 'email' | 'phone';
  maskedRecipient: string;
  providerName: string;
  referenceId?: string;
  details?: string;
  statusCode?: number;
}): void {
  const ts = new Date().toISOString();
  console.log(
    `[OTP-DIAGNOSTIC] ${ts} | Event: ${entry.event} | Channel: ${entry.channel.toUpperCase()} | Recipient: ${entry.maskedRecipient} | Provider: ${entry.providerName} | Status: ${entry.statusCode || 200}${entry.referenceId ? ` | RefId: ${entry.referenceId}` : ''}${entry.details ? ` | Info: ${entry.details}` : ''}`
  );
}

/**
 * Validates and normalizes Indian mobile numbers into 10-digit, MSG91 format, and international E.164 (+91) format.
 */
export function normalizePhone(raw?: string): {
  isValid: boolean;
  tenDigit: string;
  international: string;
  msg91Format: string;
  error?: string;
} {
  if (!raw || typeof raw !== 'string') {
    return { isValid: false, tenDigit: '', international: '', msg91Format: '', error: 'Registered mobile number is required.' };
  }

  const digitsOnly = raw.replace(/[\s-+()]/g, '');
  const tenDigit = digitsOnly.length > 10 && digitsOnly.startsWith('91')
    ? digitsOnly.slice(2)
    : digitsOnly.length > 10 && digitsOnly.startsWith('0')
    ? digitsOnly.slice(1)
    : digitsOnly;

  if (!/^[6-9]\d{9}$/.test(tenDigit)) {
    return {
      isValid: false,
      tenDigit: '',
      international: '',
      msg91Format: '',
      error: 'Please enter a valid 10-digit Indian mobile number (e.g. 9812345678, +91 98123 45678).',
    };
  }

  return {
    isValid: true,
    tenDigit,
    international: `+91${tenDigit}`,
    msg91Format: `91${tenDigit}`,
  };
}

/**
 * Validates and normalizes email addresses into lowercase trimmed format.
 */
export function normalizeEmail(raw?: string): {
  isValid: boolean;
  normalized: string;
  error?: string;
} {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return { isValid: true, normalized: '' };
  }

  const trimmed = raw.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, normalized: '', error: 'Please enter a valid email address.' };
  }

  return { isValid: true, normalized: trimmed };
}

/**
 * Validates and normalizes contact identifier.
 */
export function parseIdentifier(raw: string): {
  isValid: boolean;
  type: 'email' | 'phone' | 'invalid';
  cleanIdentifier: string;
  error?: string;
} {
  if (!raw || typeof raw !== 'string') {
    return { isValid: false, type: 'invalid', cleanIdentifier: '', error: 'Contact identifier is required.' };
  }

  const trimmed = raw.trim();

  // Email format check
  if (trimmed.includes('@')) {
    const emailRes = normalizeEmail(trimmed);
    if (!emailRes.isValid) {
      return { isValid: false, type: 'invalid', cleanIdentifier: '', error: emailRes.error };
    }
    return { isValid: true, type: 'email', cleanIdentifier: emailRes.normalized };
  }

  // Indian Phone format check (+91 or 0 prefix optional)
  const phoneRes = normalizePhone(trimmed);
  if (!phoneRes.isValid) {
    return {
      isValid: false,
      type: 'invalid',
      cleanIdentifier: '',
      error: 'Please enter a valid 10-digit Indian mobile number (e.g., 9876543210) or email address.',
    };
  }

  return { isValid: true, type: 'phone', cleanIdentifier: phoneRes.tenDigit };
}

/**
 * Checks provider readiness from environment variables.
 * Prefers Resend for Email and MSG91 for Indian SMS per system specifications.
 */
export function checkProviderConfig(type: 'email' | 'phone'): {
  isConfigured: boolean;
  provider: 'resend' | 'smtp' | 'msg91' | 'twilio' | 'none';
  providerName: string;
  requiredCredentials: string[];
  missingCredentials?: string[];
} {
  const diag = getGatewayDiagnostics();
  if (type === 'email') {
    return {
      isConfigured: diag.email.configured,
      provider: diag.email.configured ? (diag.email.activeProvider as 'resend' | 'smtp') : 'none',
      providerName: diag.email.providerName,
      requiredCredentials: ['RESEND_API_KEY', 'EMAIL_FROM'],
      missingCredentials: diag.email.missingCredentials,
    };
  } else {
    return {
      isConfigured: diag.sms.configured,
      provider: diag.sms.configured ? (diag.sms.activeProvider as 'msg91' | 'twilio') : 'none',
      providerName: diag.sms.providerName,
      requiredCredentials: ['MSG91_AUTH_KEY', 'MSG91_TEMPLATE_ID'],
      missingCredentials: diag.sms.missingCredentials,
    };
  }
}

/**
 * Professional Griha Saathi Email Template Generator
 */
function generateEmailContent(rawOtp: string, type: string): { subject: string; text: string; html: string } {
  const subjectPrefix = 
    type === 'recovery' 
      ? 'Security PIN Recovery' 
      : type === 'contact_update' 
      ? 'Verify New Contact' 
      : 'Account Registration';

  const subject = `Your Griha Saathi Verification Code: ${rawOtp} [${subjectPrefix}]`;

  const text = `Your Griha Saathi verification code is: ${rawOtp}\n\nThis single-use code is valid for 5 minutes for ${subjectPrefix}.\n\nSECURITY REMINDER: Griha Saathi staff will never ask for your verification code or 4-digit PIN. Never share this code with anyone.\n\nGriha Saathi — Trustworthy Housing Platform (Jammu & Kashmir, Haryana, Punjab, Himachal Pradesh, Delhi NCR)`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 24px; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; background-color: #06140F; color: #E6EFE9;">
        <div style="max-width: 560px; margin: 0 auto; background: #0B2217; border: 1px solid rgba(52, 211, 153, 0.28); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #10261A 0%, #06140F 100%); padding: 28px 24px 20px; text-align: center; border-bottom: 1px solid rgba(52, 211, 153, 0.15);">
            <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; margin: 0;">GRIHA SAATHI</h1>
            <p style="color: #E5A955; font-size: 13px; font-weight: 600; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 1px;">गृह साथी &bull; Trustworthy Rental Housing Platform</p>
          </div>

          <!-- Body Content -->
          <div style="padding: 32px 28px; text-align: center;">
            <p style="font-size: 15px; color: #9CA3AF; margin: 0 0 16px;">
              Your one-time security verification code for <strong style="color: #34D399;">${subjectPrefix}</strong> is:
            </p>

            <div style="background: #06140F; border: 2px solid #10B981; border-radius: 12px; padding: 18px 24px; display: inline-block; margin: 8px 0 20px;">
              <span style="font-family: 'Courier New', monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #34D399;">
                ${rawOtp}
              </span>
            </div>

            <p style="font-size: 13px; color: #D1D5DB; margin: 12px 0 20px;">
              Valid for <strong style="color: #FFFFFF;">5 minutes</strong>. This single-use code will expire automatically.
            </p>

            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 12px; font-size: 12px; color: #FCA5A5; text-align: left; line-height: 1.45;">
              <strong>Security Advisory:</strong> Griha Saathi will never contact you to ask for this code or your 4-digit PIN. Do not share this OTP with anyone, including brokers or property owners.
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #06140F; padding: 18px 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06);">
            <p style="font-size: 11px; color: #6B7280; margin: 0;">
              Serving Northern Bharat: Jammu &amp; Kashmir &bull; Haryana &bull; Punjab &bull; Himachal Pradesh &bull; Delhi NCR
            </p>
            <p style="font-size: 11px; color: #4B5563; margin: 6px 0 0;">
              &copy; Griha Saathi Housing Network. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return { subject, text, html };
}

/**
 * Dispatches live email via Resend API (https://resend.com)
 */
async function sendResendEmail(toEmail: string, rawOtp: string, type: string): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'YOUR_RESEND_API_KEY') {
    throw new Error('Resend API key is not configured.');
  }

  const { subject, text, html } = generateEmailContent(rawOtp, type);

  // If sender is not specified or using placeholder, default to verified domain or onboarding@resend.dev
  let sender = process.env.EMAIL_FROM || 'Griha Saathi Security <onboarding@resend.dev>';
  if (sender.includes('noreply@grihasaathi.in') && !process.env.RESEND_DOMAIN_VERIFIED) {
    // If user has not yet verified grihasaathi.in on Resend, onboarding@resend.dev works for account-verified testing
    sender = 'Griha Saathi Security <onboarding@resend.dev>';
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: sender,
      to: [toEmail.toLowerCase().trim()],
      subject,
      text,
      html,
    }),
  });

  const responseText = await response.text();
  let responseData: any = {};
  try {
    responseData = JSON.parse(responseText);
  } catch {
    // Non-JSON response
  }

  if (!response.ok || responseData?.statusCode >= 400 || responseData?.name === 'validation_error' || responseData?.error) {
    const errorMsg = responseData?.message || responseData?.error || responseText || 'Resend HTTP delivery failure';
    const statusCode = response.status || responseData?.statusCode || 500;
    
    // Provide actionable feedback for domain and authentication errors
    if (statusCode === 403 && (errorMsg.includes('domain') || errorMsg.includes('verify') || errorMsg.includes('only send testing emails'))) {
      throw new Error(`Resend Domain Notice: ${errorMsg}. Set EMAIL_FROM to an authorized domain or verify domain in Resend dashboard.`);
    }
    if (statusCode === 401) {
      throw new Error('Resend Authentication Error: Invalid API key provided in RESEND_API_KEY.');
    }
    throw new Error(`Resend API Error (${statusCode}): ${errorMsg}`);
  }

  const messageId = responseData?.id;
  if (!messageId) {
    throw new Error('Resend Gateway Error: Provider response did not contain a valid message id.');
  }

  return messageId;
}

/**
 * Checks email delivery event status via Resend API
 */
export async function checkResendDeliveryStatus(messageId: string): Promise<{ status: string; event?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'YOUR_RESEND_API_KEY') {
    return { status: 'unknown' };
  }
  try {
    const res = await fetch(`https://api.resend.com/emails/${messageId}`, {
      headers: { Authorization: `Bearer ${apiKey.trim()}` },
    });
    if (res.ok) {
      const data = await res.json();
      return { status: data.status || data.last_event || 'accepted', event: data.last_event };
    }
  } catch {}
  return { status: 'unknown' };
}

/**
 * Dispatches live email via Nodemailer SMTP (AWS SES, SendGrid, Postmark, Google Workspace)
 */
async function sendSmtpEmail(toEmail: string, rawOtp: string, type: string): Promise<string> {
  const { subject, text, html } = generateEmailContent(rawOtp, type);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Griha Saathi Security" <noreply@grihasaathi.in>',
    to: toEmail.toLowerCase().trim(),
    subject,
    text,
    html,
  });

  if (!info.messageId) {
    throw new Error('SMTP Server Error: No messageId returned by MTA.');
  }

  return info.messageId;
}

/**
 * Dispatches live Indian SMS via MSG91 OTP API (TRAI DLT Compliant)
 */
async function sendMsg91Sms(phone10Digit: string, rawOtp: string, type: string): Promise<string> {
  const authKey = (process.env.MSG91_AUTH_KEY || process.env.SMS_GATEWAY_API_KEY || '').trim();
  if (!isCredentialSet(authKey, ['YOUR_MSG91_AUTH_KEY', 'YOUR_SMS_API_KEY'])) {
    throw new Error('MSG91 Auth Key is not configured in .env.');
  }

  const templateId = (process.env.MSG91_TEMPLATE_ID || process.env.SMS_DLT_TEMPLATE_ID || '').trim();
  if (!isCredentialSet(templateId, ['YOUR_MSG91_TEMPLATE_ID', 'YOUR_MSG91_DLT_TEMPLATE_ID'])) {
    throw new Error('MSG91 Template ID is not configured in .env.');
  }
  const mobileWithCountryCode = `91${phone10Digit}`; // MSG91 requires 91XXXXXXXXXX without '+'

  // MSG91 v5 OTP Endpoint
  const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(templateId)}&mobile=${encodeURIComponent(mobileWithCountryCode)}&authkey=${encodeURIComponent(authKey.trim())}&otp=${encodeURIComponent(rawOtp)}&otp_expiry=5`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'authkey': authKey.trim(),
    },
    body: JSON.stringify({
      otp: rawOtp,
      template_id: templateId,
      mobile: mobileWithCountryCode,
      otp_expiry: 5,
    }),
  });

  const responseText = await response.text();
  let responseData: any = {};
  try {
    responseData = JSON.parse(responseText);
  } catch {
    // Non-JSON response
  }

  const isMsg91Error = 
    !response.ok || 
    responseData?.type === 'error' || 
    responseData?.hasError === true || 
    responseData?.status === 'fail' || 
    responseData?.status === 'error';

  if (isMsg91Error) {
    const errorMsg = responseData?.message || responseData?.errors?.[0] || responseText || 'MSG91 gateway rejected SMS dispatch.';
    if (errorMsg.toLowerCase().includes('auth') || errorMsg.toLowerCase().includes('key')) {
      throw new Error('MSG91 Authentication Error: Invalid authkey. Please check MSG91_AUTH_KEY in .env.');
    }
    if (errorMsg.toLowerCase().includes('balance') || errorMsg.toLowerCase().includes('credit')) {
      throw new Error('MSG91 Gateway Notice: Insufficient SMS credits on account.');
    }
    if (errorMsg.toLowerCase().includes('template')) {
      throw new Error(`MSG91 DLT Template Notice: ${errorMsg}. Please verify MSG91_TEMPLATE_ID.`);
    }
    throw new Error(`MSG91 Rejection (${response.status}): ${errorMsg}`);
  }

  const requestId = responseData?.request_id || responseData?.message_id;
  if (!requestId) {
    throw new Error(`MSG91 Protocol Error: Gateway did not return a valid request_id or message_id.`);
  }

  return String(requestId);
}

/**
 * Dispatches live SMS via Twilio Carrier Gateway
 */
async function sendTwilioSms(phone10Digit: string, rawOtp: string, type: string): Promise<string> {
  const e164 = `+91${phone10Digit}`;
  const messageBody = `Your Griha Saathi verification code is ${rawOtp}. Valid for 5 minutes. Do not share. GRHSAT`;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    throw new Error('Twilio credentials incomplete in .env.');
  }

  const authHeader = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');
  const params = new URLSearchParams();
  params.append('To', e164);
  params.append('From', from);
  params.append('Body', messageBody);

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  );

  const responseText = await response.text();
  let responseData: any = {};
  try {
    responseData = JSON.parse(responseText);
  } catch {}

  if (!response.ok || responseData?.status === 'failed' || responseData?.status === 'undelivered' || !responseData?.sid) {
    throw new Error(`Twilio Error (${response.status}): ${responseData?.message || responseText || 'Twilio rejected dispatch'}`);
  }

  return responseData.sid;
}

/**
 * Creates, hashes, rate-limits, and dispatches a cryptographically secure 6-digit OTP.
 * ENFORCES ZERO-PHANTOM-CHALLENGE INVARIANT:
 * Challenge is strictly committed to database ONLY when upstream provider confirms acceptance.
 */
export async function createAndDispatchOtp(
  identifier: string,
  type: 'registration' | 'recovery' | 'contact_update',
  metadata?: OtpChallenge['metadata']
): Promise<OtpDispatchResult> {
  const config = getOtpConfig();
  const parsed = parseIdentifier(identifier);

  if (!parsed.isValid) {
    return {
      success: false,
      deliveryStatus: 'provider_rejected',
      providerAccepted: false,
      providerStatus: 'failed',
      error: parsed.error,
    };
  }

  const cleanIdentifier = parsed.cleanIdentifier;
  const now = Date.now();
  const existingChallenge = db.otpChallenges.get(cleanIdentifier);

  // 1. Resend cooldown check
  const cooldownMs = config.resendCooldownSeconds * 1000;
  if (existingChallenge && now - existingChallenge.lastRequestedAt < cooldownMs) {
    const secondsLeft = Math.ceil((cooldownMs - (now - existingChallenge.lastRequestedAt)) / 1000);
    return {
      success: false,
      deliveryStatus: 'provider_rejected',
      providerAccepted: false,
      providerStatus: 'failed',
      error: `Please wait ${secondsLeft} second(s) before requesting another verification code.`,
      cooldownSeconds: secondsLeft,
      maskedRecipient: db.maskIdentifier(cleanIdentifier),
    };
  }

  // 2. Hourly rate limit check
  let requestCountInWindow = 1;
  let windowStartedAt = now;

  if (existingChallenge) {
    if (now - existingChallenge.windowStartedAt < config.rateLimitWindowMs) {
      requestCountInWindow = existingChallenge.requestCountInWindow + 1;
      windowStartedAt = existingChallenge.windowStartedAt;

      if (requestCountInWindow > config.maxRequestsPerWindow) {
        const minutesLeft = Math.ceil((config.rateLimitWindowMs - (now - windowStartedAt)) / 60000);
        logOtpDiagnostic({
          event: 'rate_limited',
          channel: parsed.type as 'email' | 'phone',
          maskedRecipient: db.maskIdentifier(cleanIdentifier),
          providerName: 'Internal Throttler',
          details: `Exceeded ${config.maxRequestsPerWindow} requests/hour`,
        });
        return {
          success: false,
          deliveryStatus: 'provider_rejected',
          providerAccepted: false,
          providerStatus: 'failed',
          error: `Too many verification requests for this contact. Please try again after ${minutesLeft} minute(s).`,
          maskedRecipient: db.maskIdentifier(cleanIdentifier),
        };
      }
    }
  }

  // 3. Provider Configuration Verification
  const providerCheck = checkProviderConfig(parsed.type as 'email' | 'phone');
  if (!providerCheck.isConfigured) {
    logOtpDiagnostic({
      event: 'provider_failed',
      channel: parsed.type as 'email' | 'phone',
      maskedRecipient: db.maskIdentifier(cleanIdentifier),
      providerName: providerCheck.providerName,
      statusCode: 503,
      details: 'Missing credentials in environment',
    });

    const missing = providerCheck.missingCredentials && providerCheck.missingCredentials.length > 0
      ? providerCheck.missingCredentials
      : providerCheck.requiredCredentials;

    return {
      success: false,
      deliveryStatus: 'provider_rejected',
      providerAccepted: false,
      providerStatus: 'unconfigured',
      providerName: providerCheck.providerName,
      error: `${providerCheck.providerName} credentials are not configured on this server.`,
      warning: `To dispatch real verification OTPs, configure the credentials in your server .env file.`,
      instructions: `Please provide: ${missing.join(', ')} in .env.`,
      requiredCredentials: missing,
      maskedRecipient: db.maskIdentifier(cleanIdentifier),
    };
  }

  // 4. Generate cryptographically unpredictable 6-digit OTP (state: otp_generated)
  const rawOtp = crypto.randomInt(100000, 1000000).toString();
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(rawOtp, salt);

  // 5. Live Provider Gateway Dispatch
  try {
    let referenceId: string = '';

    if (parsed.type === 'email') {
      if (providerCheck.provider === 'resend') {
        referenceId = await sendResendEmail(cleanIdentifier, rawOtp, type);
      } else {
        referenceId = await sendSmtpEmail(cleanIdentifier, rawOtp, type);
      }
    } else {
      if (providerCheck.provider === 'msg91') {
        referenceId = await sendMsg91Sms(cleanIdentifier, rawOtp, type);
      } else {
        referenceId = await sendTwilioSms(cleanIdentifier, rawOtp, type);
      }
    }

    if (!referenceId) {
      throw new Error(`${providerCheck.providerName} did not return a valid tracking reference ID.`);
    }

    // 6. Upstream Provider Accepted! NOW commit challenge to database
    const challenge: OtpChallenge = {
      id: `otp_${crypto.randomUUID().slice(0, 8)}`,
      identifier: cleanIdentifier,
      type,
      otpHash,
      expiresAt: now + config.expirySeconds * 1000,
      attemptsRemaining: config.maxAttempts,
      lastRequestedAt: now,
      requestCountInWindow,
      windowStartedAt,
      verified: false,
      provider: providerCheck.provider,
      providerReferenceId: referenceId,
      deliveryStatus: 'provider_accepted',
      metadata,
    };
    db.otpChallenges.set(cleanIdentifier, challenge);
  db.saveChallengesToDisk();
    db.saveChallengesToDisk();

    logOtpDiagnostic({
      event: 'provider_dispatched',
      channel: parsed.type as 'email' | 'phone',
      maskedRecipient: db.maskIdentifier(cleanIdentifier),
      providerName: providerCheck.providerName,
      referenceId,
      details: 'Dispatched successfully and accepted by upstream gateway',
    });

    return {
      success: true,
      deliveryStatus: 'provider_accepted',
      providerAccepted: true,
      providerStatus: 'connected',
      providerName: providerCheck.providerName,
      providerReferenceId: referenceId,
      message: `Verification code request accepted by ${providerCheck.providerName} (Tracking ID: ${referenceId}).`,
      maskedRecipient: db.maskIdentifier(cleanIdentifier),
      expiresInSeconds: config.expirySeconds,
      cooldownSeconds: config.resendCooldownSeconds,
      attemptsRemaining: config.maxAttempts,
    };
  } catch (deliveryError: any) {
    // Delivery rejected / failed: ensure no challenge exists in database
    db.otpChallenges.delete(cleanIdentifier);
    db.saveChallengesToDisk();

    logOtpDiagnostic({
      event: 'provider_failed',
      channel: parsed.type as 'email' | 'phone',
      maskedRecipient: db.maskIdentifier(cleanIdentifier),
      providerName: providerCheck.providerName,
      statusCode: 502,
      details: deliveryError?.message || 'Gateway connection failed',
    });

    return {
      success: false,
      deliveryStatus: 'provider_rejected',
      providerAccepted: false,
      providerStatus: 'failed',
      providerName: providerCheck.providerName,
      error: `Delivery failed via ${providerCheck.providerName}: ${deliveryError?.message || 'Provider gateway rejected dispatch.'}`,
      maskedRecipient: db.maskIdentifier(cleanIdentifier),
    };
  }
}

/**
 * Verifies an OTP securely against the stored bcrypt hash.
 * Enforces TTL, attempt limits, and single-use replay protection.
 */
export async function verifyOtpChallenge(
  identifier: string,
  rawOtp: string,
  expectedType?: 'registration' | 'recovery' | 'contact_update'
): Promise<{
  success: boolean;
  error?: string;
  verificationToken?: string;
  attemptsRemaining?: number;
}> {
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

  // Purpose validation (prevent registration OTP from being used for PIN recovery)
  if (expectedType && challenge.type !== expectedType) {
    return {
      success: false,
      error: `This verification code was issued for ${challenge.type} and cannot be used for ${expectedType}.`,
    };
  }

  // Expiry check
  if (Date.now() > challenge.expiresAt) {
    db.otpChallenges.delete(cleanIdentifier);
    db.saveChallengesToDisk();
    logOtpDiagnostic({
      event: 'challenge_expired',
      channel: parsed.type as 'email' | 'phone',
      maskedRecipient: db.maskIdentifier(cleanIdentifier),
      providerName: challenge.provider || 'Internal',
    });
    return {
      success: false,
      error: 'This verification code has expired (validity is 5 minutes). Please request a new code.',
    };
  }

  // Max attempts check
  if (challenge.attemptsRemaining <= 0) {
    db.otpChallenges.delete(cleanIdentifier);
    db.saveChallengesToDisk();
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

    logOtpDiagnostic({
      event: 'otp_verification_failed',
      channel: parsed.type as 'email' | 'phone',
      maskedRecipient: db.maskIdentifier(cleanIdentifier),
      providerName: challenge.provider || 'Internal',
      details: `${remaining} attempts remaining`,
    });

    if (remaining <= 0) {
      db.otpChallenges.delete(cleanIdentifier);
    db.saveChallengesToDisk();
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
  db.saveChallengesToDisk();

  logOtpDiagnostic({
    event: 'otp_verified',
    channel: parsed.type as 'email' | 'phone',
    maskedRecipient: db.maskIdentifier(cleanIdentifier),
    providerName: challenge.provider || 'Internal',
    referenceId: challenge.providerReferenceId,
  });

  return {
    success: true,
    verificationToken,
  };
}

/**
 * Internal test helper to create an active challenge for unit tests
 * without logging secrets or needing network connectivity.
 */
export async function _createTestChallengeForUnitTests(
  identifier: string,
  type: 'registration' | 'recovery' | 'contact_update',
  plainOtp: string
): Promise<OtpChallenge> {
  const config = getOtpConfig();
  const parsed = parseIdentifier(identifier);
  const cleanIdentifier = parsed.cleanIdentifier;
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(plainOtp, salt);

  const challenge: OtpChallenge = {
    id: `test_${crypto.randomUUID().slice(0, 8)}`,
    identifier: cleanIdentifier,
    type,
    otpHash,
    expiresAt: Date.now() + config.expirySeconds * 1000,
    attemptsRemaining: config.maxAttempts,
    lastRequestedAt: Date.now(),
    requestCountInWindow: 1,
    windowStartedAt: Date.now(),
    verified: false,
    provider: 'unit_test',
  };
  db.otpChallenges.set(cleanIdentifier, challenge);
  db.saveChallengesToDisk();
  return challenge;
}
