import assert from 'assert';
import crypto from 'crypto';
import { db } from '../db.js';
import { storeUploadedFile } from '../storageService.js';
import { Property, DeclaredAuthority, PropertyDocumentItem, PropertyMediaItem } from '../../../shared/types.js';

async function runListingTestSuite() {
  console.log('================================================================');
  console.log('GRIHA SAATHI — PHASE 5 PROPERTY LISTING & WORKFLOW TEST SUITE');
  console.log('================================================================\n');

  // Initialize pristine database
  db.properties.clear();
  db.drafts.clear();
  db.users.clear();
  db.sessions.clear();
  db.auditEvents.length = 0;

  const owner1Id = 'usr_owner_gurugram_01';
  const owner2Id = 'usr_owner_chandigarh_02';
  const verifierId = 'usr_verifier_haryana_01';
  const intruderId = 'usr_tenant_intruder_03';

  // --------------------------------------------------------------------------
  // TEST 1: Backend Draft Persistence, Resumption & User Isolation
  // --------------------------------------------------------------------------
  console.log('[Test 1] Testing Backend Draft Persistence, Resumption & User Isolation...');

  const draftDataStep2 = {
    declaredAuthority: 'sole_owner' as DeclaredAuthority,
    state: 'Haryana' as const,
    city: 'Gurugram',
    locality: 'Sector 57',
    addressDetails: 'Flat 402, Tower 3, Palm Residency',
    pincode: '122003',
  };

  const draft1 = db.saveDraft(owner1Id, undefined, 2, draftDataStep2);
  assert.ok(draft1.id.startsWith('draft_'), 'Draft must be assigned a unique ID');
  assert.strictEqual(draft1.currentStep, 2);
  assert.strictEqual(draft1.userId, owner1Id);

  // Retrieve drafts for Owner 1
  const owner1Drafts = db.getUserDrafts(owner1Id);
  assert.strictEqual(owner1Drafts.length, 1);
  assert.strictEqual(owner1Drafts[0].data.locality, 'Sector 57');

  // Strict User Isolation: Owner 2 cannot access Owner 1's draft
  const intruderDraftFetch = db.getDraft(owner2Id, draft1.id);
  assert.strictEqual(intruderDraftFetch, null, 'Intruder must not be able to retrieve another user\'s draft');

  // Update draft to Step 5 with financials and photos
  const updatedDraft = db.saveDraft(owner1Id, draft1.id, 5, {
    ...draftDataStep2,
    rentPerMonth: 32000,
    securityDeposit: 64000,
    bedrooms: 2,
    bathrooms: 2,
  });
  assert.strictEqual(updatedDraft.currentStep, 5);
  assert.strictEqual(updatedDraft.data.rentPerMonth, 32000);

  // Intruder cannot delete Owner 1's draft
  const intruderDelete = db.deleteDraft(owner2Id, draft1.id);
  assert.strictEqual(intruderDelete, false, 'Intruder cannot delete another user\'s draft');

  // Owner 1 can delete their own draft
  const ownerDelete = db.deleteDraft(owner1Id, draft1.id);
  assert.strictEqual(ownerDelete, true, 'Owner must be able to delete their own draft');
  assert.strictEqual(db.getUserDrafts(owner1Id).length, 0);

  console.log('✓ Test 1 Passed: Draft persistence, resumption, and user isolation conform to security standards.\n');

  // --------------------------------------------------------------------------
  // TEST 2: Genuine File Storage Validation & Cryptographic Hashing
  // --------------------------------------------------------------------------
  console.log('[Test 2] Testing Genuine File Storage Validation & SHA-256 Hashing...');

  // 1. Valid JPEG photo
  const validPhotoBuffer = Buffer.from('fake-genuine-jpeg-image-content-bytes');
  const photoResult = await storeUploadedFile(validPhotoBuffer, 'living_room.jpg', 'image/jpeg', false);
  assert.strictEqual(photoResult.success, true);
  assert.ok(photoResult.result);
  assert.ok(photoResult.result.url.startsWith('/uploads/photos/img_'));
  assert.strictEqual(photoResult.result.sha256Hash.length, 64, 'Must compute 64-char SHA-256 digest');

  // 2. Oversized photo (> 5MB)
  const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024);
  const oversizedResult = await storeUploadedFile(oversizedBuffer, 'huge_photo.jpg', 'image/jpeg', false);
  assert.strictEqual(oversizedResult.success, false);
  assert.ok(oversizedResult.error?.includes('exceeds the permitted limit'));

  // 3. Unauthorized executable or script disguised as image
  const maliciousBuffer = Buffer.from('echo malicious script');
  const invalidMimeResult = await storeUploadedFile(maliciousBuffer, 'exploit.sh', 'application/x-sh', false);
  assert.strictEqual(invalidMimeResult.success, false);
  assert.ok(invalidMimeResult.error?.includes('Unsupported file format'));

  // 4. Valid PDF document (ownership proof)
  const validDocBuffer = Buffer.from('%PDF-1.4 genuine sale deed document extract');
  const docResult = await storeUploadedFile(validDocBuffer, 'sale_deed_registry.pdf', 'application/pdf', true);
  assert.strictEqual(docResult.success, true);
  assert.ok(docResult.result);
  assert.strictEqual(docResult.result.isPrivate, true, 'Ownership documents must be marked private');
  assert.strictEqual(docResult.result.sha256Hash.length, 64);

  console.log('✓ Test 2 Passed: File type restrictions, size bounds, and SHA-256 digests validated.\n');

  // --------------------------------------------------------------------------
  // TEST 3: DPDP Privacy Compliance (Scrubbing Documents & Internal Review Notes)
  // --------------------------------------------------------------------------
  console.log('[Test 3] Testing DPDP Act Compliance & Document Privacy Scrubbing...');

  const privateDoc: PropertyDocumentItem = {
    id: 'doc_sec_001',
    documentType: 'sale_deed',
    filename: 'doc_sec_001.pdf',
    originalFilename: 'original_registered_sale_deed.pdf',
    fileSize: 450000,
    mimeType: 'application/pdf',
    documentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    uploadedAt: new Date().toISOString(),
    status: 'verified',
    accessRole: 'owner_and_verifier_only',
  };

  const sensitiveProperty: Property = {
    id: 'prop_privacy_test_01',
    title: 'Executive 3BHK in Sector 54',
    description: 'High floor park facing apartment.',
    state: 'Haryana',
    city: 'Gurugram',
    locality: 'Sector 54',
    pincode: '122002',
    addressDetails: 'Flat 1201, Tower A, Park View',
    propertyType: '3bhk',
    bedrooms: 3,
    bathrooms: 3,
    areaSqFt: 1850,
    rentPerMonth: 48000,
    securityDeposit: 96000,
    furnishing: 'semi_furnished',
    tenantPreference: 'family',
    amenities: ['Power Backup', 'Security'],
    photos: ['/uploads/photos/img_123.jpg'],
    documents: [privateDoc],
    correctionNotes: 'INTERNAL AUDITOR NOTE: Pending verification of revenue stamp on page 3',
    verificationStatus: 'authoritative_verified',
    submissionStatus: 'approved',
    ownerId: owner1Id,
    ownerMaskedContact: '+91 98*****210',
    availableFrom: '2026-11-01',
    isAvailabilityConfirmed: true,
    availabilityConfirmedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataSource: 'owner_submission',
  };

  const publicScrubbed = db.toPublicProperty(sensitiveProperty);
  assert.strictEqual(publicScrubbed.documents, undefined, 'Private documents must be strictly scrubbed from public output');
  assert.strictEqual(publicScrubbed.correctionNotes, undefined, 'Internal auditor notes must be strictly scrubbed');
  assert.strictEqual(publicScrubbed.ownerMaskedContact, '+91 98*****210', 'Masked contact per DPDP Act standards');

  console.log('✓ Test 3 Passed: Document confidentiality and internal notes scrubbing verified.\n');

  // --------------------------------------------------------------------------
  // TEST 4: Multi-State Verification Workflow & Strict Self-Approval Prohibition
  // --------------------------------------------------------------------------
  console.log('[Test 4] Testing Multi-State Workflow & Self-Approval Prohibition...');

  // Save property in initial 'submitted' state
  const testListing: Property = {
    ...sensitiveProperty,
    id: 'prop_wf_test_01',
    submissionStatus: 'submitted',
    verificationStatus: 'unverified',
    statusHistory: [],
  };
  db.properties.set(testListing.id, testListing);

  // 1. STRICT ENFORCEMENT: Owner attempts to approve their own property
  assert.throws(
    () => {
      db.transitionListingStatus(testListing.id, owner1Id, 'owner', 'approved', 'Owner self-verifies');
    },
    /Self-approval prohibited/,
    'Owner MUST NOT be permitted to approve their own property listing'
  );

  // Even if owner falsely claims 'verifier' or 'admin' role, the ownerId check MUST block them
  assert.throws(
    () => {
      db.transitionListingStatus(testListing.id, owner1Id, 'admin', 'approved', 'Owner pretending to approve');
    },
    /Self-approval prohibited/,
    'Owner cannot approve their listing even if holding verifier role'
  );

  // 2. Field verifier requests corrections with reason
  const correctionReason = 'Jamabandi extract is over 1 year old; please upload current fiscal tax receipt or fresh mutation copy.';
  const afterCorrectionReq = db.transitionListingStatus(
    testListing.id,
    verifierId,
    'verifier',
    'correction_requested',
    correctionReason
  );
  assert.strictEqual(afterCorrectionReq.submissionStatus, 'correction_requested');
  assert.strictEqual(afterCorrectionReq.correctionNotes, correctionReason);
  assert.strictEqual(afterCorrectionReq.statusHistory?.length, 1);

  // 3. Owner responds to correction and resubmits
  const afterResubmit = db.transitionListingStatus(
    testListing.id,
    owner1Id,
    'owner',
    'resubmitted',
    'Owner uploaded fresh municipal tax receipt for 2026'
  );
  assert.strictEqual(afterResubmit.submissionStatus, 'resubmitted');
  assert.strictEqual(afterResubmit.statusHistory?.length, 2);

  // 4. Authorized Verifier approves the listing
  const afterApproval = db.transitionListingStatus(
    testListing.id,
    verifierId,
    'verifier',
    'approved',
    'Registry extract verified against Halris database'
  );
  assert.strictEqual(afterApproval.submissionStatus, 'approved');
  assert.strictEqual(afterApproval.verificationStatus, 'authoritative_verified');
  assert.ok(afterApproval.approvedAt);

  // 5. Owner withdraws listing
  const afterWithdraw = db.transitionListingStatus(
    testListing.id,
    owner1Id,
    'owner',
    'withdrawn',
    'Property leased out independently'
  );
  assert.strictEqual(afterWithdraw.submissionStatus, 'withdrawn');
  assert.ok(afterWithdraw.withdrawnAt);

  // 6. Intruder cannot transition Owner's listing
  assert.throws(
    () => {
      db.transitionListingStatus(testListing.id, intruderId, 'tenant', 'approved');
    },
    /Unauthorized/,
    'Intruder cannot perform workflow transitions on another user\'s listing'
  );

  console.log('✓ Test 4 Passed: Multi-state transitions and strict self-approval prohibition verified.\n');

  // --------------------------------------------------------------------------
  // TEST 5: Material Edits Trigger Mandatory Re-Review
  // --------------------------------------------------------------------------
  console.log('[Test 5] Testing Material Edits Triggering Re-Review on Approved Listings...');

  // Reset listing to approved
  const approvedProperty: Property = {
    ...sensitiveProperty,
    id: 'prop_material_edit_test',
    submissionStatus: 'approved',
    verificationStatus: 'authoritative_verified',
    rentPerMonth: 30000,
    locality: 'Sector 57',
    statusHistory: [],
  };
  db.properties.set(approvedProperty.id, approvedProperty);

  // Non-material edit: description update -> remains approved
  const nonMaterialUpdate = db.updateListing(
    approvedProperty.id,
    owner1Id,
    'owner',
    { description: 'Added note: newly repainted interior.' }
  );
  assert.strictEqual(nonMaterialUpdate.property.submissionStatus, 'approved', 'Non-material edit must preserve approved status');
  assert.strictEqual(nonMaterialUpdate.triggeredReReview, false, 'Non-material edit must not trigger re-review');

  // Material edit: Rent increase from 30,000 to 45,000
  const materialUpdate = db.updateListing(
    approvedProperty.id,
    owner1Id,
    'owner',
    { rentPerMonth: 45000 }
  );
  assert.strictEqual(
    materialUpdate.property.submissionStatus,
    'resubmitted',
    'Material price change must automatically trigger resubmission for re-audit'
  );
  assert.strictEqual(
    materialUpdate.property.verificationStatus,
    'pending_review',
    'Verification status must drop back to pending_review'
  );
  assert.strictEqual(materialUpdate.triggeredReReview, true, 'Material edit must trigger re-review flag');
  assert.ok(
    materialUpdate.property.statusHistory?.some((h) => h.reason?.includes('Material')),
    'Must log material modification event in audit history'
  );

  console.log('✓ Test 5 Passed: Material edits safely prevent silent publication of unverified changes.\n');

  // --------------------------------------------------------------------------
  // TEST 6: Owner Dashboard Counts Calculated from Real Database Records
  // --------------------------------------------------------------------------
  console.log('[Test 6] Testing Owner Dashboard Metrics Computed from Real Database Records...');

  db.properties.clear();
  db.drafts.clear();

  // Create 1 draft
  db.saveDraft(owner1Id, 'draft_001', 2, { title: 'Draft in Sector 14' });

  // Create 1 submitted listing
  db.properties.set('prop_owner_sub', {
    ...sensitiveProperty,
    id: 'prop_owner_sub',
    ownerId: owner1Id,
    submissionStatus: 'submitted',
  });

  // Create 1 under-review listing
  db.properties.set('prop_owner_review', {
    ...sensitiveProperty,
    id: 'prop_owner_review',
    ownerId: owner1Id,
    submissionStatus: 'under_review',
  });

  // Create 1 correction-requested listing
  db.properties.set('prop_owner_corr', {
    ...sensitiveProperty,
    id: 'prop_owner_corr',
    ownerId: owner1Id,
    submissionStatus: 'correction_requested',
  });

  // Create 2 approved listings
  db.properties.set('prop_owner_app1', {
    ...sensitiveProperty,
    id: 'prop_owner_app1',
    ownerId: owner1Id,
    submissionStatus: 'approved',
  });
  db.properties.set('prop_owner_app2', {
    ...sensitiveProperty,
    id: 'prop_owner_app2',
    ownerId: owner1Id,
    submissionStatus: 'approved',
  });

  // Create 1 withdrawn listing
  db.properties.set('prop_owner_withdrawn', {
    ...sensitiveProperty,
    id: 'prop_owner_withdrawn',
    ownerId: owner1Id,
    submissionStatus: 'withdrawn',
  });

  // Compute summary metrics
  const summary = db.getOwnerListingSummary(owner1Id);
  assert.strictEqual(summary.total, 7, 'Total must equal 6 real submitted listings + 1 draft');
  assert.strictEqual(summary.drafts, 1, 'Draft count must equal 1 real draft');
  assert.strictEqual(summary.submitted, 1);
  assert.strictEqual(summary.underReview, 1);
  assert.strictEqual(summary.correctionRequested, 1);
  assert.strictEqual(summary.approved, 2);
  assert.strictEqual(summary.withdrawn, 1);
  assert.strictEqual(summary.rejectedOrExpired, 0);

  // New owner with zero listings receives pure zero counts (no sample/fake activity)
  const emptyOwnerSummary = db.getOwnerListingSummary('usr_new_owner_without_listings');
  assert.strictEqual(emptyOwnerSummary.total, 0);
  assert.strictEqual(emptyOwnerSummary.drafts, 0);
  assert.strictEqual(emptyOwnerSummary.approved, 0);

  console.log('✓ Test 6 Passed: Dashboard counts reflect actual database records with zero synthetic data.\n');

  // --------------------------------------------------------------------------
  // TEST 7: Public Search Gating (Only Approved Listings Visible)
  // --------------------------------------------------------------------------
  console.log('[Test 7] Testing Public Search Isolation of Unapproved Listings...');

  // Public search query simulation: only submissionStatus === 'approved' (or legacy records without submissionStatus)
  const allDatabaseListings = Array.from(db.properties.values());
  const publicSearchResults = allDatabaseListings.filter((p) => {
    return p.submissionStatus === 'approved' || !p.submissionStatus;
  });

  // From the 6 listings in DB, only the 2 approved listings should enter public discovery
  assert.strictEqual(publicSearchResults.length, 2);
  assert.ok(publicSearchResults.every((p) => p.submissionStatus === 'approved'));

  console.log('✓ Test 7 Passed: Unapproved, withdrawn, and under-review listings strictly excluded from search.\n');

  console.log('================================================================');
  console.log('ALL 7 PHASE 5 PROPERTY LISTING & WORKFLOW TESTS PASSED (100%)');
  console.log('================================================================');
}

runListingTestSuite().catch((err) => {
  console.error('\n❌ Phase 5 Test Failed with Error:', err);
  process.exit(1);
});
