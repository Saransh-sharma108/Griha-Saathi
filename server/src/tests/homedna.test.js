/**
 * Griha Saathi — Home DNA Studio Test Suite
 * Tests deterministic ranking, hard constraint enforcement, evidence generation,
 * weight normalization, and missing data behavior.
 */
import assert from 'assert';
import { DEFAULT_HOME_DNA_PREFERENCES, DEFAULT_HOME_DNA_REQUIREMENTS, normalizeWeights, getSummaryDescriptors, evaluateHardConstraints, evaluateHomeDnaMatch, rankPropertiesWithHomeDna } from '../../../shared/homeDnaEngine.js';
console.log('================================================================');
console.log('GRIHA SAATHI — HOME DNA STUDIO MATCHING & VERIFICATION TESTS');
console.log('================================================================\n');
// 1. Mock Real Properties (reflecting real database schemas)
const mockGurugramProp = {
    id: 'prop_hr_001',
    title: 'Modern 2BHK in Sector 54',
    description: 'Verified Gurugram high-rise apartment near Rapid Metro.',
    state: 'Haryana',
    city: 'Gurugram',
    locality: 'Sector 54',
    pincode: '122002',
    propertyType: '2bhk',
    bedrooms: 2,
    bathrooms: 2,
    areaSqFt: 1150,
    rentPerMonth: 35000,
    securityDeposit: 70000,
    maintenanceCharges: 2500,
    furnishing: 'fully_furnished',
    tenantPreference: 'family',
    amenities: ['Power Backup', 'Gated Security', 'Lift', 'Dedicated Parking'],
    photos: ['./images/modern_apartment.jpg'],
    verificationStatus: 'authoritative_verified',
    submissionStatus: 'approved',
    ownerId: 'usr_owner_hr',
    availableFrom: '2026-11-01',
    availabilityStatus: 'available',
    availabilityConfirmedAt: new Date().toISOString(),
    isAvailabilityConfirmed: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataSource: 'owner_submission',
};
const mockDelhiProp = {
    id: 'prop_dl_003',
    title: 'Cozy 1BHK in Saket',
    description: 'Verified DDA colony apartment in South Delhi near Select Citywalk.',
    state: 'Delhi',
    city: 'New Delhi',
    locality: 'Saket',
    pincode: '110017',
    propertyType: '1bhk',
    bedrooms: 1,
    bathrooms: 1,
    areaSqFt: 600,
    rentPerMonth: 18000,
    securityDeposit: 36000,
    maintenanceCharges: 800,
    furnishing: 'unfurnished',
    tenantPreference: 'any',
    amenities: ['Power Backup', 'Municipal Water Supply', 'Gated Security'],
    photos: ['./images/hero_villa.jpg'],
    verificationStatus: 'authoritative_verified',
    submissionStatus: 'approved',
    ownerId: 'usr_owner_dl',
    availableFrom: '2026-10-01',
    availabilityStatus: 'available',
    availabilityConfirmedAt: '2026-07-01T00:00:00.000Z', // Stale
    isAvailabilityConfirmed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataSource: 'owner_submission',
};
const mockMohaliProp = {
    id: 'prop_pb_002',
    title: 'Spacious 3BHK in Sector 70',
    description: 'Title matched with Punjab PLRS revenue portal. Premium residential tower.',
    state: 'Punjab',
    city: 'Mohali',
    locality: 'Sector 70',
    pincode: '160071',
    propertyType: '3bhk',
    bedrooms: 3,
    bathrooms: 3,
    areaSqFt: 1650,
    rentPerMonth: 28000,
    securityDeposit: 56000,
    maintenanceCharges: 2000,
    furnishing: 'semi_furnished',
    tenantPreference: 'bachelors',
    amenities: ['Dedicated Parking', 'Municipal Water Supply', 'Power Backup', 'Lift'],
    photos: ['./images/apartment_mohali.jpg'],
    verificationStatus: 'authoritative_verified',
    submissionStatus: 'approved',
    ownerId: 'usr_owner_pb',
    availableFrom: '2026-11-15',
    availabilityStatus: 'available',
    availabilityConfirmedAt: new Date().toISOString(),
    isAvailabilityConfirmed: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataSource: 'authorized_registry',
};
const mockPropMissingArea = {
    id: 'prop_missing_area',
    title: 'Traditional House in Old Town',
    description: 'Charming historic home with no declared carpet area.',
    state: 'Delhi',
    city: 'New Delhi',
    locality: 'Chandni Chowk',
    pincode: '110006',
    propertyType: 'independent_house',
    bedrooms: 2,
    bathrooms: 1,
    rentPerMonth: 20000,
    securityDeposit: 40000,
    furnishing: 'unfurnished',
    tenantPreference: 'any',
    amenities: [],
    photos: [],
    verificationStatus: 'document_verified',
    submissionStatus: 'approved',
    ownerId: 'usr_owner_generic',
    availableFrom: '2026-11-01',
    isAvailabilityConfirmed: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dataSource: 'owner_submission',
};
// [TEST 1] Prototype Initial Values & Weight Normalization
console.log('[Test 1] Testing Default Prototype Values & Weight Normalization...');
assert.strictEqual(DEFAULT_HOME_DNA_PREFERENCES.budgetFlexibility, 45, 'Default budget flexibility must be 45%');
assert.strictEqual(DEFAULT_HOME_DNA_PREFERENCES.livingSpacePriority, 65, 'Default space priority must be 65%');
assert.strictEqual(DEFAULT_HOME_DNA_PREFERENCES.locationPriority, 80, 'Default location priority must be 80%');
const norm = normalizeWeights(DEFAULT_HOME_DNA_PREFERENCES);
const totalSum = norm.budgetWeight + norm.spaceWeight + norm.locationWeight;
assert(Math.abs(totalSum - 1.0) < 0.0001, 'Normalized weights must sum strictly to 1.0');
assert(norm.locationWeight > norm.spaceWeight, 'Location weight must be highest with initial 80%');
assert(norm.spaceWeight > norm.budgetWeight, 'Space weight must be higher than budget with 65% vs 45%');
// Test zero weights fallback
const zeroNorm = normalizeWeights({ budgetFlexibility: 0, livingSpacePriority: 0, locationPriority: 0 });
assert.strictEqual(zeroNorm.budgetWeight, 1 / 3, 'Zero weights must default to equal split');
console.log('✓ Test 1 Passed: Default values and normalization verified.');
// [TEST 2] Summary Descriptors (Directive 05 Requirements)
console.log('\n[Test 2] Testing Home DNA Summary Descriptors...');
const descriptors = getSummaryDescriptors(DEFAULT_HOME_DNA_PREFERENCES);
assert.strictEqual(descriptors.budgetDescriptor, 'Moderate', 'Initial budget descriptor must be Moderate');
assert.strictEqual(descriptors.spaceDescriptor, 'Important', 'Initial space descriptor must be Important');
assert.strictEqual(descriptors.locationDescriptor, 'A strong priority', 'Initial location descriptor must be A strong priority');
assert(descriptors.tradeoffInsight.length > 20, 'Trade-off insight must be informative and non-empty');
console.log('✓ Test 2 Passed: Summary descriptors match Directive 05 requirements.');
// [TEST 3] Hard Constraints Enforcement (Directive 08)
console.log('\n[Test 3] Testing Hard Constraint Boundary Enforcement...');
// Constraint: Max budget = 25,000 INR
const budgetReq = {
    ...DEFAULT_HOME_DNA_REQUIREMENTS,
    maxBudget: 25000,
};
const evalGurugram = evaluateHardConstraints(mockGurugramProp, budgetReq);
assert.strictEqual(evalGurugram.isViolated, true, 'Gurugram property (35,000) must violate 25,000 max budget');
assert(evalGurugram.reasons[0].includes('exceeds max budget'), 'Must include specific budget overage reason');
const evalDelhi = evaluateHardConstraints(mockDelhiProp, budgetReq);
assert.strictEqual(evalDelhi.isViolated, false, 'Delhi property (18,000) must satisfy 25,000 max budget');
// Constraint: State = Punjab
const stateReq = {
    ...DEFAULT_HOME_DNA_REQUIREMENTS,
    state: 'Punjab',
};
assert.strictEqual(evaluateHardConstraints(mockMohaliProp, stateReq).isViolated, false);
assert.strictEqual(evaluateHardConstraints(mockDelhiProp, stateReq).isViolated, true);
// Constraint: Min bedrooms = 3
const bedReq = {
    ...DEFAULT_HOME_DNA_REQUIREMENTS,
    minBedrooms: 3,
};
assert.strictEqual(evaluateHardConstraints(mockMohaliProp, bedReq).isViolated, false);
assert.strictEqual(evaluateHardConstraints(mockGurugramProp, bedReq).isViolated, true);
console.log('✓ Test 3 Passed: Hard constraints strictly enforced without leakage.');
// [TEST 4] Ranking Engine & Preference Adjustment Impact (Directive 10)
console.log('\n[Test 4] Testing Preference Adjustment Consequence on Ranking...');
const pool = [mockGurugramProp, mockDelhiProp, mockMohaliProp];
// Scenario A: Space priority maxed out (95%), Location low (20%), Budget moderate (40%)
const spaceFocusPrefs = {
    budgetFlexibility: 40,
    livingSpacePriority: 95,
    locationPriority: 20,
};
const openRequirements = {
    ...DEFAULT_HOME_DNA_REQUIREMENTS,
    state: 'all',
    maxBudget: 50000,
};
const rankSpace = rankPropertiesWithHomeDna(pool, spaceFocusPrefs, openRequirements);
assert.strictEqual(rankSpace.rankedResults.length, 3);
// 1650 sq.ft 3BHK Mohali should rank higher in space fit than 600 sq.ft Saket
assert.strictEqual(rankSpace.rankedResults[0].property.id, 'prop_pb_002', 'Spacious 3BHK must rank #1 when living space is prioritized at 95%');
// Scenario B: Budget priority maxed out (95%), Space low (10%), Location low (10%)
const budgetFocusPrefs = {
    budgetFlexibility: 95,
    livingSpacePriority: 10,
    locationPriority: 10,
};
const rankBudget = rankPropertiesWithHomeDna(pool, budgetFocusPrefs, openRequirements);
// 18,000 INR Delhi should rank top because it offers highest budget savings
assert.strictEqual(rankBudget.rankedResults[0].property.id, 'prop_dl_003', 'Lowest rent (₹18,000) must rank #1 when budget priority is maxed');
// Scenario C: Locality anchor on Saket
const locationFocusReq = {
    ...DEFAULT_HOME_DNA_REQUIREMENTS,
    locality: 'Saket',
};
const rankLocation = rankPropertiesWithHomeDna(pool, DEFAULT_HOME_DNA_PREFERENCES, locationFocusReq);
assert.strictEqual(rankLocation.rankedResults[0].property.id, 'prop_dl_003', 'Saket listing must rank #1 when locality Saket is requested');
console.log('✓ Test 4 Passed: Ranking responds deterministically to preference shifts.');
// [TEST 5] Missing Data Honest Handling (Directive 07 & 12)
console.log('\n[Test 5] Testing Truthful Handling of Incomplete Records...');
const evalMissing = evaluateHomeDnaMatch(mockPropMissingArea, DEFAULT_HOME_DNA_PREFERENCES, DEFAULT_HOME_DNA_REQUIREMENTS);
assert.strictEqual(evalMissing.dimensionScores.spaceFit, 60, 'Missing area must get neutral 60 score, never 100 or 0');
assert(evalMissing.tradeOffs.some(t => t.includes('Exact carpet area was not declared')), 'Must honestly disclose missing carpet area in trade-offs');
console.log('✓ Test 5 Passed: Missing data handled honestly without fabricated placeholders.');
// [TEST 6] Evidence-Based Explanation Integrity (Directive 09)
console.log('\n[Test 6] Testing Evidence Reasons & Trade-Offs Data Integrity...');
const evalMohali = evaluateHomeDnaMatch(mockMohaliProp, DEFAULT_HOME_DNA_PREFERENCES, {
    ...DEFAULT_HOME_DNA_REQUIREMENTS,
    maxBudget: 35000,
    locality: 'Sector 70',
});
assert(evalMohali.evidenceReasons.some(r => r.includes('below your stated budget')), 'Evidence must report verified budget savings');
assert(evalMohali.evidenceReasons.some(r => r.includes('1,650 sq.ft')), 'Evidence must report actual listed square footage');
assert(evalMohali.evidenceReasons.some(r => r.includes('Sector 70')), 'Evidence must report actual matching locality');
assert(evalMohali.evidenceReasons.some(r => r.includes('Authoritative Land Registry')), 'Evidence must report real registry status');
// Trade-off for Delhi stale freshness
const evalDelhiStale = evaluateHomeDnaMatch(mockDelhiProp, DEFAULT_HOME_DNA_PREFERENCES, DEFAULT_HOME_DNA_REQUIREMENTS);
assert(evalDelhiStale.tradeOffs.some(t => t.includes('not been reconfirmed')), 'Must flag stale listing freshness in trade-offs');
assert(evalDelhiStale.tradeOffs.some(t => t.includes('Unfurnished')), 'Must disclose unfurnished trade-off');
console.log('✓ Test 6 Passed: Evidence and trade-offs are 100% grounded in factual property data.');
// [TEST 7] Empty Search Results & Graceful Fallback
console.log('\n[Test 7] Testing Empty Search Results Integrity...');
const impossibleReq = {
    ...DEFAULT_HOME_DNA_REQUIREMENTS,
    maxBudget: 10000, // No property in pool under 10k
};
const emptyRank = rankPropertiesWithHomeDna(pool, DEFAULT_HOME_DNA_PREFERENCES, impossibleReq);
assert.strictEqual(emptyRank.rankedResults.length, 0, 'Must return 0 results when no property satisfies budget ceiling');
assert.strictEqual(emptyRank.excludedCount, 3, 'Must report all 3 properties as excluded by hard constraints');
console.log('✓ Test 7 Passed: Empty results handled truthfully without synthetic mocks.');
console.log('\n================================================================');
console.log('ALL 7 HOME DNA STUDIO ENGINE TESTS PASSED WITH 100% SUCCESS!');
console.log('================================================================');
