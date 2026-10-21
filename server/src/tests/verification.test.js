import assert from 'assert';
import { db } from '../db.js';
import { computeVerificationChecklist, deriveVerificationBadges, detectRiskFlags, detectDuplicateListings } from '../verificationService.js';
async function runVerificationTestSuite() {
    console.log('================================================================');
    console.log('GRIHA SAATHI — PHASE 6 VERIFICATION, TRUST & FRAUD TEST SUITE');
    console.log('================================================================\n');
    // Initialize pristine database
    db.properties.clear();
    db.drafts.clear();
    db.users.clear();
    db.sessions.clear();
    db.fraudReports.clear();
    db.appeals.clear();
    db.notifications.clear();
    db.auditEvents.length = 0;
    const owner1Id = 'usr_owner_delhi_01';
    const owner2Id = 'usr_owner_jammu_02';
    const verifierId = 'usr_verifier_official_03';
    const tenantReporterId = 'usr_tenant_reporter_04';
    // Seed Users
    const seedUser = (id, identifier, role, isPhoneVerified = true) => {
        const user = {
            id,
            identifier,
            phone: identifier.startsWith('+') ? identifier : undefined,
            email: identifier.includes('@') ? identifier : undefined,
            role,
            activeRole: role,
            roles: [role],
            isPhoneVerified,
            isEmailVerified: true,
            isIdentityVerified: false,
            preferredLanguage: 'en',
            notificationPreferences: {
                emailAlerts: true,
                smsAlerts: true,
                propertyInquiries: true,
                securityAlerts: true,
            },
            pinHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
            failedPinAttempts: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        db.users.set(id, user);
        return user;
    };
    const owner1 = seedUser(owner1Id, '+919811122233', 'owner', true);
    const owner2 = seedUser(owner2Id, '+919822233344', 'owner', true);
    const verifier = seedUser(verifierId, '+919833344455', 'verifier', true);
    const tenant = seedUser(tenantReporterId, '+919844455566', 'tenant', true);
    // Helper to create valid sample property
    const createSampleProperty = (id, ownerId, overrides = {}) => ({
        id,
        ownerId,
        title: 'Authentic 2 BHK Apartment in Greater Kailash 1',
        description: 'Genuine verified home with direct sunlight and covered parking.',
        propertyType: '2bhk',
        rentPerMonth: 42000,
        securityDeposit: 84000,
        addressDetails: 'E-42, Second Floor',
        locality: 'Greater Kailash 1',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110048',
        bedrooms: 2,
        bathrooms: 2,
        areaSqFt: 1100,
        furnishing: 'semi_furnished',
        tenantPreference: 'family',
        amenities: ['Power Backup', 'Lift'],
        availableFrom: '2026-11-01',
        isAvailable: true,
        verificationStatus: 'unverified',
        submissionStatus: 'submitted',
        declaredAuthority: 'sole_owner',
        photos: ['/uploads/photos/living_room.webp'],
        documents: [],
        dataSource: 'owner_submission',
        statusHistory: [],
        isAvailabilityConfirmed: true,
        availabilityConfirmedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    });
    // --------------------------------------------------------------------------
    // TEST 1: Contact Verification vs. Legal Title Distinction & Granular Badges
    // --------------------------------------------------------------------------
    console.log('[Test 1] Testing Contact Verification vs. Legal Title Distinction...');
    const prop1 = createSampleProperty('prop_delhi_01', owner1Id, {
        submissionStatus: 'submitted',
        documents: [], // Zero property documents submitted
    });
    db.properties.set(prop1.id, prop1);
    const checklist1 = computeVerificationChecklist(prop1, owner1);
    assert.strictEqual(checklist1.items[0].status, 'passed', 'Contact phone is verified');
    assert.strictEqual(checklist1.items[2].status, 'needs_info', 'Property documents must be unverified since none uploaded');
    const badges1 = deriveVerificationBadges(prop1, checklist1);
    const badgeTypes1 = badges1.map((b) => b.type);
    assert.ok(badgeTypes1.includes('contact_verified'), 'Should include contact_verified badge');
    assert.ok(!badgeTypes1.includes('documents_reviewed'), 'Must NOT include documents_reviewed when zero docs verified');
    assert.ok(!badgeTypes1.includes('physical_inspection_completed'), 'Must NOT claim physical inspection when not performed');
    assert.ok(badgeTypes1.includes('verification_pending'), 'Should indicate pending verification');
    assert.ok(!badgeTypes1.includes('approved'), 'No generic 100% verified badge');
    console.log('✓ Contact verification strictly decoupled from legal title warranty.');
    // --------------------------------------------------------------------------
    // TEST 2: Property Document Review (Verify/Reject) & Self-Review Prohibition
    // --------------------------------------------------------------------------
    console.log('\n[Test 2] Testing Property Document Review & Self-Review Prohibition...');
    const docItem = {
        id: 'doc_deed_01',
        documentType: 'sale_deed',
        filename: 'registered_sale_deed.pdf',
        fileSize: 1200000,
        mimeType: 'application/pdf',
        documentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        uploadedAt: new Date().toISOString(),
        status: 'pending_review',
        accessRole: 'owner_and_verifier_only',
    };
    prop1.documents = [docItem];
    db.properties.set(prop1.id, prop1);
    // Self-Review Prohibition: Owner1 cannot verify their own document even with verifier role
    assert.throws(() => {
        db.reviewPropertyDocument(prop1.id, docItem.id, owner1Id, 'verifier', 'verified');
    }, /cannot certify their own documents/i, 'Owner must be barred from self-reviewing their own documents');
    // Authorized Verifier rejects document with mandatory reason
    const rejectedDoc = db.reviewPropertyDocument(prop1.id, docItem.id, verifierId, 'verifier', 'rejected', 'Illegible stamp duty seal on page 3. Please submit clear revenue extract.');
    assert.strictEqual(rejectedDoc.status, 'rejected');
    assert.strictEqual(rejectedDoc.reviewedBy, verifierId);
    assert.ok(rejectedDoc.rejectionReason?.includes('Illegible stamp duty'));
    // Update document to verified with authentic Jamabandi
    const verifiedDoc = db.reviewPropertyDocument(prop1.id, docItem.id, verifierId, 'verifier', 'verified');
    assert.strictEqual(verifiedDoc.status, 'verified');
    assert.strictEqual(verifiedDoc.reviewedBy, verifierId);
    console.log('✓ Document review lifecycle and self-review prohibition enforced.');
    // --------------------------------------------------------------------------
    // TEST 3: Listing Consistency Checks & Duplicate Listing Collision
    // --------------------------------------------------------------------------
    console.log('\n[Test 3] Testing Listing Consistency Checks & Duplicate Collision Detection...');
    // Risk anomaly: Rent ₹50, but deposit ₹300,000 (abnormal ratio) + missing photos
    const suspiciousProp = createSampleProperty('prop_suspicious_01', owner2Id, {
        rentPerMonth: 50, // Unrealistically low
        securityDeposit: 300000, // 6000x rent
        pincode: '99999', // Invalid Indian PIN (5 digits)
        photos: [],
    });
    const riskFlags = detectRiskFlags(suspiciousProp);
    assert.ok(riskFlags.some((f) => f.code === 'RENT_SUSPICIOUSLY_LOW'), 'Should flag abnormal rent');
    assert.ok(riskFlags.some((f) => f.code === 'DEPOSIT_DISPROPORTIONATE'), 'Should flag excessive deposit');
    assert.ok(riskFlags.some((f) => f.code === 'PINCODE_INVALID_FORMAT'), 'Should flag invalid PIN');
    assert.ok(riskFlags.some((f) => f.code === 'NO_PHOTOS_SUBMITTED'), 'Should flag missing photos');
    // Duplicate detection across different owner
    const duplicateProp = createSampleProperty('prop_duplicate_02', owner2Id, {
        locality: 'Greater Kailash 1',
        city: 'Delhi',
        addressDetails: 'E-42, Second Floor', // Identical to prop1
        photos: ['/uploads/photos/living_room.webp'], // Collision with prop1
    });
    const existingListings = [prop1];
    const duplicateWarnings = detectDuplicateListings(duplicateProp, existingListings);
    assert.ok(duplicateWarnings.length > 0, 'Should detect duplicate collision warning');
    assert.ok(duplicateWarnings[0].similarityScore >= 60, 'Similarity score should be >= 60');
    console.log('✓ Automated consistency and duplicate screening operate as risk indicators.');
    // --------------------------------------------------------------------------
    // TEST 4: Self-Approval Prohibition on Verification Decisions
    // --------------------------------------------------------------------------
    console.log('\n[Test 4] Testing Self-Approval Prohibition on Verification Decisions...');
    // Owner 1 attempting to approve prop1 (even if owner1 had admin privileges)
    assert.throws(() => {
        db.transitionListingStatus(prop1.id, owner1Id, 'verifier', 'approved', 'Self approval attempt');
    }, /cannot approve their own/i, 'Owner must be strictly prohibited from approving their own property');
    // Authorized Verifier approving listing
    const approvedProp = db.transitionListingStatus(prop1.id, verifierId, 'verifier', 'approved', 'Completed verification checklist and document audit.');
    assert.strictEqual(approvedProp.submissionStatus, 'approved');
    assert.strictEqual(approvedProp.verificationStatus, 'authoritative_verified');
    console.log('✓ Self-approval prohibition strictly enforced; reviewer approved successfully.');
    // --------------------------------------------------------------------------
    // TEST 5: Fraud Reporting, Anti-Spam Rate Limiting & Reporter Privacy
    // --------------------------------------------------------------------------
    console.log('\n[Test 5] Testing Fraud Reporting, Anti-Spam Rate Limiting & Reporter Privacy...');
    const report1 = db.createFraudReport({
        propertyId: prop1.id,
        reporterId: tenantReporterId,
        reason: 'misrepresented_rent',
        description: 'Owner demanded double deposit in cash off-platform contrary to listing.',
    });
    assert.ok(report1.id.startsWith('fr_'), 'Report ID should be prefixed');
    assert.strictEqual(report1.status, 'pending');
    assert.ok(report1.reporterMaskedContact?.includes('***'), 'Reporter contact must be masked');
    // Anti-Spam Rate Limiting: Same user cannot submit duplicate pending report on same property within 24h
    assert.throws(() => {
        db.createFraudReport({
            propertyId: prop1.id,
            reporterId: tenantReporterId,
            reason: 'duplicate_listing',
            description: 'Submitting duplicate spam report.',
        });
    }, /already have a pending report/i, 'Should rate-limit duplicate reports from the same reporter');
    // Moderator review and report resolution
    const resolvedReport = db.resolveFraudReport(report1.id, verifierId, 'verifier', 'listing_suspended', 'Verified fee violation. Listing suspended for review.');
    assert.strictEqual(resolvedReport.status, 'action_taken');
    assert.strictEqual(resolvedReport.moderatorAction, 'listing_suspended');
    console.log('✓ Fraud reporting, anti-spam rate limiting, and reporter concealment verified.');
    // --------------------------------------------------------------------------
    // TEST 6: Listing Suspension, Public Search Exclusion & Owner Appeal
    // --------------------------------------------------------------------------
    console.log('\n[Test 6] Testing Suspension, Public Search Exclusion & Owner Appeal...');
    // Check property status after report action
    const suspendedProp = db.properties.get(prop1.id);
    assert.strictEqual(suspendedProp.submissionStatus, 'suspended');
    // Verify badges reflect suspension
    const suspendedChecklist = computeVerificationChecklist(suspendedProp, owner1);
    const suspendedBadges = deriveVerificationBadges(suspendedProp, suspendedChecklist);
    assert.ok(suspendedBadges.some((b) => b.type === 'suspended'), 'Should show suspended badge');
    // Owner lodges an appeal
    const appeal = db.createAppeal(prop1.id, owner1Id, 'Clarification: The offline discussion was an inquiry about advance rent, not an additional deposit. Lease agreement strictly reflects ₹42,000 rent and 2 months deposit.');
    assert.ok(appeal.id.startsWith('apl_'), 'Appeal must have valid ID');
    assert.strictEqual(appeal.status, 'pending');
    // Property moves to under_review during appeal
    assert.strictEqual(db.properties.get(prop1.id).submissionStatus, 'under_review');
    // Self-Resolution Prohibition on Appeals: Owner1 cannot resolve their own appeal even with verifier role
    assert.throws(() => {
        db.resolveAppeal(appeal.id, owner1Id, 'verifier', 'accepted', 'Self accepted');
    }, /(cannot review or approve their own appeal|cannot resolve appeals)/i, 'Owner cannot resolve their own appeal');
    // Reviewer accepts appeal and reinstates property
    const resolvedAppeal = db.resolveAppeal(appeal.id, verifierId, 'verifier', 'accepted', 'Owner submitted signed lease agreement confirming compliance. Listing reinstated.');
    assert.strictEqual(resolvedAppeal.status, 'accepted');
    assert.strictEqual(db.properties.get(prop1.id).submissionStatus, 'approved');
    console.log('✓ Suspension, appeal dispute workflow, and self-resolution prohibition verified.');
    // --------------------------------------------------------------------------
    // TEST 7: In-App Notifications Verification
    // --------------------------------------------------------------------------
    console.log('\n[Test 7] Testing In-App Notifications & Audit Dispatch...');
    const ownerNotifications = db.getUserNotifications(owner1Id);
    assert.ok(ownerNotifications.length >= 3, 'Owner should receive notifications on status changes');
    const unreadNotif = ownerNotifications.find((n) => !n.isRead);
    assert.ok(unreadNotif, 'Should have unread notification');
    const marked = db.markNotificationRead(unreadNotif.id, owner1Id);
    assert.strictEqual(marked, true, 'Notification should be marked read');
    assert.strictEqual(db.notifications.get(unreadNotif.id).isRead, true);
    console.log('✓ In-app notifications properly dispatched and state-managed.');
    // --------------------------------------------------------------------------
    // TEST 8: 60-Day Freshness Reconfirmation vs. Verification Decoupling
    // --------------------------------------------------------------------------
    console.log('\n[Test 8] Testing 60-Day Freshness Decoupling...');
    // Set property availability confirmed 75 days ago
    const staleProp = createSampleProperty('prop_stale_01', owner1Id, {
        submissionStatus: 'approved',
        verificationStatus: 'authoritative_verified',
        availabilityConfirmedAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
        isAvailabilityConfirmed: false,
    });
    db.properties.set(staleProp.id, staleProp);
    const staleChecklist = computeVerificationChecklist(staleProp, owner1);
    const freshnessItem = staleChecklist.items.find((i) => i.id === 'chk_availability_freshness');
    assert.strictEqual(freshnessItem?.status, 'needs_info', 'Stale availability must fail freshness check');
    const staleBadges = deriveVerificationBadges(staleProp, staleChecklist);
    assert.ok(!staleBadges.some((b) => b.type === 'availability_confirmed'), 'Stale listing must NOT show availability confirmed');
    // Reconfirm availability
    staleProp.isAvailabilityConfirmed = true;
    staleProp.availabilityConfirmedAt = new Date().toISOString();
    db.properties.set(staleProp.id, staleProp);
    const freshChecklist = computeVerificationChecklist(staleProp, owner1);
    const freshBadges = deriveVerificationBadges(staleProp, freshChecklist);
    assert.ok(freshBadges.some((b) => b.type === 'availability_confirmed'), 'Fresh listing must show availability confirmed');
    console.log('✓ 60-day availability freshness strictly decoupled from submitter credentials.');
    console.log('\n================================================================');
    console.log('ALL PHASE 6 VERIFICATION & TRUST TESTS PASSED SUCCESSFULLY (8/8)');
    console.log('================================================================');
}
runVerificationTestSuite().catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
});
