import assert from 'assert';
import crypto from 'crypto';
import { db, FRESHNESS_POLICY_DAYS } from '../db.js';
import { propertyDataEngine } from '../propertyDataEngine/propertyDataEngine.js';
import { TARGET_REGIONS_LIST } from '../propertyDataEngine/adapters/firstPartyDirectAdapter.js';
import { Property, TargetState, VerificationRecord } from '../../../shared/types.js';

async function runRealPropertyDataEngineTestSuite() {
  console.log('================================================================');
  console.log('GRIHA SAATHI — REAL PROPERTY DATA ENGINE & FIVE-REGION TEST SUITE');
  console.log('================================================================\n');

  // Reset database state for fresh test execution
  db.properties.clear();
  db.savedProperties.clear();
  db.users.clear();
  db.sessions.clear();
  db.auditEvents.length = 0;

  // --------------------------------------------------------------------------
  // TEST 1: Absolute Data-Integrity Law & Zero Synthetic Listings in Default State
  // --------------------------------------------------------------------------
  console.log('[Test 1] Testing Absolute Data-Integrity Law & Default Zero State...');
  assert.strictEqual(db.properties.size, 0, 'Database must contain 0 synthetic listings in default state');
  
  const initialRegionalMatrix = propertyDataEngine.getRegionalCoverageMatrix();
  assert.strictEqual(initialRegionalMatrix.totalGenuineListings, 0, 'Total genuine listings must be 0 initially');
  assert.strictEqual(initialRegionalMatrix.zeroSyntheticPolicyEnforced, true);
  assert.strictEqual(initialRegionalMatrix.totalRegions, 5);

  // Verify all 5 regions report 'connected_no_listings' when 0 listings exist
  for (const region of TARGET_REGIONS_LIST) {
    const report = initialRegionalMatrix.regions[region];
    assert.ok(report, `Region ${region} must have a status report`);
    assert.strictEqual(report.region, region);
    assert.strictEqual(report.status, 'connected_no_listings');
    assert.strictEqual(report.activeListingCount, 0);
    assert.ok(report.limitations.length > 0, 'Limitations must be clearly stated');
  }
  console.log('✓ Test 1 Passed: Zero synthetic listings verified. 5-region status truthfully reflects empty state.\n');

  // --------------------------------------------------------------------------
  // TEST 2: Provider Adapters & Credential Gating (Directive 2 & 4)
  // --------------------------------------------------------------------------
  console.log('[Test 2] Testing Provider Adapters & Credential Isolation...');
  const providers = propertyDataEngine.getAllProvidersStatus();
  assert.strictEqual(providers.length, 4, 'Must have 4 registered data provider adapters');

  const firstParty = providers.find((p) => p.id === 'griha_saathi_direct');
  assert.ok(firstParty, 'First-party direct adapter must exist');
  assert.strictEqual(firstParty?.status, 'connected');
  assert.strictEqual(firstParty?.configured, true);

  const dataGovIn = providers.find((p) => p.id === 'data_gov_in');
  assert.ok(dataGovIn, 'Data.gov.in adapter must exist');
  assert.strictEqual(dataGovIn?.status, 'awaiting_credentials');
  assert.strictEqual(dataGovIn?.configured, false);
  assert.ok(dataGovIn?.requiredCredentials.includes('DATA_GOV_IN_API_KEY'));

  const rera = providers.find((p) => p.id === 'state_rera_registry');
  assert.ok(rera, 'State RERA adapter must exist');
  assert.strictEqual(rera?.status, 'awaiting_credentials');
  assert.strictEqual(rera?.configured, false);

  const syndication = providers.find((p) => p.id === 'partner_syndication');
  assert.ok(syndication, 'Partner syndication adapter must exist');
  assert.strictEqual(syndication?.status, 'awaiting_credentials');
  assert.strictEqual(syndication?.configured, false);

  // Test that unconfigured adapters return 0 results and never fake listings
  const unconfiguredResult = await dataGovInAdapterTest();
  assert.strictEqual(unconfiguredResult.properties.length, 0);
  assert.strictEqual(unconfiguredResult.isFallback, false);
  console.log('✓ Test 2 Passed: Provider adapter credential gating and zero fake responses verified.\n');

  // --------------------------------------------------------------------------
  // TEST 3: Traceable Provenance Contract (Directive 5)
  // --------------------------------------------------------------------------
  console.log('[Test 3] Testing Traceable Provenance Contract on Authentic Listings...');
  const now = Date.now();
  const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();

  const mockVerification: VerificationRecord = {
    propertyId: 'prop_hr_real_01',
    status: 'authoritative_verified',
    overallScore: 95,
    disclaimer: 'Haryana Jamabandi land record audit verified.',
    stages: [
      { stage: 'land_registry', authorityName: 'Jamabandi Web-HALRIS', status: 'verified', details: 'Title deed confirmed.' },
      { stage: 'physical_inspection', authorityName: 'Field Inspector', status: 'verified', details: 'Walkthrough verified.' },
      { stage: 'owner_identity', authorityName: 'DigiLocker', status: 'verified', details: 'Aadhaar matched.' },
    ],
  };

  const realPropertyHaryana: Property = {
    id: 'prop_hr_real_01',
    title: 'Executive 3BHK in DLF Phase 5',
    description: 'Authentic owner-listed residence verified against Haryana Jamabandi cadastral records.',
    state: 'Haryana',
    city: 'Gurugram',
    locality: 'DLF Phase 5',
    pincode: '122009',
    propertyType: '3bhk',
    bedrooms: 3,
    bathrooms: 3,
    areaSqFt: 1850,
    rentPerMonth: 65000,
    securityDeposit: 130000,
    furnishing: 'fully_furnished',
    tenantPreference: 'family',
    amenities: ['Power Backup', 'Gated Security', 'Dedicated Parking'],
    photos: ['/uploads/photos/dlf_real_photo.jpg'],
    verificationStatus: 'authoritative_verified',
    submissionStatus: 'approved',
    verificationRecord: mockVerification,
    ownerId: 'usr_owner_gurugram',
    ownerMaskedContact: '+91 98112 23344',
    availableFrom: '2026-11-01',
    availabilityStatus: 'available',
    availabilityConfirmedAt: tenDaysAgo,
    isAvailabilityConfirmed: true,
    createdAt: tenDaysAgo,
    updatedAt: tenDaysAgo,
    dataSource: 'owner_submission',
  };

  db.properties.set(realPropertyHaryana.id, realPropertyHaryana);

  // Search through PropertyDataEngine
  const searchResult = await propertyDataEngine.searchProperties({ state: 'Haryana' });
  assert.strictEqual(searchResult.total, 1);
  const returnedProp = searchResult.properties[0];

  assert.ok(returnedProp.provenance, 'Property must contain provenance object');
  assert.strictEqual(returnedProp.provenance?.provider, 'griha_saathi_direct');
  assert.strictEqual(returnedProp.provenance?.providerListingId, 'prop_hr_real_01');
  assert.ok(returnedProp.provenance?.sourceUrl.includes('prop_hr_real_01'));
  assert.strictEqual(returnedProp.provenance?.availabilityConfirmationStatus, 'confirmed');
  assert.strictEqual(returnedProp.provenance?.isFresh, true);
  assert.strictEqual(returnedProp.provenance?.verificationBreakdown.hasTitleDeedCheck, true);
  assert.strictEqual(returnedProp.provenance?.verificationBreakdown.hasPhysicalInspection, true);
  assert.strictEqual(returnedProp.provenance?.verificationBreakdown.hasIdentityVerification, true);
  console.log('✓ Test 3 Passed: Complete traceable provenance contract verified.\n');

  // --------------------------------------------------------------------------
  // TEST 4: Five-Region Matrix Evidence Update (Directive 3)
  // --------------------------------------------------------------------------
  console.log('[Test 4] Testing Five-Region Coverage Matrix Dynamic Update...');
  const updatedMatrix = propertyDataEngine.getRegionalCoverageMatrix();
  assert.strictEqual(updatedMatrix.totalGenuineListings, 1);
  assert.strictEqual(updatedMatrix.connectedRegionsCount, 1);
  
  // Haryana should now be 'connected' with count 1
  assert.strictEqual(updatedMatrix.regions['Haryana'].status, 'connected');
  assert.strictEqual(updatedMatrix.regions['Haryana'].activeListingCount, 1);
  assert.ok(updatedMatrix.regions['Haryana'].statusLabel.includes('1 Verified Listing'));

  // Other 4 regions must remain truthfully 'connected_no_listings' with count 0
  assert.strictEqual(updatedMatrix.regions['Delhi'].status, 'connected_no_listings');
  assert.strictEqual(updatedMatrix.regions['Delhi'].activeListingCount, 0);
  assert.strictEqual(updatedMatrix.regions['Punjab'].status, 'connected_no_listings');
  assert.strictEqual(updatedMatrix.regions['Punjab'].activeListingCount, 0);
  assert.strictEqual(updatedMatrix.regions['Himachal Pradesh'].status, 'connected_no_listings');
  assert.strictEqual(updatedMatrix.regions['Himachal Pradesh'].activeListingCount, 0);
  assert.strictEqual(updatedMatrix.regions['Jammu & Kashmir'].status, 'connected_no_listings');
  assert.strictEqual(updatedMatrix.regions['Jammu & Kashmir'].activeListingCount, 0);
  console.log('✓ Test 4 Passed: 5-region status independently and dynamically evidenced.\n');

  // --------------------------------------------------------------------------
  // TEST 5: Freshness Policy Enforcement (60-day Window) (Directive 6)
  // --------------------------------------------------------------------------
  console.log('[Test 5] Testing 60-Day Freshness Policy & Availability Lapse...');
  const eightyDaysAgo = new Date(now - 80 * 24 * 60 * 60 * 1000).toISOString();

  const stalePropPunjab: Property = {
    id: 'prop_pb_stale_02',
    title: 'Modern 2BHK in Sector 82 Mohali',
    description: 'Authentic flat in Mohali.',
    state: 'Punjab',
    city: 'Mohali',
    locality: 'Sector 82',
    pincode: '160082',
    propertyType: '2bhk',
    bedrooms: 2,
    bathrooms: 2,
    rentPerMonth: 22000,
    securityDeposit: 44000,
    furnishing: 'semi_furnished',
    tenantPreference: 'any',
    amenities: ['Power Backup', 'Dedicated Parking'],
    photos: ['/uploads/photos/mohali_real.jpg'],
    verificationStatus: 'authoritative_verified',
    submissionStatus: 'approved',
    verificationRecord: {
      propertyId: 'prop_pb_stale_02',
      status: 'authoritative_verified',
      disclaimer: 'PLRS Punjab verified.',
      stages: [{ stage: 'land_registry', authorityName: 'PLRS Punjab', status: 'verified', details: 'Verified.' }],
    },
    ownerId: 'usr_owner_mohali',
    availableFrom: '2026-09-01',
    availabilityStatus: 'available',
    availabilityConfirmedAt: eightyDaysAgo, // > 60 days
    isAvailabilityConfirmed: false,
    createdAt: eightyDaysAgo,
    updatedAt: eightyDaysAgo,
    dataSource: 'owner_submission',
  };

  db.properties.set(stalePropPunjab.id, stalePropPunjab);

  const staleSearch = await propertyDataEngine.searchProperties({ confirmedAvailableOnly: true });
  // Stale property should be excluded when searching confirmedAvailableOnly
  const foundStale = staleSearch.properties.find((p) => p.id === 'prop_pb_stale_02');
  assert.strictEqual(foundStale, undefined, 'Stale listing must be excluded when confirmedAvailableOnly=true');

  const allSearch = await propertyDataEngine.searchProperties({ confirmedAvailableOnly: false });
  const foundInAll = allSearch.properties.find((p) => p.id === 'prop_pb_stale_02');
  assert.ok(foundInAll, 'Stale listing must appear when searching all');
  assert.strictEqual(foundInAll?.provenance?.availabilityConfirmationStatus, 'unconfirmed');
  assert.strictEqual(foundInAll?.provenance?.isFresh, false);
  console.log('✓ Test 5 Passed: 60-day availability freshness strictly enforced.\n');

  // --------------------------------------------------------------------------
  // TEST 6: Zero-Synthetic Invariant Guard (Directive 0 & 12)
  // --------------------------------------------------------------------------
  console.log('[Test 6] Testing Zero-Synthetic Invariant Runtime Guard...');
  // A property with prohibited synthetic text must be rejected
  const fakeProp: Property = {
    id: 'prop_fake_001',
    title: 'Lorem ipsum dummy property',
    description: 'This is a sample listing for testing',
    state: 'Delhi',
    city: 'New Delhi',
    locality: 'Saket',
    pincode: '110017',
    propertyType: '1bhk',
    rentPerMonth: 15000,
    securityDeposit: 30000,
    furnishing: 'unfurnished',
    tenantPreference: 'any',
    amenities: [],
    photos: [],
    verificationStatus: 'authoritative_verified',
    submissionStatus: 'approved',
    ownerId: 'usr_fake',
    availableFrom: '2026-11-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataSource: 'owner_submission',
  };

  assert.throws(
    () => propertyDataEngine.validateDataIntegrity(fakeProp),
    /synthetic placeholder text/,
    'Data engine must reject properties with synthetic placeholder words'
  );

  // A property claiming authoritative_verified without a verificationRecord must be rejected
  const unverifiedClaim: Property = {
    ...realPropertyHaryana,
    id: 'prop_fake_002',
    title: 'Unverified Claim Apartment',
    verificationRecord: undefined,
  };

  assert.throws(
    () => propertyDataEngine.validateDataIntegrity(unverifiedClaim),
    /claimed authoritative_verified without supporting verificationRecord/,
    'Data engine must reject unevidenced verification claims'
  );
  console.log('✓ Test 6 Passed: Zero-synthetic invariant runtime guards confirmed.\n');

  // Clean up
  db.properties.clear();

  console.log('================================================================');
  console.log('ALL 6 REAL PROPERTY DATA ENGINE TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================');
}

async function dataGovInAdapterTest() {
  const adapter = propertyDataEngine.getAdapter('data_gov_in');
  return adapter!.fetchListings({});
}

runRealPropertyDataEngineTestSuite().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
