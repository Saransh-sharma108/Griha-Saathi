import assert from 'assert';
import { db } from '../db.js';
import { parseNaturalLanguageQuery, executePropertySearch, generateComprehensiveComparison, calculateRecommendationScore, analyzeFraudRisk, recordAiFeedback, getAiFeedbackSummary, validateAiResponse, getSaathiProviderStatus, processSaathiChat } from '../saathiAiService.js';
async function runSaathiAiTestSuite() {
    console.log('================================================================');
    console.log('GRIHA SAATHI — ADVANCED SAATHI AI INTELLIGENCE TEST SUITE');
    console.log('================================================================\n');
    // Clear database state
    db.properties.clear();
    db.savedProperties.clear();
    db.users.clear();
    db.sessions.clear();
    db.aiFeedback.clear();
    db.aiSessions.clear();
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
    // Query E: Purchase budget in Lakhs
    const qE = parseNaturalLanguageQuery('I have a budget of 25 lakh what can I buy in Jammu', 'en');
    assert.strictEqual(qE.intent, 'property_search');
    assert.strictEqual(qE.filters.city, 'Jammu');
    assert.strictEqual(qE.filters.transactionType, 'buy');
    assert.strictEqual(qE.filters.maxBudget, 2500000);
    console.log('✓ Test 2 Passed: Natural language parser accurately extracts parameters across all languages.\n');
    // --------------------------------------------------------------------------
    // TEST 3: Multi-Turn Conversational Follow-Up & Context Retention
    // --------------------------------------------------------------------------
    console.log('[Test 3] Testing Multi-Turn Follow-Up & Session Context Retention...');
    const sessionId = 'test_session_multi_turn_01';
    // Step 1: User asks initial search
    const turn1 = await processSaathiChat({
        userQuery: 'Find 2BHK flats in Jammu under ₹15,000',
        language: 'en',
        sessionId,
    });
    assert.strictEqual(turn1.intent, 'property_search');
    assert.strictEqual(turn1.suggestedFilters?.city, 'Jammu');
    assert.strictEqual(turn1.suggestedFilters?.bedrooms, 2);
    assert.strictEqual(turn1.suggestedFilters?.maxRent, 15000);
    // Step 2: Follow-up modifies only furnishing
    const turn2 = await processSaathiChat({
        userQuery: 'Show only furnished ones',
        language: 'en',
        sessionId,
    });
    assert.strictEqual(turn2.intent, 'property_search');
    assert.strictEqual(turn2.suggestedFilters?.city, 'Jammu', 'Must retain earlier city: Jammu');
    assert.strictEqual(turn2.suggestedFilters?.bedrooms, 2, 'Must retain earlier bedrooms: 2');
    assert.strictEqual(turn2.suggestedFilters?.maxRent, 15000, 'Must retain earlier maxRent: 15000');
    assert.strictEqual(turn2.suggestedFilters?.furnishing, 'fully_furnished', 'Must update furnishing');
    console.log('✓ Test 3 Passed: Multi-turn session context successfully preserved across queries.\n');
    // --------------------------------------------------------------------------
    // TEST 4: Real Database Retrieval & Zero Synthetic Data Invariant
    // --------------------------------------------------------------------------
    console.log('[Test 4] Testing Real Database Retrieval & Zero Synthetic Data Invariant...');
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
    assert.ok(jammuSearch.properties[0].matchRationale.includes('Recommendation Score') || jammuSearch.properties[0].matchRationale.includes('Match Score'));
    console.log('✓ Test 4 Passed: Real database retrieval returns genuine matching records without hallucinations.\n');
    // --------------------------------------------------------------------------
    // TEST 5: Recommendation Scoring Engine & Invariants
    // --------------------------------------------------------------------------
    console.log('[Test 5] Testing Transparent Recommendation Scoring & Verification Invariant...');
    const scoreJammu = calculateRecommendationScore(propJammu, { city: 'Jammu', bedrooms: 2, maxRent: 15000 });
    assert.ok(scoreJammu.overallScore >= 80, 'Well-matching verified property should score >= 80');
    assert.strictEqual(scoreJammu.verificationScore, 100);
    assert.ok(scoreJammu.matchHighlights.length > 0);
    // Invariant test: Unverified property must NEVER rank above verified solely for price
    const unverifiedCheapProp = {
        ...propJammu,
        id: 'prop_unverified_cheap',
        rentPerMonth: 5000,
        verificationStatus: 'unverified',
    };
    const scoreUnverified = calculateRecommendationScore(unverifiedCheapProp, { city: 'Jammu', bedrooms: 2, maxRent: 15000 });
    assert.ok(scoreUnverified.overallScore <= 60, 'Unverified property overall score must be capped at 60');
    console.log('✓ Test 5 Passed: Recommendation scoring weights and verification caps verified.\n');
    // --------------------------------------------------------------------------
    // TEST 6: Publication Gate & Permission Isolation
    // --------------------------------------------------------------------------
    console.log('[Test 6] Testing Publication Gate & Permission Isolation (Excluding Drafts/Withdrawn)...');
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
    console.log('✓ Test 6 Passed: Publication gate strictly isolates drafts and unapproved listings.\n');
    // --------------------------------------------------------------------------
    // TEST 7: Comprehensive Side-by-Side Property Comparison
    // --------------------------------------------------------------------------
    console.log('[Test 7] Testing Comprehensive Property Comparison Engine & Disadvantages...');
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
        rentPerMonth: 18000,
        securityDeposit: 36000,
        furnishing: 'semi_furnished',
        tenantPreference: 'family',
        amenities: [],
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
    const compResult = generateComprehensiveComparison(['prop_jk_001', 'prop_hp_001']);
    assert.strictEqual(compResult.items.length, 2);
    assert.ok(compResult.strongestMatch !== undefined);
    assert.ok(compResult.bestBudgetFit !== undefined);
    assert.strictEqual(compResult.bestBudgetFit?.propertyId, 'prop_jk_001', 'Jammu property at 14k is cheaper than Shimla at 18k');
    assert.ok(compResult.questionsForOwner.length >= 3);
    console.log('✓ Test 7 Passed: Comprehensive comparison provides strongest match, budget fit, and owner questions.\n');
    // --------------------------------------------------------------------------
    // TEST 8: Trust & Fraud Risk Analysis Engine
    // --------------------------------------------------------------------------
    console.log('[Test 8] Testing Fraud Detection & Risk Analysis...');
    // Scenario 1: Advance payment before inspection requested
    const fraud1 = analyzeFraudRisk('The owner is asking for 5000 token money via UPI before showing the house');
    assert.strictEqual(fraud1.overallRiskLevel, 'high');
    assert.ok(fraud1.findings.some(f => f.code === 'ADVANCE_PAYMENT_SCAM'));
    assert.ok(fraud1.verificationChecklist.length >= 3);
    // Scenario 2: Army officer visiting pass fee
    const fraud2 = analyzeFraudRisk('The landlord says he is an army officer and needs 2000 for gate pass fee');
    assert.strictEqual(fraud2.overallRiskLevel, 'high');
    assert.ok(fraud2.findings.some(f => f.code === 'GATE_PASS_EXTORTION'));
    console.log('✓ Test 8 Passed: Fraud risk analysis reliably identifies scam patterns and generates checklists.\n');
    // --------------------------------------------------------------------------
    // TEST 9: Statutory Tenancy & Purchase Advisory Retrieval
    // --------------------------------------------------------------------------
    console.log('[Test 9] Testing Statutory Guidance, Model Tenancy Act & Purchase Advisory...');
    const depositQuery = await processSaathiChat({
        userQuery: 'What is the maximum security deposit allowed under Model Tenancy Act?',
        language: 'en',
    });
    assert.strictEqual(depositQuery.intent, 'renting_guidance');
    assert.ok(depositQuery.text.includes('capped at a maximum of two months’ rent'));
    assert.strictEqual(depositQuery.relatedEntities?.legalReference, 'Model Tenancy Act 2021, Section 11');
    const purchaseQuery = await processSaathiChat({
        userQuery: 'What due diligence is required before property purchase and registry?',
        language: 'en',
    });
    assert.strictEqual(purchaseQuery.intent, 'buying_guidance');
    assert.ok(purchaseQuery.text.includes('Title Search') || purchaseQuery.text.includes('Jamabandi'));
    console.log('✓ Test 9 Passed: Statutory tenancy and purchase advisory correctly retrieved.\n');
    // --------------------------------------------------------------------------
    // TEST 10: Quality Control & Post-Generation Validation Layer
    // --------------------------------------------------------------------------
    console.log('[Test 10] Testing Quality Control Layer (Sanitizing Hallucinated IDs)...');
    const rawMessage = {
        id: 'ai_test_qc',
        sender: 'assistant',
        text: 'Found properties',
        timestamp: '12:00 PM',
        properties: [
            {
                id: 'prop_hallucinated_fake_999',
                title: 'Fake Apartment',
                propertyType: '2bhk',
                transactionType: 'rent',
                city: 'Jammu',
                locality: 'Gandhi Nagar',
                state: 'Jammu & Kashmir',
                rentPerMonth: 9000,
                bedrooms: 2,
                furnishing: 'unfurnished',
                verificationStatus: 'authoritative_verified',
                isFresh: true,
                matchRationale: 'None',
                objectiveFacts: [],
            },
            {
                id: 'prop_jk_001',
                title: 'Real Flat with Tampered Price',
                propertyType: '2bhk',
                transactionType: 'rent',
                city: 'Jammu',
                locality: 'Gandhi Nagar',
                state: 'Jammu & Kashmir',
                rentPerMonth: 999999, // Tampered price
                bedrooms: 2,
                furnishing: 'semi_furnished',
                verificationStatus: 'authoritative_verified',
                isFresh: true,
                matchRationale: 'Real',
                objectiveFacts: [],
            },
        ],
    };
    const validated = validateAiResponse(rawMessage);
    assert.strictEqual(validated.properties?.length, 1, 'Hallucinated property must be stripped');
    assert.strictEqual(validated.properties[0].id, 'prop_jk_001');
    assert.strictEqual(validated.properties[0].rentPerMonth, 14000, 'Tampered price must be restored from actual database');
    console.log('✓ Test 10 Passed: Quality control layer strictly strips non-existent records and enforces factual integrity.\n');
    // --------------------------------------------------------------------------
    // TEST 11: User Quality Feedback Collection & Metrics
    // --------------------------------------------------------------------------
    console.log('[Test 11] Testing User Feedback Submission & Aggregation...');
    recordAiFeedback({
        messageId: 'ai_msg_001',
        queryText: 'Find 2 BHK in Jammu',
        rating: 'helpful',
        comment: 'Accurate and fast',
        userId: 'usr_test_01',
    });
    recordAiFeedback({
        messageId: 'ai_msg_002',
        queryText: 'Find 3 BHK in Gurugram',
        rating: 'helpful',
    });
    recordAiFeedback({
        messageId: 'ai_msg_003',
        queryText: 'Hostel in Shimla',
        rating: 'missing_information',
        comment: 'Need more details on meals',
    });
    const feedbackSummary = getAiFeedbackSummary();
    assert.strictEqual(feedbackSummary.total, 3);
    assert.strictEqual(feedbackSummary.helpfulCount, 2);
    assert.strictEqual(feedbackSummary.missingInfoCount, 1);
    assert.strictEqual(feedbackSummary.helpfulPercentage, 67);
    console.log('✓ Test 11 Passed: User feedback collection and reporting successfully verified.\n');
    console.log('================================================================');
    console.log('ALL 11 SAATHI AI INTELLIGENCE TEST SUITES PASSED (100% SUCCESS)');
    console.log('================================================================\n');
}
runSaathiAiTestSuite().catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
});
