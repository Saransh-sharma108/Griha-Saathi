import assert from 'assert';
import { db } from '../db.js';
import { parseNaturalLanguageQuery, executePropertySearch, generatePropertyComparison, getSaathiProviderStatus, processSaathiChat } from '../saathiAiService.js';
async function runSaathiAiTestSuite() {
    console.log('================================================================');
    console.log('GRIHA SAATHI — PHASE 8 SAATHI AI INTELLIGENT ASSISTANT TEST SUITE');
    console.log('================================================================\n');
    // Clear database state
    db.properties.clear();
    db.savedProperties.clear();
    db.users.clear();
    db.sessions.clear();
    db.auditEvents.length = 0;
    // --------------------------------------------------------------------------
    // TEST 1: Honest Provider Status & Decoupling
    // --------------------------------------------------------------------------
    console.log('[Test 1] Testing Honest Provider Status Decoupling & Setup Notice...');
    delete process.env.GEMINI_API_KEY; // Ensure unset
    const statusUnset = getSaathiProviderStatus();
    assert.strictEqual(statusUnset.configured, false, 'Should be false when GEMINI_API_KEY is not set');
    assert.strictEqual(statusUnset.provider, 'deterministic_rules', 'Should fallback to deterministic_rules');
    assert.ok(statusUnset.notice.includes('GEMINI_API_KEY is not configured'), 'Should provide clear setup notice');
    // Test when key is configured
    process.env.GEMINI_API_KEY = 'mock_valid_test_key_gemini_2026';
    const statusConfigured = getSaathiProviderStatus();
    assert.strictEqual(statusConfigured.configured, true, 'Should be true when GEMINI_API_KEY is configured');
    assert.strictEqual(statusConfigured.provider, 'gemini', 'Should use gemini provider');
    delete process.env.GEMINI_API_KEY; // Reset back to honest unset for realistic tests
    console.log('✓ Test 1 Passed: AI provider decoupling and honest setup notice verified.\n');
    // --------------------------------------------------------------------------
    // TEST 2: Natural Language Query Parser across Regions and Languages
    // --------------------------------------------------------------------------
    console.log('[Test 2] Testing Natural Language Query Parsing (English, Hindi, Hinglish)...');
    // Query A: "Find a 2 BHK flat for rent in Jammu under ₹15,000"
    const qA = parseNaturalLanguageQuery('Find a 2 BHK flat for rent in Jammu under ₹15,000', 'en');
    assert.strictEqual(qA.intent, 'property_search');
    assert.strictEqual(qA.filters.city, 'Jammu');
    assert.strictEqual(qA.filters.state, 'Jammu & Kashmir');
    assert.strictEqual(qA.filters.bedrooms, 2);
    assert.strictEqual(qA.filters.maxRent, 15000);
    assert.strictEqual(qA.filters.transactionType, 'rent');
    // Query B: Hindi: "जम्मू में 15000 के अंदर 2 BHK फ्लैट"
    const qB = parseNaturalLanguageQuery('जम्मू में 15000 के अंदर 2 BHK फ्लैट', 'hi');
    assert.strictEqual(qB.intent, 'property_search');
    assert.strictEqual(qB.filters.state, 'Jammu & Kashmir');
    assert.strictEqual(qB.filters.bedrooms, 2);
    assert.strictEqual(qB.filters.maxRent, 15000);
    // Query C: Hinglish: "Gurugram mein 3 bhk under 40k fully furnished"
    const qC = parseNaturalLanguageQuery('Gurugram mein 3 bhk under 40k fully furnished', 'hi-en');
    assert.strictEqual(qC.intent, 'property_search');
    assert.strictEqual(qC.filters.city, 'Gurugram');
    assert.strictEqual(qC.filters.state, 'Haryana');
    assert.strictEqual(qC.filters.bedrooms, 3);
    assert.strictEqual(qC.filters.maxRent, 40000);
    assert.strictEqual(qC.filters.furnishing, 'fully_furnished');
    // Query D: Missing location should trigger follow-up
    const qD = parseNaturalLanguageQuery('Find me a flat to rent under 20000', 'en');
    assert.strictEqual(qD.intent, 'missing_info_followup');
    assert.strictEqual(qD.isMissingCriticalInfo, true);
    assert.ok(qD.missingParameters.includes('location'));
    console.log('✓ Test 2 Passed: Natural language parser accurately extracts parameters across all languages.\n');
    // --------------------------------------------------------------------------
    // TEST 3: Real Database Retrieval & Zero Synthetic Data Invariant
    // --------------------------------------------------------------------------
    console.log('[Test 3] Testing Real Database Retrieval & Zero Synthetic Data Invariant...');
    // Initially empty
    const emptySearch = executePropertySearch({ state: 'Jammu & Kashmir', maxRent: 15000 }, 'en');
    assert.strictEqual(emptySearch.totalMatches, 0, 'Must have 0 matches on empty database');
    assert.strictEqual(emptySearch.properties.length, 0);
    assert.ok(emptySearch.explanation.includes('No verified properties currently match'));
    // Seed authentic test properties
    const mockVerification = (propId, state) => ({
        propertyId: propId,
        status: 'authoritative_verified',
        overallScore: 95,
        disclaimer: 'Authoritative audit completed.',
        stages: [
            {
                stage: 'land_registry',
                authorityName: state === 'Jammu & Kashmir' ? 'Aapki Zameen Aapki Nigrani' : 'Jamabandi',
                status: 'verified',
                details: 'Title cross-referenced with state revenue registry.',
            },
        ],
    });
    const propJammu = {
        id: 'prop_jk_001',
        title: 'Sunny 2 BHK in Gandhi Nagar',
        description: 'Authentic 2 BHK flat near Gandhi Nagar park.',
        state: 'Jammu & Kashmir',
        city: 'Jammu',
        locality: 'Gandhi Nagar',
        pincode: '180004',
        propertyType: '2bhk',
        bedrooms: 2,
        bathrooms: 2,
        areaSqFt: 980,
        rentPerMonth: 14000,
        securityDeposit: 28000,
        furnishing: 'semi_furnished',
        tenantPreference: 'family',
        amenities: ['Power Backup', 'Water Tank', 'Parking'],
        photos: ['/uploads/photos/jammu_flat_1.jpg'],
        verificationStatus: 'authoritative_verified',
        submissionStatus: 'approved',
        ownerId: 'usr_owner_jk',
        ownerMaskedContact: '+91 98******10',
        availableFrom: '2026-11-01',
        availabilityConfirmedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dataSource: 'owner_submission',
    };
    db.properties.set(propJammu.id, propJammu);
    db.verificationRecords.set(propJammu.id, mockVerification(propJammu.id, 'Jammu & Kashmir'));
    const propGurugram = {
        id: 'prop_hr_001',
        title: 'Modern 3 BHK in DLF Phase 4',
        description: 'Spacious apartment with Jamabandi verification.',
        state: 'Haryana',
        city: 'Gurugram',
        locality: 'DLF Phase 4',
        pincode: '122002',
        propertyType: '3bhk',
        bedrooms: 3,
        bathrooms: 3,
        areaSqFt: 1650,
        rentPerMonth: 38000,
        securityDeposit: 76000,
        furnishing: 'fully_furnished',
        tenantPreference: 'any',
        amenities: ['Lift', '24x7 Security', 'Covered Parking', 'Clubhouse'],
        photos: ['/uploads/photos/dlf_flat_1.jpg'],
        verificationStatus: 'authoritative_verified',
        submissionStatus: 'approved',
        ownerId: 'usr_owner_hr',
        ownerMaskedContact: '+91 94******44',
        availableFrom: '2026-11-15',
        availabilityConfirmedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dataSource: 'owner_submission',
    };
    db.properties.set(propGurugram.id, propGurugram);
    db.verificationRecords.set(propGurugram.id, mockVerification(propGurugram.id, 'Haryana'));
    // Test retrieval for Jammu under ₹15,000
    const jammuSearch = executePropertySearch({ city: 'Jammu', bedrooms: 2, maxRent: 15000 }, 'en');
    assert.strictEqual(jammuSearch.totalMatches, 1, 'Should find 1 real matching property in Jammu');
    assert.strictEqual(jammuSearch.properties[0].id, 'prop_jk_001');
    assert.strictEqual(jammuSearch.properties[0].rentPerMonth, 14000);
    assert.strictEqual(jammuSearch.properties[0].bedrooms, 2);
    assert.ok(jammuSearch.properties[0].matchRationale.includes('2 BHK'));
    assert.ok(jammuSearch.properties[0].objectiveFacts.some(f => f.includes('₹14,000')));
    console.log('✓ Test 3 Passed: Real database retrieval returns genuine matching records without hallucinations.\n');
    // --------------------------------------------------------------------------
    // TEST 4: Publication Gate & Permission Isolation
    // --------------------------------------------------------------------------
    console.log('[Test 4] Testing Publication Gate & Permission Isolation (Excluding Drafts/Withdrawn)...');
    // Create an unapproved / draft property in Jammu
    const draftProp = {
        id: 'prop_jk_draft',
        title: 'Unapproved Draft Flat in Jammu',
        description: 'This is a draft listing.',
        state: 'Jammu & Kashmir',
        city: 'Jammu',
        locality: 'Gandhi Nagar',
        pincode: '180004',
        propertyType: '2bhk',
        bedrooms: 2,
        bathrooms: 2,
        rentPerMonth: 12000,
        securityDeposit: 24000,
        furnishing: 'unfurnished',
        tenantPreference: 'any',
        amenities: [],
        photos: [],
        verificationStatus: 'pending_review',
        submissionStatus: 'draft',
        ownerId: 'usr_owner_jk',
        availableFrom: '2026-11-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dataSource: 'owner_submission',
    };
    db.properties.set(draftProp.id, draftProp);
    const searchWithDraft = executePropertySearch({ city: 'Jammu', bedrooms: 2, maxRent: 15000 }, 'en');
    assert.strictEqual(searchWithDraft.totalMatches, 1, 'Must strictly exclude draft properties from AI retrieval');
    assert.strictEqual(searchWithDraft.properties[0].id, 'prop_jk_001');
    console.log('✓ Test 4 Passed: Publication gate strictly isolates drafts and unapproved listings.\n');
    // --------------------------------------------------------------------------
    // TEST 5: Side-by-Side Property Comparison with "Not provided" for Missing Fields
    // --------------------------------------------------------------------------
    console.log('[Test 5] Testing Side-by-Side Comparison Engine & Missing Field Handling...');
    // Create property with some missing optional fields (e.g. areaSqFt missing)
    const propShimla = {
        id: 'prop_hp_001',
        title: 'Quaint 2 BHK Cottage in Shimla',
        description: 'Himbhoomi verified.',
        state: 'Himachal Pradesh',
        city: 'Shimla',
        locality: 'Mall Road',
        pincode: '171001',
        propertyType: '2bhk',
        bedrooms: 2,
        // areaSqFt omitted intentionally
        rentPerMonth: 18000,
        securityDeposit: 36000,
        furnishing: 'semi_furnished',
        tenantPreference: 'family',
        amenities: [], // amenities empty
        photos: [],
        verificationStatus: 'authoritative_verified',
        submissionStatus: 'approved',
        ownerId: 'usr_owner_hp',
        availableFrom: '2026-12-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dataSource: 'owner_submission',
    };
    db.properties.set(propShimla.id, propShimla);
    const comparison = generatePropertyComparison(['prop_jk_001', 'prop_hp_001', 'non_existent_id']);
    assert.strictEqual(comparison.length, 2, 'Should compare the 2 real properties, ignoring invalid IDs');
    const compJammu = comparison.find(c => c.propertyId === 'prop_jk_001');
    const compShimla = comparison.find(c => c.propertyId === 'prop_hp_001');
    assert.strictEqual(compJammu.area, '980 sq.ft');
    assert.strictEqual(compShimla.area, 'Not provided', 'Missing area must strictly be "Not provided"');
    assert.deepStrictEqual(compShimla.amenities, ['Not provided'], 'Empty amenities must be "Not provided"');
    assert.strictEqual(compShimla.rentOrPrice, '₹18,000/month');
    console.log('✓ Test 5 Passed: Side-by-side comparison displays accurate facts and marks missing fields as "Not provided".\n');
    // --------------------------------------------------------------------------
    // TEST 6: Statutory Tenancy & Fraud Prevention Guidance Retrieval
    // --------------------------------------------------------------------------
    console.log('[Test 6] Testing Tenancy Guidance, Model Tenancy Act & Fraud Prevention Knowledge...');
    const depositQuery = await processSaathiChat({
        userQuery: 'What is the maximum security deposit allowed under Model Tenancy Act?',
        language: 'en',
    });
    assert.strictEqual(depositQuery.intent, 'renting_guidance');
    assert.ok(depositQuery.text.includes('capped at a maximum of two months’ rent'));
    assert.strictEqual(depositQuery.relatedEntities?.legalReference, 'Model Tenancy Act 2021, Section 11');
    const fraudQuery = await processSaathiChat({
        userQuery: 'How to avoid rental scams and fraud before visiting?',
        language: 'en',
    });
    assert.strictEqual(fraudQuery.intent, 'fraud_safety');
    assert.ok(fraudQuery.text.includes('Never transfer token money via UPI before a physical inspection'));
    console.log('✓ Test 6 Passed: Statutory guidance correctly retrieved with verified legal references.\n');
    // --------------------------------------------------------------------------
    // TEST 7: Conversational Flow, Follow-up Prompts & Action Handlers
    // --------------------------------------------------------------------------
    console.log('[Test 7] Testing Conversational Flow & Consequential Action Handlers...');
    const chatSearch = await processSaathiChat({
        userQuery: 'Find a 2 BHK flat for rent in Jammu under ₹15,000',
        language: 'en',
    });
    assert.strictEqual(chatSearch.intent, 'property_search');
    assert.strictEqual(chatSearch.properties?.length, 1);
    assert.ok(chatSearch.actions && chatSearch.actions.length > 0);
    // Missing info test
    const chatMissing = await processSaathiChat({
        userQuery: 'Find me a 2 BHK flat',
        language: 'en',
    });
    assert.strictEqual(chatMissing.intent, 'missing_info_followup');
    assert.ok(chatMissing.followUpQuestion?.includes('which city or state'));
    assert.ok(chatMissing.actions?.some(a => a.label.includes('Jammu')));
    console.log('✓ Test 7 Passed: Conversational flow, follow-up questions, and action suggestions operate cleanly.\n');
    console.log('================================================================');
    console.log('ALL 7 PHASE 8 SAATHI AI TESTS PASSED SUCCESSFULLY (100%)');
    console.log('================================================================\n');
}
runSaathiAiTestSuite().catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
});
