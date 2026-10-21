import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from './db.js';
import { createAndDispatchOtp, verifyOtpChallenge, parseIdentifier } from './otpService.js';
import { authenticateUser, requireAuth } from './middleware.js';
import { storeUploadedFile } from './storageService.js';
export const authRouter = Router();
authRouter.use(authenticateUser);
const MAX_PIN_FAILURES = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const ALLOWED_PUBLIC_ROLES = [
    'tenant',
    'owner',
    'agent',
    'builder',
    'property_manager',
];
const ipRateLimitMap = new Map();
function checkIpRateLimit(key, maxAttempts, windowMs) {
    const now = Date.now();
    const timestamps = (ipRateLimitMap.get(key) || []).filter(t => now - t < windowMs);
    if (timestamps.length >= maxAttempts) {
        return false;
    }
    timestamps.push(now);
    ipRateLimitMap.set(key, timestamps);
    return true;
}
function setSessionCookie(res, token) {
    res.cookie('gs_session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: SESSION_TTL_MS,
        path: '/',
    });
}
function clearSessionCookie(res) {
    res.clearCookie('gs_session_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        path: '/',
    });
}
/**
 * 1. Request OTP for Registration or Contact Verification
 */
authRouter.post('/request-otp', async (req, res) => {
    try {
        const { identifier, type } = req.body;
        if (!identifier) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid Indian 10-digit mobile number or email address.',
            });
        }
        const otpType = type === 'recovery' || type === 'contact_update' ? type : 'registration';
        const result = await createAndDispatchOtp(identifier, otpType);
        if (!result.success) {
            const statusCode = result.providerStatus === 'unconfigured' ? 503 : 400;
            return res.status(statusCode).json(result);
        }
        return res.status(200).json(result);
    }
    catch (error) {
        console.error('Error in /api/auth/request-otp:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error processing verification request.',
        });
    }
});
/**
 * 2. Verify OTP
 */
authRouter.post('/verify-otp', async (req, res) => {
    try {
        const { identifier, otp } = req.body;
        if (!identifier || !otp) {
            return res.status(400).json({
                success: false,
                error: 'Contact identifier and 6-digit OTP code are required.',
            });
        }
        const result = await verifyOtpChallenge(identifier, String(otp));
        if (!result.success) {
            return res.status(400).json(result);
        }
        return res.status(200).json({
            success: true,
            message: 'Contact verified successfully.',
            verificationToken: result.verificationToken,
        });
    }
    catch (error) {
        console.error('Error in /api/auth/verify-otp:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error verifying OTP code.',
        });
    }
});
/**
 * 3. Set 4-digit PIN & Complete Registration / Profile
 */
authRouter.post('/set-pin', async (req, res) => {
    try {
        const { identifier, verificationToken, pin, confirmPin, roles, fullName, preferredLanguage } = req.body;
        if (!identifier || !verificationToken || !pin) {
            return res.status(400).json({
                success: false,
                error: 'Contact identifier, verification token, and 4-digit security PIN are required.',
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
        const parsed = parseIdentifier(identifier);
        if (!parsed.isValid) {
            return res.status(400).json({ success: false, error: parsed.error });
        }
        const cleanIdentifier = parsed.cleanIdentifier;
        const challenge = db.otpChallenges.get(cleanIdentifier);
        if (!challenge ||
            !challenge.verified ||
            challenge.verificationToken !== verificationToken ||
            (challenge.verificationTokenExpiresAt && Date.now() > challenge.verificationTokenExpiresAt)) {
            return res.status(403).json({
                success: false,
                error: 'Invalid or expired verification token. Please verify your contact via OTP first.',
            });
        }
        // Invalidate challenge immediately (strict replay protection)
        db.otpChallenges.delete(cleanIdentifier);
        // Hash the 4-digit PIN securely with bcrypt
        const salt = await bcrypt.genSalt(10);
        const pinHash = await bcrypt.hash(String(pin), salt);
        // Validate assigned roles
        const assignedRoles = [];
        if (Array.isArray(roles)) {
            for (const r of roles) {
                if (ALLOWED_PUBLIC_ROLES.includes(r) && !assignedRoles.includes(r)) {
                    assignedRoles.push(r);
                }
            }
        }
        if (assignedRoles.length === 0) {
            assignedRoles.push('tenant');
        }
        const activeRole = assignedRoles[0];
        const isEmail = parsed.type === 'email';
        let user = db.findUserByIdentifier(cleanIdentifier);
        if (user) {
            // User already exists (e.g. updating PIN)
            user.pinHash = pinHash;
            user.pinChangedAt = new Date().toISOString();
            user.failedPinAttempts = 0;
            user.lockoutUntil = undefined;
            user.updatedAt = new Date().toISOString();
            if (fullName && typeof fullName === 'string' && fullName.trim().length > 0) {
                user.fullName = fullName.trim();
            }
            db.logAuditEvent(user.id, 'pin_reset', 'Security PIN reset after OTP verification.', req.ip, req.get('user-agent'));
        }
        else {
            // New User Registration
            user = {
                id: `usr_${crypto.randomUUID().slice(0, 8)}`,
                identifier: cleanIdentifier,
                phone: !isEmail ? cleanIdentifier : undefined,
                email: isEmail ? cleanIdentifier : undefined,
                role: activeRole,
                activeRole: activeRole,
                roles: assignedRoles,
                fullName: fullName && typeof fullName === 'string' && fullName.trim().length > 0 ? fullName.trim() : undefined,
                preferredLanguage: preferredLanguage || 'en',
                notificationPreferences: {
                    emailAlerts: true,
                    smsAlerts: true,
                    propertyInquiries: true,
                    securityAlerts: true,
                },
                pinHash,
                isPhoneVerified: !isEmail,
                isEmailVerified: isEmail,
                isIdentityVerified: false,
                failedPinAttempts: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
                pinChangedAt: new Date().toISOString(),
            };
            db.users.set(user.id, user);
            db.logAuditEvent(user.id, 'account_registered', `Account registered with primary role: ${activeRole}.`, req.ip, req.get('user-agent'));
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
        setSessionCookie(res, sessionToken);
        return res.status(201).json({
            success: true,
            message: 'Account security PIN established successfully.',
            sessionToken,
            user: db.toPublicProfile(user),
        });
    }
    catch (error) {
        console.error('Error in /api/auth/set-pin:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error establishing security PIN.',
        });
    }
});
/**
 * 4. Login with Verified Contact and 4-Digit PIN
 */
authRouter.post('/login', async (req, res) => {
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
                db.logAuditEvent(user.id, 'account_locked', 'Account locked for 15 minutes due to 5 failed PIN attempts.', req.ip, req.get('user-agent'));
                return res.status(429).json({
                    success: false,
                    error: 'Account locked for 15 minutes due to multiple incorrect PIN entries. Use Forgot PIN to recover with OTP.',
                });
            }
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
        const sessionToken = crypto.randomBytes(32).toString('hex');
        db.sessions.set(sessionToken, {
            token: sessionToken,
            userId: user.id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            createdAt: Date.now(),
            expiresAt: Date.now() + SESSION_TTL_MS,
        });
        setSessionCookie(res, sessionToken);
        db.logAuditEvent(user.id, 'login_success', 'Successful PIN login.', req.ip, req.get('user-agent'));
        return res.status(200).json({
            success: true,
            sessionToken,
            user: db.toPublicProfile(user),
        });
    }
    catch (error) {
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
authRouter.post('/forgot-pin', async (req, res) => {
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
        // If user not found, return generic success message to prevent contact enumeration
        if (!user) {
            await new Promise((r) => setTimeout(r, 500));
            return res.status(200).json({
                success: true,
                message: `If an account is associated with ${db.maskIdentifier(cleanIdentifier)}, a verification code has been dispatched.`,
                maskedRecipient: db.maskIdentifier(cleanIdentifier),
            });
        }
        const result = await createAndDispatchOtp(cleanIdentifier, 'recovery', { userId: user.id });
        if (!result.success) {
            const statusCode = result.providerStatus === 'unconfigured' ? 503 : 400;
            return res.status(statusCode).json(result);
        }
        db.logAuditEvent(user.id, 'pin_recovery_requested', 'PIN recovery OTP requested.', req.ip, req.get('user-agent'));
        return res.status(200).json(result);
    }
    catch (error) {
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
authRouter.post('/reset-pin', async (req, res) => {
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
        if (!challenge ||
            !challenge.verified ||
            challenge.verificationToken !== verificationToken ||
            (challenge.verificationTokenExpiresAt && Date.now() > challenge.verificationTokenExpiresAt)) {
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
        setSessionCookie(res, sessionToken);
        db.logAuditEvent(user.id, 'pin_reset', 'PIN successfully reset. Previous sessions invalidated.', req.ip, req.get('user-agent'));
        return res.status(200).json({
            success: true,
            message: 'PIN successfully reset. You are now logged in with your new PIN.',
            sessionToken,
            user: db.toPublicProfile(user),
        });
    }
    catch (error) {
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
authRouter.post('/change-pin', requireAuth, async (req, res) => {
    try {
        const user = req.user;
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
    }
    catch (error) {
        console.error('Error in /api/auth/change-pin:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error updating PIN.',
        });
    }
});
/**
 * 8. Get Authenticated User Profile
 */
authRouter.get('/me', requireAuth, (req, res) => {
    return res.status(200).json({
        success: true,
        user: db.toPublicProfile(req.user),
    });
});
/**
 * 9. Update Profile Information (Name, Language, Avatar, Notifications)
 */
authRouter.put('/profile', requireAuth, (req, res) => {
    try {
        const user = req.user;
        const { fullName, preferredLanguage, avatarUrl, notificationPreferences } = req.body;
        if (fullName !== undefined) {
            if (typeof fullName === 'string' && fullName.trim().length <= 100) {
                user.fullName = fullName.trim().length > 0 ? fullName.trim() : undefined;
            }
            else if (fullName === null || fullName === '') {
                user.fullName = undefined;
            }
        }
        if (preferredLanguage && ['en', 'hi', 'hi-en'].includes(preferredLanguage)) {
            user.preferredLanguage = preferredLanguage;
        }
        if (avatarUrl !== undefined) {
            if (typeof avatarUrl === 'string' && avatarUrl.length < 50000) {
                user.avatarUrl = avatarUrl.trim() || undefined;
            }
            else if (avatarUrl === null) {
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
    }
    catch (error) {
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
authRouter.post('/switch-role', requireAuth, (req, res) => {
    try {
        const user = req.user;
        const { role } = req.body;
        if (!role || !ALLOWED_PUBLIC_ROLES.includes(role)) {
            return res.status(400).json({
                success: false,
                error: `Invalid role. Allowed roles: ${ALLOWED_PUBLIC_ROLES.join(', ')}.`,
            });
        }
        const userRoles = user.roles || [user.role];
        if (!userRoles.includes(role)) {
            return res.status(403).json({
                success: false,
                error: `Your account does not currently hold the '${role}' role. Please add this role to your account first.`,
            });
        }
        user.activeRole = role;
        user.role = role;
        user.updatedAt = new Date().toISOString();
        db.logAuditEvent(user.id, 'role_switched', `Switched active role to: ${role}.`, req.ip, req.get('user-agent'));
        return res.status(200).json({
            success: true,
            message: `Active role switched to ${role}.`,
            user: db.toPublicProfile(user),
        });
    }
    catch (error) {
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
authRouter.post('/add-role', requireAuth, (req, res) => {
    try {
        const user = req.user;
        const { role } = req.body;
        if (!role || !ALLOWED_PUBLIC_ROLES.includes(role)) {
            return res.status(400).json({
                success: false,
                error: `Invalid role. Self-assignable roles: ${ALLOWED_PUBLIC_ROLES.join(', ')}. Administrative and Verifier roles require institutional authorization.`,
            });
        }
        if (!Array.isArray(user.roles)) {
            user.roles = [user.role || 'tenant'];
        }
        if (!user.roles.includes(role)) {
            user.roles.push(role);
            user.activeRole = role;
            user.role = role;
            user.updatedAt = new Date().toISOString();
            db.logAuditEvent(user.id, 'role_added', `Added role '${role}' to account.`, req.ip, req.get('user-agent'));
        }
        return res.status(200).json({
            success: true,
            message: `Role '${role}' added to your account.`,
            user: db.toPublicProfile(user),
        });
    }
    catch (error) {
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
authRouter.post('/request-contact-change', requireAuth, async (req, res) => {
    try {
        const user = req.user;
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
        if (!result.success) {
            const statusCode = result.providerStatus === 'unconfigured' ? 503 : 400;
            return res.status(statusCode).json(result);
        }
        db.logAuditEvent(user.id, 'contact_update_requested', `Initiated verification code for new contact: ${db.maskIdentifier(cleanContact)}.`, req.ip, req.get('user-agent'));
        return res.status(200).json(result);
    }
    catch (error) {
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
authRouter.post('/verify-contact-change', requireAuth, async (req, res) => {
    try {
        const user = req.user;
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
        }
        else {
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
    }
    catch (error) {
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
authRouter.get('/audit-logs', requireAuth, (req, res) => {
    const logs = db.getUserAuditEvents(req.user.id);
    return res.status(200).json({
        success: true,
        count: logs.length,
        logs,
    });
});
/**
 * 15. Get Active Sessions for Current User
 */
authRouter.get('/sessions', requireAuth, (req, res) => {
    const sessions = db.getUserSessions(req.user.id, req.sessionToken);
    return res.status(200).json({
        success: true,
        sessions,
    });
});
/**
 * 16. Revoke Sessions
 */
authRouter.post('/sessions/revoke', requireAuth, (req, res) => {
    const { sessionToken, revokeAllOther } = req.body;
    if (revokeAllOther) {
        db.invalidateUserSessions(req.user.id, req.sessionToken);
        db.logAuditEvent(req.user.id, 'session_revoked', 'Terminated all other active sessions.', req.ip, req.get('user-agent'));
        return res.status(200).json({
            success: true,
            message: 'All other active sessions have been terminated.',
        });
    }
    if (sessionToken) {
        db.sessions.delete(sessionToken);
        db.logAuditEvent(req.user.id, 'session_revoked', 'Revoked a specific session.', req.ip, req.get('user-agent'));
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
authRouter.post('/logout', (req, res) => {
    if (req.sessionToken) {
        if (req.user) {
            db.logAuditEvent(req.user.id, 'logout', 'Signed out from session.', req.ip, req.get('user-agent'));
        }
        db.sessions.delete(req.sessionToken);
    }
    clearSessionCookie(res);
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
});
/**
 * 18. Upload Profile Photo
 */
authRouter.post('/profile-photo', requireAuth, async (req, res) => {
    try {
        const user = req.user;
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
    }
    catch (error) {
        console.error('Error in POST /api/auth/profile-photo:', error);
        return res.status(500).json({ success: false, error: 'Internal server error uploading profile photo.' });
    }
});
/**
 * 19. Account Deactivation or Deletion
 */
authRouter.post('/deactivate', requireAuth, async (req, res) => {
    try {
        const user = req.user;
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
    }
    catch (error) {
        console.error('Error in /api/auth/deactivate:', error);
        return res.status(500).json({ success: false, error: 'Internal server error processing deactivation.' });
    }
});
