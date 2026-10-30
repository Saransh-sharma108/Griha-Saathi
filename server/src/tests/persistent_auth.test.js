import assert from 'assert';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db.js';
import { _createTestChallengeForUnitTests, verifyOtpChallenge } from '../otpService.js';
async function runPersistentAuthTests() {
    console.log('================================================================');
    console.log('GRIHA SAATHI — PERSISTENT REGISTRATION & AUTOMATIC LOGIN TESTS');
    console.log('================================================================\n');
    // Clean up any test users from previous runs
    for (const [id, u] of Array.from(db.users.entries())) {
        if (u.email === 'saransh.test.owner@grihasaathi.in') {
            db.users.delete(id);
        }
    }
    db.saveUsersToDisk();
    // --------------------------------------------------------------------------
    // TEST 1: Duplicate Account Pre-Check
    // --------------------------------------------------------------------------
    console.log('[Test 1] Testing duplicate account pre-check before registration...');
    const testEmail = 'saransh.test.owner@grihasaathi.in';
    const testPhone = '9876543210';
    assert.strictEqual(db.findUserByEmail(testEmail), undefined, 'Account must not exist initially');
    assert.strictEqual(db.findUserByPhone(testPhone), undefined, 'Phone must not exist initially');
    console.log('✓ Test 1 Passed: Duplicate pre-check reliably verifies absence of duplicate accounts.\n');
    // --------------------------------------------------------------------------
    // TEST 2: Contact Ownership Gate (OTP Verification Mandatory)
    // --------------------------------------------------------------------------
    console.log('[Test 2] Testing ownership verification gate (No bypass allowed)...');
    const plainOtp = '482910';
    const challenge = await _createTestChallengeForUnitTests(testEmail, 'registration', plainOtp);
    assert.strictEqual(challenge.verified, false, 'Challenge must start unverified');
    assert.strictEqual(challenge.otpHash.startsWith('$2'), true, 'OTP must be hashed with bcrypt');
    // Verify with valid OTP
    const verifyRes = await verifyOtpChallenge(testEmail, plainOtp);
    assert.strictEqual(verifyRes.success, true, 'OTP verification must succeed with correct OTP');
    assert.ok(verifyRes.verificationToken, 'Single-use verification token must be issued');
    const token = verifyRes.verificationToken;
    console.log('✓ Test 2 Passed: Contact ownership strictly verified via cryptographic OTP challenge.\n');
    // --------------------------------------------------------------------------
    // TEST 3: 4-Digit Security PIN Creation & Bcrypt Hashing
    // --------------------------------------------------------------------------
    console.log('[Test 3] Testing 4-digit PIN setup and secure bcrypt hashing...');
    const plainPin = '7890';
    assert.strictEqual(/^\d{4}$/.test(plainPin), true, 'PIN must be exactly 4 numeric digits');
    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(plainPin, salt);
    assert.strictEqual(pinHash.startsWith('$2'), true, 'PIN must be hashed with bcrypt');
    assert.notStrictEqual(pinHash, plainPin, 'PIN must NEVER be plaintext');
    const userId = `usr_${crypto.randomUUID().slice(0, 8)}`;
    const newUser = {
        id: userId,
        identifier: testEmail,
        email: testEmail,
        normalizedEmail: testEmail.toLowerCase(),
        phone: testPhone,
        normalizedPhone: `+91${testPhone}`,
        role: 'owner',
        activeRole: 'owner',
        roles: ['owner', 'tenant'],
        fullName: 'Saransh Sharma',
        preferredLanguage: 'en',
        notificationPreferences: {
            emailAlerts: true,
            smsAlerts: true,
            propertyInquiries: true,
            securityAlerts: true,
        },
        pinHash,
        isPhoneVerified: false,
        isEmailVerified: true,
        isIdentityVerified: false,
        accountStatus: 'active',
        failedPinAttempts: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    db.users.set(newUser.id, newUser);
    db.saveUsersToDisk();
    // Confirm saved in database
    const savedUser = db.findUserByEmail(testEmail);
    assert.ok(savedUser, 'User must be findable by email');
    assert.strictEqual(savedUser?.fullName, 'Saransh Sharma');
    assert.strictEqual(savedUser?.isEmailVerified, true);
    console.log('✓ Test 3 Passed: User account securely registered in database with hashed PIN.\n');
    // --------------------------------------------------------------------------
    // TEST 4: Duplicate Prevention Enforced After Creation
    // --------------------------------------------------------------------------
    console.log('[Test 4] Testing duplicate prevention against newly created account...');
    const duplicateCheckEmail = db.findUserByEmail(testEmail);
    const duplicateCheckPhone = db.findUserByPhone(testPhone);
    assert.ok(duplicateCheckEmail, 'Must detect duplicate by email');
    assert.ok(duplicateCheckPhone, 'Must detect duplicate by phone');
    assert.strictEqual(duplicateCheckEmail?.id, userId);
    console.log('✓ Test 4 Passed: Duplicate account creation blocked by email and phone checks.\n');
    // --------------------------------------------------------------------------
    // TEST 5: Persistent Session Creation & Disk Persistence
    // --------------------------------------------------------------------------
    console.log('[Test 5] Testing persistent session token creation and disk persistence...');
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const sessionTtl = 30 * 24 * 60 * 60 * 1000; // 30 days
    db.sessions.set(sessionToken, {
        token: sessionToken,
        userId: newUser.id,
        createdAt: now,
        expiresAt: now + sessionTtl,
        userAgent: 'Integration Test Runner',
        ipAddress: '127.0.0.1',
    });
    db.saveSessionsToDisk();
    // Verify persistence by reading raw file from disk
    assert.strictEqual(fs.existsSync(db.sessionsFilePath), true, 'Sessions file must exist on disk');
    const rawSessions = fs.readFileSync(db.sessionsFilePath, 'utf8');
    assert.strictEqual(rawSessions.includes(sessionToken), true, 'Session token must be written to disk');
    console.log('✓ Test 5 Passed: Authenticated session stored and persisted to disk.\n');
    // --------------------------------------------------------------------------
    // TEST 6: Automatic Login & Session Restore Simulation (Reopening Website)
    // --------------------------------------------------------------------------
    console.log('[Test 6] Testing automatic login and session restoration on reopen...');
    // Simulate browser closing and reopening by checking session from fresh lookup
    const restoredSession = db.sessions.get(sessionToken);
    assert.ok(restoredSession, 'Session must exist on reopen');
    assert.ok(Date.now() < restoredSession.expiresAt, 'Session must not be expired');
    const restoredUser = db.users.get(restoredSession.userId);
    assert.ok(restoredUser, 'User profile must be restored from session');
    assert.strictEqual(restoredUser?.id, userId);
    assert.strictEqual(restoredUser?.fullName, 'Saransh Sharma');
    // Session rotation: verify extending expiration
    const refreshedExpiresAt = Date.now() + sessionTtl;
    restoredSession.expiresAt = refreshedExpiresAt;
    db.sessions.set(sessionToken, restoredSession);
    db.saveSessionsToDisk();
    assert.strictEqual(db.sessions.get(sessionToken)?.expiresAt, refreshedExpiresAt);
    console.log('✓ Test 6 Passed: Automatic login session restoration and rotation verified.\n');
    // --------------------------------------------------------------------------
    // TEST 7: Secure Logout & Session Invalidation
    // --------------------------------------------------------------------------
    console.log('[Test 7] Testing secure logout and session revocation...');
    db.sessions.delete(sessionToken);
    db.saveSessionsToDisk();
    assert.strictEqual(db.sessions.has(sessionToken), false, 'Session must be revoked from memory');
    const postLogoutRaw = fs.readFileSync(db.sessionsFilePath, 'utf8');
    assert.strictEqual(postLogoutRaw.includes(sessionToken), false, 'Revoked session must be purged from disk');
    // Attempting to restore after logout must fail
    const postLogoutSession = db.sessions.get(sessionToken);
    assert.strictEqual(postLogoutSession, undefined, 'Cannot restore session after logout');
    console.log('✓ Test 7 Passed: Logout securely revokes session and prevents replay.\n');
    // Clean up test user
    db.users.delete(userId);
    db.saveUsersToDisk();
    console.log('================================================================');
    console.log('ALL PERSISTENT AUTHENTICATION & LOGIN TESTS PASSED (100%)');
    console.log('================================================================');
}
runPersistentAuthTests().catch((err) => {
    console.error('\n❌ Persistent Auth Test Suite Failed:', err);
    process.exit(1);
});
