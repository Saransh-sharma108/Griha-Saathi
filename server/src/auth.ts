import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db, UserRecord, OtpChallenge } from './db.js';
import { 
  createAndDispatchOtp, 
  verifyOtpChallenge, 
  parseIdentifier, 
  checkProviderConfig,
  normalizePhone,
  normalizeEmail
} from './otpService.js';
import { AuthenticatedRequest, authenticateUser, requireAuth } from './middleware.js';
import { UserRole, SupportedLanguage } from '../../shared/types.js';
import { storeUploadedFile } from './storageService.js';
import { getGatewayDiagnostics, getMsg91Diagnostic } from './loadEnv.js';

export const authRouter = Router();

authRouter.use(authenticateUser);

const MAX_PIN_FAILURES = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const ALLOWED_PUBLIC_ROLES: UserRole[] = [
  'tenant',
  'owner',
  'agent',
  'builder',
  'property_manager',
];

const ipRateLimitMap = new Map<string, number[]>();

function checkIpRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (ipRateLimitMap.get(key) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxAttempts) {
    return false;
  }
  timestamps.push(now);
  ipRateLimitMap.set(key, timestamps);
  return true;
}

function setSessionCookie(res: Response, token: string) {
  res.cookie('gs_session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: SESSION_TTL_MS,
    path: '/',
  });
}

function clearSessionCookie(res: Response) {
  res.clearCookie('gs_session_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
  });
}

/**
 * 1. Register New User & Initiate Verification OTP
 */
authRouter.post('/register', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      fullName, 
      phone, 
      email, 
      otpChannel = 'sms', 
      termsAccepted, 
      roles, 
      preferredLanguage 
    } = req.body;

    // 1. Terms & Privacy Acceptance Check
    if (!termsAccepted) {
      return res.status(400).json({
        success: false,
        error: 'You must accept the Terms of Service and Privacy Policy to register an account.',
      });
    }

    // 2. Full Name Validation
    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Full Name is required for account registration.',
      });
    }

    // 3. Contact Methods Validation: At least one must be supplied
    const cleanPhone = phone ? String(phone).trim() : '';
    const cleanEmail = email ? String(email).trim() : '';

    if (!cleanPhone && !cleanEmail) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least one contact method: Indian mobile number or email address.',
      });
    }

    // Strict validation if phone is provided
    let phoneParsed: ReturnType<typeof normalizePhone> = { isValid: false, tenDigit: '', international: '', msg91Format: '' };
    if (cleanPhone) {
      phoneParsed = normalizePhone(cleanPhone);
      if (!phoneParsed.isValid) {
        return res.status(400).json({
          success: false,
          error: phoneParsed.error || 'Please provide a valid 10-digit Indian mobile number.',
        });
      }
    }

    // Strict validation if email is provided
    let emailParsed: ReturnType<typeof normalizeEmail> = { isValid: false, normalized: '' };
    if (cleanEmail) {
      emailParsed = normalizeEmail(cleanEmail);
      if (!emailParsed.isValid) {
        return res.status(400).json({
          success: false,
          error: emailParsed.error || 'Please provide a valid email address.',
        });
      }
    }

    // Mandatory channel-specific contact check
    if (otpChannel === 'sms' || otpChannel === 'phone') {
      if (!cleanPhone || !phoneParsed.isValid) {
        return res.status(400).json({
          success: false,
          error: 'An Indian mobile number is mandatory when selecting SMS as your OTP delivery channel.',
        });
      }
    } else if (otpChannel === 'email') {
      if (!cleanEmail || !emailParsed.isValid || !emailParsed.normalized) {
        return res.status(400).json({
          success: false,
          error: 'An email address is mandatory when selecting Email as your OTP delivery channel.',
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Please select a valid OTP delivery channel: sms or email.',
      });
    }

    // 4. Unique Database Constraints (Prevent Duplicate Registration)
    if (cleanPhone && phoneParsed.isValid) {
      const existingByPhone = db.findUserByPhone(phoneParsed.tenDigit);
      if (existingByPhone) {
        return res.status(409).json({
          success: false,
          error: 'An account is already registered with this mobile number. Please sign in or use Forgot PIN.',
        });
      }
    }

    if (cleanEmail && emailParsed.isValid && emailParsed.normalized) {
      const existingByEmail = db.findUserByEmail(emailParsed.normalized);
      if (existingByEmail) {
        return res.status(409).json({
          success: false,
          error: 'An account is already registered with this email address. Please sign in or use Forgot PIN.',
        });
      }
    }

    // 5. Assigned Roles Validation
    const assignedRoles: UserRole[] = [];
    if (Array.isArray(roles)) {
      for (const r of roles) {
        if (ALLOWED_PUBLIC_ROLES.includes(r as UserRole) && !assignedRoles.includes(r as UserRole)) {
          assignedRoles.push(r as UserRole);
        }
      }
    }
    if (assignedRoles.length === 0) {
      assignedRoles.push('tenant');
    }

    // 6. Dispatch Real Verification OTP to the Chosen Channel
    const destination = otpChannel === 'email' ? emailParsed.normalized : phoneParsed.tenDigit;
    const result = await createAndDispatchOtp(destination, 'registration', {
      fullName: fullName.trim(),
      registeredPhone: cleanPhone && phoneParsed.isValid ? phoneParsed.tenDigit : undefined,
      normalizedPhone: cleanPhone && phoneParsed.isValid ? phoneParsed.international : undefined,
      registeredEmail: cleanEmail && emailParsed.isValid ? emailParsed.normalized : undefined,
      normalizedEmail: cleanEmail && emailParsed.isValid ? emailParsed.normalized : undefined,
      otpChannel: otpChannel === 'email' ? 'email' : 'sms',
      roles: assignedRoles,
      termsAccepted: true,
      preferredLanguage: (preferredLanguage as SupportedLanguage) || 'en',
    });

    if (!result.success || !result.providerAccepted) {
      const statusCode = result.providerStatus === 'unconfigured' ? 503 : 502;
      return res.status(statusCode).json(result);
    }

    return res.status(200).json({
      ...result,
      otpChannel,
      registeredPhone: cleanPhone && phoneParsed.isValid ? db.maskIdentifier(phoneParsed.tenDigit) : undefined,
      registeredEmail: cleanEmail && emailParsed.isValid ? db.maskIdentifier(emailParsed.normalized) : undefined,
      destinationContact: destination,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/register:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error processing registration request.',
    });
  }
});

/**
 * 2. Request / Send OTP (Generic & Resend Endpoint)
 */
const handleSendOtp = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { identifier, type = 'registration' } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid Indian 10-digit mobile number or email address.',
      });
    }

    const otpType = type === 'recovery' || type === 'contact_update' ? type : 'registration';
    const result = await createAndDispatchOtp(identifier, otpType);

    if (!result.success || !result.providerAccepted) {
      const statusCode = result.providerStatus === 'unconfigured' ? 503 : 502;
      return res.status(statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in /api/auth/send-otp:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error processing verification request.',
    });
  }
};

authRouter.post('/send-otp', handleSendOtp);
authRouter.post('/request-otp', handleSendOtp);

/**
 * Dedicated MSG91 Server-Side Configuration Diagnostic
 * Reports strictly:
 *   - MSG91_AUTH_KEY configured: true/false
 *   - MSG91_TEMPLATE_ID configured: true/false
 *   - Loaded environment file path
 *   - Backend working directory
 * NEVER leaks actual secret values.
 */
authRouter.get('/diagnostic/msg91', (req: AuthenticatedRequest, res: Response) => {
  const diag = getMsg91Diagnostic();
  return res.status(200).json(diag);
});

/**
 * Safe Gateway Configuration Diagnostic
 * Strictly reports boolean configuration state of environment variables (true/false).
 * Never leaks actual keys, secrets, or credential tokens.
 */
authRouter.get('/diagnostic/providers', (req: AuthenticatedRequest, res: Response) => {
  const diag = getGatewayDiagnostics();
  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: {
      activeEnvFile: diag.envFile.activePath,
      loadedFiles: diag.envFile.loadedFiles,
      nodeEnv: process.env.NODE_ENV || 'development',
    },
    smsGateway: {
      provider: diag.sms.providerName,
      configured: diag.sms.configured,
      variables: {
        MSG91_AUTH_KEY: diag.sms.variables.MSG91_AUTH_KEY,
        MSG91_TEMPLATE_ID: diag.sms.variables.MSG91_TEMPLATE_ID,
        MSG91_SENDER_ID: diag.sms.variables.MSG91_SENDER_ID,
      },
      missingCredentials: diag.sms.missingCredentials,
    },
    emailGateway: {
      provider: diag.email.providerName,
      configured: diag.email.configured,
      variables: {
        RESEND_API_KEY: diag.email.variables.RESEND_API_KEY,
        EMAIL_FROM: diag.email.variables.EMAIL_FROM,
      },
      missingCredentials: diag.email.missingCredentials,
    },
  });
});

/**
 * 3. Verify OTP
 */
authRouter.post('/verify-otp', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { identifier, otp, type } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Contact identifier and 6-digit OTP code are required.',
      });
    }

    const expectedType = type === 'recovery' || type === 'contact_update' ? type : undefined;
    const result = await verifyOtpChallenge(identifier, String(otp), expectedType);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: 'Contact verified successfully.',
      verificationToken: result.verificationToken,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/verify-otp:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error verifying OTP code.',
    });
  }
});

/**
 * 4. Create / Set 4-digit Security PIN & Complete Registration / Profile
 */
const handleCreateOrSetPin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      identifier, 
      verificationToken, 
      pin, 
      confirmPin, 
      roles, 
      fullName, 
      preferredLanguage 
    } = req.body;

    if (!verificationToken || !pin) {
      return res.status(400).json({
        success: false,
        error: 'Verification token and 4-digit security PIN are required.',
      });
    }

    if (!/^\d{4}$/.test(String(pin))) {
      return res.status(400).json({
        success: false,
        error: 'Security PIN must be exactly 4 numeric digits (0000 - 9999).',
      });
    }

    if (confirmPin && String(pin) !== String(confirmPin)) {
      return res.status(400).json({
        success: false,
        error: 'PIN confirmation does not match the entered PIN.',
      });
    }

    // Locate challenge by verificationToken (or by identifier)
    let matchedChallenge: OtpChallenge | undefined;
    let challengeKey: string | undefined;

    if (identifier) {
      const parsed = parseIdentifier(identifier);
      if (parsed.isValid) {
        const ch = db.otpChallenges.get(parsed.cleanIdentifier);
        if (ch && ch.verificationToken === verificationToken) {
          matchedChallenge = ch;
          challengeKey = parsed.cleanIdentifier;
        }
      }
    }

    if (!matchedChallenge) {
      for (const [key, ch] of db.otpChallenges.entries()) {
        if (ch.verificationToken === verificationToken) {
          matchedChallenge = ch;
          challengeKey = key;
          break;
        }
      }
    }

    if (
      !matchedChallenge || 
      !matchedChallenge.verified || 
      (matchedChallenge.verificationTokenExpiresAt && Date.now() > matchedChallenge.verificationTokenExpiresAt)
    ) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired verification token. Please verify your contact via OTP first.',
      });
    }

    // Invalidate challenge immediately (strict single-use replay protection)
    if (challengeKey) {
      db.otpChallenges.delete(challengeKey);
      db.saveChallengesToDisk();
    }

    // Hash the 4-digit PIN securely with bcrypt (salt 10)
    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(String(pin), salt);

    const metadata = matchedChallenge.metadata;
    const isEmail = matchedChallenge.identifier.includes('@');
    const lookupContact = metadata?.registeredPhone || metadata?.registeredEmail || matchedChallenge.identifier;

    // Check if user already exists
    let user = db.findUserByIdentifier(lookupContact);

    if (user) {
      // User exists (e.g. updating PIN or reset flow)
      user.pinHash = pinHash;
      user.pinChangedAt = new Date().toISOString();
      user.failedPinAttempts = 0;
      user.lockoutUntil = undefined;
      user.updatedAt = new Date().toISOString();
      if (fullName && typeof fullName === 'string' && fullName.trim().length > 0) {
        user.fullName = fullName.trim();
      }
      db.saveUsersToDisk();
      db.logAuditEvent(user.id, 'pin_reset', 'Security PIN established after OTP verification.', req.ip, req.get('user-agent'));
    } else {
      // New User Registration
      const assignedRoles: UserRole[] = [];
      const roleSource = metadata?.roles || roles;
      if (Array.isArray(roleSource)) {
        for (const r of roleSource) {
          if (ALLOWED_PUBLIC_ROLES.includes(r as UserRole) && !assignedRoles.includes(r as UserRole)) {
            assignedRoles.push(r as UserRole);
          }
        }
      }
      if (assignedRoles.length === 0) {
        assignedRoles.push('tenant');
      }

      const activeRole = assignedRoles[0];
      const registeredPhone = metadata?.registeredPhone || (!isEmail ? matchedChallenge.identifier : undefined);
      const normalizedPhone = metadata?.normalizedPhone || (registeredPhone ? `+91${registeredPhone}` : undefined);
      const registeredEmail = metadata?.registeredEmail || (isEmail ? matchedChallenge.identifier : undefined);
      const normalizedEmail = metadata?.normalizedEmail || registeredEmail?.toLowerCase();

      // STRICT VERIFICATION STATUS DIRECTIVE:
      // If user registers using email OTP: email is verified, mobile is unverified until SMS verification.
      // If user registers using SMS OTP: mobile is verified, email is unverified until email verification.
      const isSmsChannel = metadata?.otpChannel === 'sms' || (!metadata?.otpChannel && !isEmail);
      const isEmailChannel = metadata?.otpChannel === 'email' || (!metadata?.otpChannel && isEmail);

      user = {
        id: `usr_${crypto.randomUUID().slice(0, 8)}`,
        identifier: registeredPhone || registeredEmail || matchedChallenge.identifier,
        phone: registeredPhone,
        normalizedPhone,
        email: registeredEmail,
        normalizedEmail,
        role: activeRole,
        activeRole: activeRole,
        roles: assignedRoles,
        fullName: metadata?.fullName || (fullName && typeof fullName === 'string' && fullName.trim() ? fullName.trim() : undefined),
        preferredLanguage: metadata?.preferredLanguage || (preferredLanguage as SupportedLanguage) || 'en',
        notificationPreferences: {
          emailAlerts: true,
          smsAlerts: true,
          propertyInquiries: true,
          securityAlerts: true,
          savedSearchAlerts: true,
        },
        pinHash,
        isPhoneVerified: isSmsChannel,
        isEmailVerified: isEmailChannel,
        isIdentityVerified: false,
        accountStatus: 'active',
        termsAcceptedAt: metadata?.termsAccepted ? new Date().toISOString() : undefined,
        otpPreference: metadata?.otpChannel || (isEmail ? 'email' : 'sms'),
        failedPinAttempts: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        pinChangedAt: new Date().toISOString(),
      };

      db.users.set(user.id, user);
      db.saveUsersToDisk();
      db.logAuditEvent(user.id, 'account_registered', `Account registered with primary role: ${activeRole}. Phone verified: ${user.isPhoneVerified}, Email verified: ${user.isEmailVerified}.`, req.ip, req.get('user-agent'));
    }

    // Create authenticated session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    db.sessions.set(sessionToken, {
      token: sessionToken,
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_TTL_MS,
    });
    db.saveSessionsToDisk();

    setSessionCookie(res, sessionToken);

    return res.status(201).json({
      success: true,
      message: 'Account security PIN established successfully.',
      sessionToken,
      user: db.toPublicProfile(user),
    });
  } catch (error: any) {
    console.error('Error in /api/auth/create-pin:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error establishing security PIN.',
    });
  }
};

authRouter.post('/create-pin', handleCreateOrSetPin);
authRouter.post('/set-pin', handleCreateOrSetPin);

/**
 * 4. Login with Verified Contact and 4-Digit PIN
 */
authRouter.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { identifier, pin } = req.body;

    if (!identifier || !pin) {
      return res.status(400).json({
        success: false,
        error: 'Registered contact and 4-digit PIN are required.',
      });
    }

    if (!/^\d{4}$/.test(String(pin))) {
      return res.status(400).json({
        success: false,
        error: 'PIN must be exactly 4 numeric digits.',
      });
    }

    const parsed = parseIdentifier(identifier);
    if (!parsed.isValid) {
      return res.status(400).json({ success: false, error: parsed.error });
    }

    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    if (!checkIpRateLimit(`login_${ip}`, 20, 60 * 1000)) {
      return res.status(429).json({
        success: false,
        error: 'Too many login attempts from this network. Please wait a moment before trying again.',
      });
    }

    const cleanIdentifier = parsed.cleanIdentifier;
    const user = db.findUserByIdentifier(cleanIdentifier);

    // If user does not exist: artificial delay and generic error to prevent enumeration
    if (!user) {
      await new Promise((r) => setTimeout(r, 600));
      return res.status(401).json({
        success: false,
        error: 'Invalid contact identifier or PIN. If not registered, please verify via OTP first.',
      });
    }

    // Verify contact method was verified before allowing as login identity
    if (parsed.type === 'email' && !user.isEmailVerified && !user.email_verified) {
      return res.status(401).json({
        success: false,
        error: 'This email address is not verified. Please sign in with your verified mobile number or verify this email first.',
      });
    }

    if (parsed.type === 'phone' && !user.isPhoneVerified && !user.mobile_verified) {
      return res.status(401).json({
        success: false,
        error: 'This mobile number is not verified. Please sign in with your verified email address or verify this phone first.',
      });
    }

    // Check account deactivation
    if (user.isDeactivated) {
      return res.status(403).json({
        success: false,
        error: 'This account has been deactivated. Please contact support or register a new account to regain access.',
      });
    }

    // Check account lockout
    if (user.lockoutUntil && Date.now() < user.lockoutUntil) {
      const minutesRemaining = Math.ceil((user.lockoutUntil - Date.now()) / (60 * 1000));
      return res.status(429).json({
        success: false,
        error: `Account temporarily locked due to repeated incorrect PIN attempts. Please try again in ${minutesRemaining} minute(s), or use Forgot PIN to recover.`,
      });
    }

    // Compare 4-digit PIN securely with bcrypt
    const isMatch = await bcrypt.compare(String(pin), user.pinHash);

    if (!isMatch) {
      user.failedPinAttempts += 1;
      const attemptsRemaining = MAX_PIN_FAILURES - user.failedPinAttempts;

      // Progressive delay against brute force
      await new Promise((r) => setTimeout(r, Math.min(user.failedPinAttempts * 400, 2000)));

      if (attemptsRemaining <= 0) {
        user.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
        db.saveUsersToDisk();
        db.logAuditEvent(user.id, 'account_locked', 'Account locked for 15 minutes due to 5 failed PIN attempts.', req.ip, req.get('user-agent'));
        return res.status(429).json({
          success: false,
          error: 'Account locked for 15 minutes due to multiple incorrect PIN entries. Use Forgot PIN to recover with OTP.',
        });
      }

      db.saveUsersToDisk();
      db.logAuditEvent(user.id, 'login_failed', `Incorrect PIN entered (${user.failedPinAttempts}/${MAX_PIN_FAILURES}).`, req.ip, req.get('user-agent'));
      return res.status(401).json({
        success: false,
        error: `Invalid contact identifier or PIN. You have ${attemptsRemaining} attempt(s) remaining before temporary lockout.`,
        attemptsRemaining,
      });
    }

    // Login Success: reset lockout and failed attempts
    user.failedPinAttempts = 0;
    user.lockoutUntil = undefined;
    user.lastLoginAt = new Date().toISOString();
    db.saveUsersToDisk();

    const sessionToken = crypto.randomBytes(32).toString('hex');
    db.sessions.set(sessionToken, {
      token: sessionToken,
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_TTL_MS,
    });
    db.saveSessionsToDisk();

    setSessionCookie(res, sessionToken);
    db.logAuditEvent(user.id, 'login_success', 'Successful PIN login.', req.ip, req.get('user-agent'));

    return res.status(200).json({
      success: true,
      sessionToken,
      user: db.toPublicProfile(user),
    });
  } catch (error: any) {
    console.error('Error in /api/auth/login:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error authenticating credentials.',
    });
  }
});

/**
 * 5. Forgot PIN: Initiate OTP Recovery
 */
authRouter.post('/forgot-pin', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Please enter your registered contact identifier to receive a recovery code.',
      });
    }

    const parsed = parseIdentifier(identifier);
    if (!parsed.isValid) {
      return res.status(400).json({ success: false, error: parsed.error });
    }

    const cleanIdentifier = parsed.cleanIdentifier;
    const user = db.findUserByIdentifier(cleanIdentifier);

    // If user not found, return honest error to prevent false-success confusion
    if (!user) {
      return res.status(404).json({
        success: false,
        deliveryStatus: 'provider_rejected',
        providerAccepted: false,
        error: `No registered account found for ${db.maskIdentifier(cleanIdentifier)}. Please register first.`,
        maskedRecipient: db.maskIdentifier(cleanIdentifier),
      });
    }

    // Determine eligible verified contact destination for recovery
    let targetContact = cleanIdentifier;
    if (parsed.type === 'phone' && !user.isPhoneVerified && user.isEmailVerified && user.email) {
      targetContact = user.email;
    } else if (parsed.type === 'email' && !user.isEmailVerified && user.isPhoneVerified && user.phone) {
      targetContact = user.phone;
    }

    const result = await createAndDispatchOtp(targetContact, 'recovery', { userId: user.id });

    if (!result.success || !result.providerAccepted) {
      const statusCode = result.providerStatus === 'unconfigured' ? 503 : 502;
      return res.status(statusCode).json(result);
    }

    db.logAuditEvent(user.id, 'pin_recovery_requested', 'PIN recovery OTP requested.', req.ip, req.get('user-agent'));
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in /api/auth/forgot-pin:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error initiating PIN recovery.',
    });
  }
});

/**
 * 6. Reset PIN with Verified Token
 */
authRouter.post('/reset-pin', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { identifier, verificationToken, newPin, confirmPin } = req.body;

    if (!identifier || !verificationToken || !newPin) {
      return res.status(400).json({
        success: false,
        error: 'Contact identifier, verification token, and new 4-digit PIN are required.',
      });
    }

    if (!/^\d{4}$/.test(String(newPin))) {
      return res.status(400).json({
        success: false,
        error: 'Security PIN must be exactly 4 numeric digits.',
      });
    }

    if (confirmPin && String(newPin) !== String(confirmPin)) {
      return res.status(400).json({
        success: false,
        error: 'New PIN and confirmation PIN do not match.',
      });
    }

    const parsed = parseIdentifier(identifier);
    if (!parsed.isValid) {
      return res.status(400).json({ success: false, error: parsed.error });
    }

    const cleanIdentifier = parsed.cleanIdentifier;
    const challenge = db.otpChallenges.get(cleanIdentifier);

    if (
      !challenge || 
      !challenge.verified || 
      challenge.verificationToken !== verificationToken ||
      (challenge.verificationTokenExpiresAt && Date.now() > challenge.verificationTokenExpiresAt)
    ) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired verification token. Please initiate a new recovery request.',
      });
    }

    // Invalidate challenge (replay prevention)
    db.otpChallenges.delete(cleanIdentifier);

    const user = db.findUserByIdentifier(cleanIdentifier);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found.' });
    }

    // Hash new PIN
    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(String(newPin), salt);

    user.pinHash = pinHash;
    user.pinChangedAt = new Date().toISOString();
    user.failedPinAttempts = 0;
    user.lockoutUntil = undefined;
    user.updatedAt = new Date().toISOString();
    db.saveUsersToDisk();

    // Terminate all existing sessions on password/PIN reset (Security Best Practice)
    db.invalidateUserSessions(user.id);

    // Establish new session for current device
    const sessionToken = crypto.randomBytes(32).toString('hex');
    db.sessions.set(sessionToken, {
      token: sessionToken,
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_TTL_MS,
    });
    db.saveSessionsToDisk();

    setSessionCookie(res, sessionToken);
    db.logAuditEvent(user.id, 'pin_reset', 'PIN successfully reset. Previous sessions invalidated.', req.ip, req.get('user-agent'));

    return res.status(200).json({
      success: true,
      message: 'PIN successfully reset. You are now logged in with your new PIN.',
      sessionToken,
      user: db.toPublicProfile(user),
    });
  } catch (error: any) {
    console.error('Error in /api/auth/reset-pin:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error resetting security PIN.',
    });
  }
});

/**
 * 7. Change PIN (Authenticated User)
 */
authRouter.post('/change-pin', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { currentPin, newPin, confirmPin } = req.body;

    if (!currentPin || !newPin) {
      return res.status(400).json({
        success: false,
        error: 'Current PIN and new 4-digit PIN are required.',
      });
    }

    if (!/^\d{4}$/.test(String(newPin))) {
      return res.status(400).json({
        success: false,
        error: 'New PIN must be exactly 4 numeric digits.',
      });
    }

    if (confirmPin && String(newPin) !== String(confirmPin)) {
      return res.status(400).json({
        success: false,
        error: 'New PIN and confirmation PIN do not match.',
      });
    }

    const isMatch = await bcrypt.compare(String(currentPin), user.pinHash);
    if (!isMatch) {
      await new Promise((r) => setTimeout(r, 500));
      return res.status(401).json({
        success: false,
        error: 'Current security PIN is incorrect.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.pinHash = await bcrypt.hash(String(newPin), salt);
    user.pinChangedAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();

    db.logAuditEvent(user.id, 'pin_changed', 'Security PIN changed by account owner.', req.ip, req.get('user-agent'));

    return res.status(200).json({
      success: true,
      message: 'Your 4-digit security PIN has been updated.',
    });
  } catch (error: any) {
    console.error('Error in /api/auth/change-pin:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error updating PIN.',
    });
  }
});

/**
 * 8. Get Authenticated User Profile & Refresh Persistent Session
 */
authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  // Session refresh & persistent cookie rotation
  if (req.sessionToken) {
    const session = db.sessions.get(req.sessionToken);
    if (session) {
      session.expiresAt = Date.now() + SESSION_TTL_MS;
      db.sessions.set(req.sessionToken, session);
      db.saveSessionsToDisk();
      setSessionCookie(res, req.sessionToken);
    }
  }

  return res.status(200).json({
    success: true,
    user: db.toPublicProfile(req.user!),
    sessionToken: req.sessionToken,
  });
});

/**
 * 9. Update Profile Information (Name, Language, Avatar, Notifications)
 */
authRouter.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { fullName, preferredLanguage, avatarUrl, notificationPreferences } = req.body;

    if (fullName !== undefined) {
      if (typeof fullName === 'string' && fullName.trim().length <= 100) {
        user.fullName = fullName.trim().length > 0 ? fullName.trim() : undefined;
      } else if (fullName === null || fullName === '') {
        user.fullName = undefined;
      }
    }

    if (preferredLanguage && ['en', 'hi', 'hi-en'].includes(preferredLanguage)) {
      user.preferredLanguage = preferredLanguage as SupportedLanguage;
    }

    if (avatarUrl !== undefined) {
      if (typeof avatarUrl === 'string' && avatarUrl.length < 50000) {
        user.avatarUrl = avatarUrl.trim() || undefined;
      } else if (avatarUrl === null) {
        user.avatarUrl = undefined;
      }
    }

    if (notificationPreferences && typeof notificationPreferences === 'object') {
      user.notificationPreferences = {
        emailAlerts: Boolean(notificationPreferences.emailAlerts),
        smsAlerts: Boolean(notificationPreferences.smsAlerts),
        propertyInquiries: Boolean(notificationPreferences.propertyInquiries),
        securityAlerts: Boolean(notificationPreferences.securityAlerts),
        savedSearchAlerts: notificationPreferences.savedSearchAlerts !== undefined ? Boolean(notificationPreferences.savedSearchAlerts) : (user.notificationPreferences?.savedSearchAlerts ?? true),
      };
    }

    user.updatedAt = new Date().toISOString();
    db.logAuditEvent(user.id, 'profile_updated', 'Account profile and preferences updated.', req.ip, req.get('user-agent'));

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: db.toPublicProfile(user),
    });
  } catch (error: any) {
    console.error('Error in /api/auth/profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error updating profile.',
    });
  }
});

/**
 * 10. Switch Active Role
 */
authRouter.post('/switch-role', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { role } = req.body;

    if (!role || !ALLOWED_PUBLIC_ROLES.includes(role as UserRole)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Allowed roles: ${ALLOWED_PUBLIC_ROLES.join(', ')}.`,
      });
    }

    const userRoles = user.roles || [user.role];
    if (!userRoles.includes(role as UserRole)) {
      return res.status(403).json({
        success: false,
        error: `Your account does not currently hold the '${role}' role. Please add this role to your account first.`,
      });
    }

    user.activeRole = role as UserRole;
    user.role = role as UserRole;
    user.updatedAt = new Date().toISOString();

    db.logAuditEvent(user.id, 'role_switched', `Switched active role to: ${role}.`, req.ip, req.get('user-agent'));

    return res.status(200).json({
      success: true,
      message: `Active role switched to ${role}.`,
      user: db.toPublicProfile(user),
    });
  } catch (error: any) {
    console.error('Error in /api/auth/switch-role:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error switching role.',
    });
  }
});

/**
 * 11. Add a New Role to Multi-Role Account
 */
authRouter.post('/add-role', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { role } = req.body;

    if (!role || !ALLOWED_PUBLIC_ROLES.includes(role as UserRole)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Self-assignable roles: ${ALLOWED_PUBLIC_ROLES.join(', ')}. Administrative and Verifier roles require institutional authorization.`,
      });
    }

    if (!Array.isArray(user.roles)) {
      user.roles = [user.role || 'tenant'];
    }

    if (!user.roles.includes(role as UserRole)) {
      user.roles.push(role as UserRole);
      user.activeRole = role as UserRole;
      user.role = role as UserRole;
      user.updatedAt = new Date().toISOString();
      db.logAuditEvent(user.id, 'role_added', `Added role '${role}' to account.`, req.ip, req.get('user-agent'));
    }

    return res.status(200).json({
      success: true,
      message: `Role '${role}' added to your account.`,
      user: db.toPublicProfile(user),
    });
  } catch (error: any) {
    console.error('Error in /api/auth/add-role:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error adding role.',
    });
  }
});

/**
 * 12. Request Contact Update (Sends Real OTP to New Email or Phone)
 */
authRouter.post('/request-contact-change', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { newContact } = req.body;

    if (!newContact) {
      return res.status(400).json({
        success: false,
        error: 'Please enter the new email address or 10-digit mobile number.',
      });
    }

    const parsed = parseIdentifier(newContact);
    if (!parsed.isValid) {
      return res.status(400).json({ success: false, error: parsed.error });
    }

    const cleanContact = parsed.cleanIdentifier;
    const existing = db.findUserByIdentifier(cleanContact);

    if (existing && existing.id !== user.id) {
      return res.status(409).json({
        success: false,
        error: 'This contact identifier is already linked to another Griha Saathi account.',
      });
    }

    const result = await createAndDispatchOtp(cleanContact, 'contact_update', {
      userId: user.id,
      newContact: cleanContact,
    });

    if (!result.success || !result.providerAccepted) {
      const statusCode = result.providerStatus === 'unconfigured' ? 503 : 502;
      return res.status(statusCode).json(result);
    }

    db.logAuditEvent(user.id, 'contact_update_requested', `Initiated verification code for new contact: ${db.maskIdentifier(cleanContact)}.`, req.ip, req.get('user-agent'));
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in /api/auth/request-contact-change:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error requesting contact change verification.',
    });
  }
});

/**
 * 13. Verify Contact Update (Commits New Verified Contact to Account)
 */
authRouter.post('/verify-contact-change', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { newContact, otp } = req.body;

    if (!newContact || !otp) {
      return res.status(400).json({
        success: false,
        error: 'New contact and OTP verification code are required.',
      });
    }

    const parsed = parseIdentifier(newContact);
    if (!parsed.isValid) {
      return res.status(400).json({ success: false, error: parsed.error });
    }

    const cleanContact = parsed.cleanIdentifier;
    const result = await verifyOtpChallenge(cleanContact, String(otp));

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Invalidate challenge
    db.otpChallenges.delete(cleanContact);

    // Apply update
    if (parsed.type === 'email') {
      user.email = cleanContact;
      user.isEmailVerified = true;
      if (user.identifier.includes('@')) {
        user.identifier = cleanContact;
      }
    } else {
      user.phone = cleanContact;
      user.isPhoneVerified = true;
      if (!user.identifier.includes('@')) {
        user.identifier = cleanContact;
      }
    }

    user.updatedAt = new Date().toISOString();
    db.logAuditEvent(user.id, 'contact_updated', `Verified and linked new contact: ${db.maskIdentifier(cleanContact)}.`, req.ip, req.get('user-agent'));

    return res.status(200).json({
      success: true,
      message: 'New contact successfully verified and updated.',
      user: db.toPublicProfile(user),
    });
  } catch (error: any) {
    console.error('Error in /api/auth/verify-contact-change:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error updating contact.',
    });
  }
});

/**
 * 14. Get Security Audit Logs for Current User
 */
authRouter.get('/audit-logs', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const logs = db.getUserAuditEvents(req.user!.id);
  return res.status(200).json({
    success: true,
    count: logs.length,
    logs,
  });
});

/**
 * 15. Get Active Sessions for Current User
 */
authRouter.get('/sessions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const sessions = db.getUserSessions(req.user!.id, req.sessionToken);
  return res.status(200).json({
    success: true,
    sessions,
  });
});

/**
 * 16. Revoke Sessions
 */
authRouter.post('/sessions/revoke', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { sessionToken, revokeAllOther } = req.body;

  if (revokeAllOther) {
    db.invalidateUserSessions(req.user!.id, req.sessionToken);
    db.logAuditEvent(req.user!.id, 'session_revoked', 'Terminated all other active sessions.', req.ip, req.get('user-agent'));
    return res.status(200).json({
      success: true,
      message: 'All other active sessions have been terminated.',
    });
  }

  if (sessionToken) {
    db.sessions.delete(sessionToken);
    db.logAuditEvent(req.user!.id, 'session_revoked', 'Revoked a specific session.', req.ip, req.get('user-agent'));
    return res.status(200).json({
      success: true,
      message: 'Session revoked.',
    });
  }

  return res.status(400).json({ success: false, error: 'Provide sessionToken or set revokeAllOther: true.' });
});

/**
 * 17. Sign Out
 */
authRouter.post('/logout', (req: AuthenticatedRequest, res: Response) => {
  if (req.sessionToken) {
    if (req.user) {
      db.logAuditEvent(req.user.id, 'logout', 'Signed out from session.', req.ip, req.get('user-agent'));
    }
    db.sessions.delete(req.sessionToken);
    db.saveSessionsToDisk();
  }
  clearSessionCookie(res);
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

/**
 * 18. Upload Profile Photo
 */
authRouter.post('/profile-photo', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { base64Data, filename, mimeType } = req.body;

    if (!base64Data || !filename || !mimeType) {
      return res.status(400).json({
        success: false,
        error: 'Missing image payload (base64Data, filename, and mimeType required).',
      });
    }

    const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMime.includes(mimeType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Profile photo must be a JPEG, PNG, or WebP image.',
      });
    }

    const cleanBase64 = base64Data.includes(';base64,') ? base64Data.split(';base64,')[1] : base64Data;
    const buffer = Buffer.from(cleanBase64, 'base64');

    const result = await storeUploadedFile(buffer, filename, mimeType, false);
    if (!result.success || !result.result) {
      return res.status(400).json({ success: false, error: result.error || 'Photo upload failed.' });
    }

    user.avatarUrl = result.result.url;
    user.updatedAt = new Date().toISOString();
    db.logAuditEvent(user.id, 'profile_photo_updated', 'Profile photo updated.', req.ip, req.get('user-agent'));

    return res.json({
      success: true,
      avatarUrl: user.avatarUrl,
      user: db.toPublicProfile(user),
      message: 'Profile photo uploaded and saved successfully.',
    });
  } catch (error) {
    console.error('Error in POST /api/auth/profile-photo:', error);
    return res.status(500).json({ success: false, error: 'Internal server error uploading profile photo.' });
  }
});

/**
 * 19. Account Deactivation or Deletion
 */
authRouter.post('/deactivate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { action = 'deactivate', reason, pin } = req.body;

    if (action !== 'deactivate' && action !== 'delete') {
      return res.status(400).json({ success: false, error: 'Action must be either "deactivate" or "delete".' });
    }

    if (!pin) {
      return res.status(400).json({
        success: false,
        error: 'Your 4-digit security PIN is required to confirm account deactivation or deletion.',
      });
    }

    const isPinValid = await bcrypt.compare(String(pin), user.pinHash);
    if (!isPinValid) {
      return res.status(401).json({ success: false, error: 'Incorrect 4-digit security PIN.' });
    }

    db.deleteOrDeactivateAccount(user.id, action, reason);
    clearSessionCookie(res);

    return res.status(200).json({
      success: true,
      message: action === 'delete'
        ? 'Your account has been permanently scheduled for deletion and active sessions revoked.'
        : 'Your account has been deactivated, listings withdrawn, and all active sessions revoked.',
    });
  } catch (error: any) {
    console.error('Error in /api/auth/deactivate:', error);
    return res.status(500).json({ success: false, error: 'Internal server error processing deactivation.' });
  }
});
