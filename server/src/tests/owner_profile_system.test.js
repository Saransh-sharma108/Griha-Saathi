import assert from 'assert';
import { db } from '../db.js';
import fs from 'fs';
console.log('================================================================');
console.log('GRIHA SAATHI — WEBSITE OWNER PROFILE & AUTH REMOVAL TEST SUITE');
console.log('================================================================');
// TEST 1: Owner Profile Exists & Persisted in Database
console.log('\n[Test 1] Testing Owner Profile in Database...');
const profile = db.getOwnerProfile();
assert.strictEqual(profile.id, 'usr_owner_saransh', 'Owner ID must be usr_owner_saransh');
assert.strictEqual(profile.fullName, 'Saransh Sharma', 'Full name must match Saransh Sharma');
assert.strictEqual(profile.email, 'sharma108saransh@gmail.com', 'Email must match sharma108saransh@gmail.com');
assert.strictEqual(profile.accountType, 'Website Owner / Administrator', 'Account type must be Website Owner / Administrator');
assert.strictEqual(profile.initials, 'SS', 'Initials must be SS');
assert.strictEqual(profile.role, 'owner', 'Active role must be owner');
assert.ok(profile.roles.includes('owner') && profile.roles.includes('admin'), 'Roles must include owner and admin');
console.log('✓ Test 1 Passed: Website owner profile correctly initialized with provided credentials.');
// TEST 2: Disk Persistence in users.json
console.log('\n[Test 2] Testing Persistence to server/data/users.json...');
assert.ok(fs.existsSync(db.usersFilePath), 'users.json must exist on disk');
const rawUsers = JSON.parse(fs.readFileSync(db.usersFilePath, 'utf8'));
const persistedOwner = rawUsers.find((u) => u.id === 'usr_owner_saransh');
assert.ok(persistedOwner, 'Owner record must be saved in users.json');
assert.strictEqual(persistedOwner.fullName, 'Saransh Sharma');
assert.strictEqual(persistedOwner.email, 'sharma108saransh@gmail.com');
console.log('✓ Test 2 Passed: Owner profile persisted to disk in users.json.');
// TEST 3: Strict Duplicate Creation Prevention
console.log('\n[Test 3] Testing Strict Duplicate Prevention...');
const countBefore = db.users.size;
db.ensureOwnerProfile();
db.ensureOwnerProfile();
const countAfter = db.users.size;
assert.strictEqual(countBefore, countAfter, 'Multiple calls to ensureOwnerProfile must not create duplicate records');
// Verify only one record with email sharma108saransh@gmail.com exists
const matches = Array.from(db.users.values()).filter((u) => u.email?.toLowerCase() === 'sharma108saransh@gmail.com' || u.id === 'usr_owner_saransh');
assert.strictEqual(matches.length, 1, 'Exactly one owner profile record must exist');
console.log('✓ Test 3 Passed: Duplicate profile creation strictly prevented.');
// TEST 4: Profile Updates and Settings Persistence
console.log('\n[Test 4] Testing Profile Settings & Mobile Update...');
const testPhone = '+91 98765 43210';
db.updateOwnerProfile({
    phone: testPhone,
    preferredLanguage: 'hi',
    notificationPreferences: {
        emailAlerts: true,
        smsAlerts: false,
        propertyInquiries: true,
        securityAlerts: true,
    },
});
const updated = db.getOwnerProfile();
assert.strictEqual(updated.phone, testPhone, 'Phone number must be updated');
assert.strictEqual(updated.preferredLanguage, 'hi', 'Preferred language must be updated');
assert.strictEqual(updated.notificationPreferences.smsAlerts, false, 'Notification preferences must be updated');
// Verify disk persistence of updates
const diskReload = JSON.parse(fs.readFileSync(db.usersFilePath, 'utf8'));
const reloadOwner = diskReload.find((u) => u.id === 'usr_owner_saransh');
assert.strictEqual(reloadOwner.phone, testPhone, 'Updated phone must persist to disk');
console.log('✓ Test 4 Passed: Profile updates and settings persist to disk without OTP.');
// TEST 5: Zero-OTP Requirement for Owner Profile
console.log('\n[Test 5] Testing Zero-OTP Requirement for Owner Management...');
// Verify that OTP challenge table does NOT require an OTP for owner profile retrieval or updates
const challenges = Array.from(db.otpChallenges.values());
const ownerChallenges = challenges.filter((c) => c.identifier === 'sharma108saransh@gmail.com');
assert.strictEqual(ownerChallenges.length, 0, 'No OTP challenges should be generated or required for owner profile');
console.log('✓ Test 5 Passed: Zero OTP required for owner profile creation and management.');
// TEST 6: Public Data Masking & DPDP Compliance
console.log('\n[Test 6] Testing DPDP Data Protection Masking in Public Views...');
const ownerRecord = db.users.get('usr_owner_saransh');
const publicView = db.toPublicProfile(ownerRecord);
assert.ok(publicView.email?.includes('***'), 'Public view must mask email per DPDP compliance');
assert.ok(!publicView.email?.includes('sharma108saransh'), 'Unmasked email must not appear in public view');
console.log('✓ Test 6 Passed: Public responses protect personal details with DPDP masking.');
console.log('\n================================================================');
console.log('ALL OWNER PROFILE & AUTH REMOVAL TESTS PASSED (100% SUCCESS)');
console.log('================================================================\n');
