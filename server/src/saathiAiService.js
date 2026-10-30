import crypto from 'crypto';
import { db, FRESHNESS_POLICY_DAYS } from './db.js';
// ==============================================================================
// 1. REGIONAL KNOWLEDGE & STATUTORY REPOSITORY (5 TARGET TERRITORIES)
// ==============================================================================
export const TARGET_REGIONS = {
    'Delhi': {
        districts: ['New Delhi', 'South Delhi', 'North Delhi', 'West Delhi', 'East Delhi', 'Dwarka', 'Rohini', 'Central Delhi', 'Shahdara'],
        localities: ['Saket', 'Vasant Kunj', 'Dwarka Sector 10', 'Dwarka Sector 6', 'Dwarka Sector 12', 'Dwarka Sector 21', 'Rohini Sector 13', 'Rohini Sector 9', 'Connaught Place', 'Lajpat Nagar', 'Karol Bagh', 'Hauz Khas', 'Greater Kailash', 'Green Park', 'Defence Colony', 'Mayur Vihar'],
        registrySystem: 'Delhi DORIS / DDA Land Records (ddalandrecords.delhi.gov.in)',
        reraAuthority: 'Delhi RERA (rera.delhi.gov.in)',
        medianRent2BHK: 24000,
    },
    'Haryana': {
        districts: ['Gurugram', 'Faridabad', 'Panchkula', 'Panipat', 'Karnal', 'Ambala', 'Sonipat', 'Rohtak', 'Hisar', 'Yamunanagar'],
        localities: ['Cyber City', 'DLF Phase 1', 'DLF Phase 2', 'DLF Phase 3', 'DLF Phase 4', 'DLF Phase 5', 'Sector 14', 'Sector 21', 'Sector 23', 'Sector 29', 'Sector 43', 'Sector 54', 'Sector 56', 'Sector 57', 'Golf Course Road', 'Sohna Road', 'Sushant Lok', 'Nirvana Country', 'Sector 15 Faridabad', 'Green Field'],
        registrySystem: 'Haryana Jamabandi / Web-HALRIS (jamabandi.nic.in)',
        reraAuthority: 'Haryana RERA Gurugram & Panchkula (haryanarera.gov.in)',
        medianRent2BHK: 28000,
    },
    'Punjab': {
        districts: ['Chandigarh', 'Mohali', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Hoshiarpur'],
        localities: ['Sector 17', 'Sector 35', 'Sector 8', 'Sector 9', 'Sector 22', 'Sector 70 Mohali', 'Phase 3B2 Mohali', 'Phase 7 Mohali', 'Aerocity', 'Model Town Ludhiana', 'Sarabha Nagar', 'Ranjit Avenue Amritsar', 'Civil Lines Jalandhar'],
        registrySystem: 'Punjab Land Records Society (PLRS Fard Kendra - plrs.org.in)',
        reraAuthority: 'Punjab RERA (rera.punjab.gov.in)',
        medianRent2BHK: 18000,
    },
    'Himachal Pradesh': {
        districts: ['Shimla', 'Dharamshala', 'Solan', 'Kullu', 'Mandi', 'Kangra', 'Manali', 'Hamirpur', 'Una'],
        localities: ['Mall Road', 'Chotta Shimla', 'Sanjauli', 'Kasumpti', 'New Shimla', 'Jakhoo', 'Summer Hill', 'McLeod Ganj', 'Kotwali Dharamshala', 'Dari', 'Kandaghat Solan', 'Barog', 'Shamshi Kullu'],
        registrySystem: 'Himachal Pradesh Himbhoomi Land Records (lpr.hp.nic.in)',
        reraAuthority: 'Himachal Pradesh RERA (hprera.nic.in)',
        medianRent2BHK: 16000,
    },
    'Jammu & Kashmir': {
        districts: ['Jammu', 'Srinagar', 'Udhampur', 'Katra', 'Anantnag', 'Baramulla', 'Kathua', 'Samba', 'Rajouri', 'Pulwama', 'Budgam'],
        localities: ['Gandhi Nagar', 'Channi Himmat', 'Bahu Fort Area', 'Trikuta Nagar', 'Sainik Colony', 'Talab Tillo', 'Janipur', 'Shastri Nagar', 'Rajbagh', 'Lal Chowk', 'Hyderpora', 'Karan Nagar', 'Bemina', 'Sanat Nagar'],
        registrySystem: 'Aapki Zameen Aapki Nigrani (landrecords.jk.gov.in)',
        reraAuthority: 'J&K Real Estate Regulatory Authority',
        medianRent2BHK: 14000,
    },
};
export const STATUTORY_GUIDANCE = [
    {
        id: 'deposit_cap',
        topic: 'Security Deposit Limits',
        keywords: ['security deposit', 'deposit', 'advance', 'peshgi', 'सिक्योरिटी', 'डिपॉजिट', 'अग्रिम', 'advance rent'],
        statutoryRef: 'Model Tenancy Act 2021, Section 11',
        content: {
            en: 'Under the Model Tenancy Act 2021 (the statutory benchmark across Delhi, Haryana, Punjab, HP, and J&K), security deposits for residential premises are strictly capped at a maximum of two months’ rent. For non-residential/commercial premises, the cap is six months’ rent. Landlords cannot legally demand excessive 6-10 month deposits for residential tenancies. Griha Saathi explicitly audits listing deposit terms.',
            hi: 'मॉडल किरायेदारी अधिनियम 2021 (धारा 11) के तहत आवासीय परिसर के लिए सुरक्षा जमा (सिक्योरिटी डिपॉजिट) अधिकतम दो महीने के किराये तक सीमित है। व्यावसायिक संपत्तियों के लिए अधिकतम छह महीने का नियम है। मकान मालिक 6-10 महीने के अत्यधिक डिपॉजिट की मांग कानूनी रूप से नहीं कर सकते। गृह साथी प्रत्येक लिस्टिंग के डिपॉजिट नियमों की जांच करता है।',
            'hi-en': 'Model Tenancy Act 2021 (Section 11) ke mutabiq residential properties ke liye security deposit strictly maximum 2 months rent tak capped hai, aur commercial ke liye maximum 6 months. Landlords legally 6-10 mahine ka excessive deposit demand nahi kar sakte. Griha Saathi listing terms ko verify karta hai.',
        },
    },
    {
        id: 'notice_eviction',
        topic: 'Notice Period & Eviction Rights',
        keywords: ['notice period', 'vacate', 'eviction', 'evict', 'खाली', 'नोटिस', 'be-dakhal', 'leave', 'lock-in'],
        statutoryRef: 'Model Tenancy Act 2021, Sections 9, 21 & 22',
        content: {
            en: 'Under the Model Tenancy Act:\n1. Landlords must provide at least 90 days’ advance written notice before revising rent.\n2. Tenancy termination requires at least 30 days’ notice unless a different duration is mutually specified in the registered lease.\n3. Unlawful eviction without a Rent Court order, cutting off electricity or water supply, or changing locks is strictly punishable by law.\n4. During the agreed lock-in period, neither party may unilaterally terminate the agreement without contractual cause.',
            hi: 'मॉडल किरायेदारी अधिनियम के अनुसार:\n1. किराया संशोधन के लिए कम से कम 90 दिन पहले लिखित नोटिस अनिवार्य है।\n2. लीज समाप्ति के लिए कम से कम 30 दिन का नोटिस आवश्यक है।\n3. रेंट कोर्ट के आदेश के बिना बिजली-पानी काटना या जबरन बेदखल करना कानूनन दंडनीय अपराध है।\n4. सहमत लॉक-इन अवधि के दौरान कोई भी पक्ष बिना वैध कारण के समझौता रद्द नहीं कर सकता।',
            'hi-en': 'Model Tenancy Act ke tehat:\n1. Rent revise karne ke liye at least 90 days advance written notice mandatory hai.\n2. Lease termination ke liye minimum 30 days notice required hota hai.\n3. Rent Court order ke bina zabardasti be-dakhal karna ya bijli-pani ka connection kaatna criminal violation hai.\n4. Lock-in period ke dauraan unilateral termination strictly prohibited hai.',
        },
    },
    {
        id: 'fraud_prevention',
        topic: 'Rental Fraud Warning Signs & Safety Protocol',
        keywords: ['fraud', 'scam', 'fake', 'धोखा', 'फर्जी', 'स्कैम', 'token money', 'upi scam', 'suspicious', 'gate pass', 'visiting card fee', 'army officer'],
        statutoryRef: 'Griha Saathi Anti-Fraud Directive GS-AFD-2026',
        content: {
            en: 'Top rental fraud warning signs & safety rules:\n1. Never transfer token money or deposit via UPI before a physical inspection or authorized digital land-record verification.\n2. Beware of impostors claiming to be "army officers", "NRI owners overseas", or "CISF/airport staff" asking for a "visiting card fee", "gate pass fee", or "military clearance deposit". These are 100% scam patterns.\n3. Ensure the person presenting the lease is the registered title owner or holds a registered Power of Attorney (PoA).\n4. All Griha Saathi properties feature an Authoritative Verification Badge cross-referenced with state land registries. Use the "Report Fraud" button if you encounter misrepresentation.',
            hi: 'रेंटल फ्रॉड से बचने के महत्वपूर्ण नियम:\n1. भौतिक निरीक्षण या भूमि रिकॉर्ड सत्यापन से पहले कभी भी यूपीआई से टोकन मनी या एडवांस न भेजें।\n2. "सेना अधिकारी", "एनआरआई", या "सीआईएसएफ" के नाम पर विजिटिंग पास शुल्क या गेट पास मांगने वालों से सावधान रहें; यह 100% धोखाधड़ी है।\n3. यह अवश्य जांचें कि लीज देने वाला व्यक्ति वास्तविक टाइटल मालिक है या उसके पास पंजीकृत मुख्तारनामा (PoA) है।\n4. संदिग्ध लिस्टिंग दिखने पर तुरंत "Report Fraud" बटन का उपयोग करें।',
            'hi-en': 'Rental fraud aur scams se bachne ke golden rules:\n1. Physical visit ya land record audit se pehle kabhi bhi UPI pe advance token transfer mat karein.\n2. "Army officer" ya "NRI landlord" bol kar "Gate pass fee" ya "Visiting card charge" maangne wale 100% fraudsters hote hain.\n3. Verify karein ki owner ka naam state revenue registry records se match karta ho.\n4. Kisi bhi suspicious listing ko Griha Saathi ke "Report Fraud" button se report karein.',
        },
    },
    {
        id: 'verification_process',
        topic: 'How Griha Saathi Verification Works',
        keywords: ['verification', 'satyapit', 'सत्यापन', 'jamabandi', 'plrs', 'himbhoomi', 'aapki zameen', 'doris', 'audit'],
        statutoryRef: 'Griha Saathi Authoritative Verification Protocol GS-APV-2026',
        content: {
            en: 'Griha Saathi verification follows a strict 4-tier pipeline:\n1. Land Registry Cross-Reference: Title deeds checked against Haryana Jamabandi/Web-HALRIS, Punjab PLRS Fard Kendra, Delhi DORIS, HP Himbhoomi, or J&K Aapki Zameen Aapki Nigrani.\n2. Authoritative Identity: Owner or representative DigiLocker Aadhaar/e-KYC verification.\n3. Physical On-Site Inspection: Geo-tagged photo inspection conducted by trained field reviewers.\n4. Freshness Gate: Availability reconfirmed every 60 days to prevent stale or phantom listings.',
            hi: 'गृह साथी का सत्यापन 4 चरणों में होता है:\n1. भूमि रिकॉर्ड मिलान: हरियाणा जमाबंदी, पंजाब पीएलआरएस, दिल्ली डोरिस, हिमाचल हिमभूमि या जम्मू-कश्मीर आपकी ज़मीन आपकी निगरानी से टाइटल मिलान।\n2. पहचान सत्यापन: डिजीलॉकर और आधार ई-केवाईसी द्वारा प्रामाणिक पहचान।\n3. ऑन-साइट जियो-इंस्पेक्शन: प्रशिक्षित फील्ड निरीक्षकों द्वारा भौतिक सत्यापन।\n4. 60-दिवसीय फ्रेशनेस: संपत्तियों की उपलब्धता की हर 60 दिन में पुनः पुष्टि।',
            'hi-en': 'Griha Saathi ka 4-tier verification protocol:\n1. State Revenue Land Records (Jamabandi, PLRS, DORIS, Himbhoomi, J&K revenue) se title cross-check.\n2. DigiLocker authenticated Aadhaar ID verification.\n3. Trained field inspectors dwara geo-tagged on-site physical visit.\n4. Stale listings prevent karne ke liye 60-day availability reconfirmation rule.',
        },
    },
    {
        id: 'purchase_advisory',
        topic: 'Property Purchase & Title Search Due Diligence',
        keywords: ['how to buy', 'purchase advisory', 'due diligence', 'title search', 'stamp duty', 'khareedne se pehle', 'खरीदने से पहले', 'rera registered', 'non-encumbrance', 'patwar', 'fard', 'inteqal', 'legal process to buy'],
        statutoryRef: 'Transfer of Property Act 1882 & Real Estate (Regulation and Development) Act 2016',
        content: {
            en: 'Essential checklist before purchasing property in Delhi, Haryana, Punjab, HP, or J&K:\n1. Title Search: Obtain a 30-year Search Report and Non-Encumbrance Certificate from the Sub-Registrar office.\n2. Revenue Records: Verify the Jamabandi/Fard/Inteqal (Mutation) in Haryana, Punjab, HP, or J&K land records.\n3. RERA Registration: For ongoing projects, verify the project registration number on the state RERA portal.\n4. Approvals: Check layout approval, Master Plan compliance, and Completion/Occupancy Certificate (CC/OC).\n5. Stamp Duty: Calculate applicable state stamp duty (e.g. Haryana 5-7%, Delhi 4-6%, Punjab 5-7%) and registration fees.',
            hi: 'संपत्ति खरीदने से पहले आवश्यक जांच सूची:\n1. टाइटल सर्च: सब-रजिस्ट्रार कार्यालय से 30 वर्षीय सर्च रिपोर्ट और भारमुक्त प्रमाण पत्र (Non-Encumbrance Certificate) प्राप्त करें।\n2. राजस्व रिकॉर्ड: जमाबंदी, फर्द या इंतकाल का राज्य के राजस्व पोर्टल से मिलान करें।\n3. रेरा पंजीकरण: निर्माणाधीन प्रोजेक्ट के लिए राज्य रेरा पोर्टल पर पंजीकरण संख्या अवश्य जांचें।\n4. स्वीकृतियां: लेआउट प्लान, मास्टर प्लान अनुपालन और सीसी/ओसी प्रमाण पत्र की जांच करें।\n5. स्टाम्प शुल्क: राज्य के अनुसार लागू स्टाम्प शुल्क और पंजीकरण शुल्क का अग्रिम आकलन करें।',
            'hi-en': 'Property khareedne se pehle due-diligence checklist:\n1. Sub-Registrar office se 30-year Search Report aur Non-Encumbrance Certificate lein.\n2. Haryana Jamabandi, Punjab PLRS, ya J&K revenue records se mutation (Inteqal) check karein.\n3. State RERA portal par builder project ka active RERA registration verify karein.\n4. Layout approval aur Completion Certificate (CC/OC) confirm karein.',
        },
    },
    {
        id: 'visit_scheduling',
        topic: 'Property Visits & Connections',
        keywords: ['visit', 'schedule', 'inspection', 'विज़िट', 'निरीक्षण', 'mulaqat', 'connection', 'appointment', 'viewing'],
        statutoryRef: 'Griha Saathi Mutual Respect & Safe Visit Protocol',
        content: {
            en: 'To inspect a property safely:\n1. Click "Connect with Owner" on any verified listing to initiate an authenticated connection request.\n2. Once the owner accepts, propose a visit slot (morning, afternoon, or evening) via the Visit Scheduler.\n3. Both parties receive audited in-app confirmations, preventing double-bookings or no-shows.\n4. Never share personal OTPs, security PINs, or financial information during inspections.',
            hi: 'संपत्ति के सुरक्षित निरीक्षण हेतु:\n1. सत्यापित लिस्टिंग पर "Connect with Owner" दबाकर प्रामाणिक कनेक्शन शुरू करें।\n2. मालिक की स्वीकृति के बाद हमारे विजिट शेड्यूलर से सुबह, दोपहर या शाम का स्लॉट चुनें।\n3. दोनों पक्षों को ऑडिटेड कन्फर्मेशन प्राप्त होता है, जिससे स्लॉट क्लैश नहीं होता।\n4. कभी भी किसी के साथ अपना ओटीपी या पिन साझा न करें।',
            'hi-en': 'Safe property visit schedule karne ka process:\n1. Verified listing par "Connect with Owner" click karein.\n2. Connection accept hone ke baad Visit Scheduler se preferred date & slot propose karein.\n3. Double-booking prevent karne ke liye system automated conflict check karta hai.\n4. Visit ke dauraan kisi ke saath apna OTP ya banking PIN share na karein.',
        },
    },
];
export function parseNaturalLanguageQuery(rawQuery, language = 'en', previousContext) {
    const query = rawQuery.toLowerCase().trim();
    // Inherit previous filters if this is a follow-up conversation
    const previousFilters = previousContext?.lastFilters || {};
    const isExplicitNewSearch = query.startsWith('new search') || query.startsWith('start over') || query.startsWith('reset');
    const filters = isExplicitNewSearch ? {} : { ...previousFilters };
    const extractedKeywords = [];
    const missingParameters = [];
    let isFollowUp = false;
    // 1. Check Fraud Risk Intent
    const fraudKeywords = [
        'token money', 'upi scam', 'gate pass', 'visiting card fee', 'advance payment',
        'army officer', 'cisf', 'nri owner', 'is this safe', 'is this fraud', 'scam',
        'suspicious', 'धोखा', 'स्कैम', 'एडवांस', 'सुरक्षित'
    ];
    const hasFraudIntent = fraudKeywords.some(kw => query.includes(kw));
    if (hasFraudIntent && (query.includes('advance') || query.includes('token') || query.includes('safe') || query.includes('scam') || query.includes('fee') || query.includes('pass'))) {
        const fraudAnalysis = analyzeFraudRisk(rawQuery);
        return {
            intent: 'fraud_safety',
            filters,
            extractedKeywords: ['fraud_risk_analysis'],
            isMissingCriticalInfo: false,
            missingParameters: [],
            comparisonPropertyIds: [],
            matchedGuidanceTopic: STATUTORY_GUIDANCE.find(g => g.id === 'fraud_prevention'),
            isFollowUp: false,
            fraudAnalysis,
        };
    }
    // 2. Check Comparison Intent
    const comparisonKeywords = ['compare', 'vs', 'versus', 'difference between', 'तुल्ना', 'तुलना', 'muqabla', 'farq'];
    const hasComparisonIntent = comparisonKeywords.some(kw => query.includes(kw));
    const propIdRegex = /\bprop_[a-z0-9_]+\b/gi;
    const explicitPropIds = (rawQuery.match(propIdRegex) || []).map(id => id.trim());
    if (hasComparisonIntent || explicitPropIds.length >= 2) {
        return {
            intent: 'property_comparison',
            filters: {},
            extractedKeywords: ['comparison'],
            isMissingCriticalInfo: false,
            missingParameters: [],
            comparisonPropertyIds: explicitPropIds,
            isFollowUp: false,
        };
    }
    // 3. Check Guidance Intent (statutory, legal, verification, deposit)
    const matchedGuidance = STATUTORY_GUIDANCE.find(item => item.keywords.some(kw => query.includes(kw)));
    // 4. Detect State / Region
    let locationDetectedInCurrentQuery = false;
    if (query.includes('jammu') || query.includes('kashmir') || query.includes('j&k') || query.includes('jk') || query.includes('srinagar') || query.includes('जम्मू') || query.includes('कश्मीर') || query.includes('श्रीनगर')) {
        filters.state = 'Jammu & Kashmir';
        if (query.includes('jammu') || query.includes('जम्मू'))
            filters.city = 'Jammu';
        if (query.includes('srinagar') || query.includes('श्रीनगर'))
            filters.city = 'Srinagar';
        extractedKeywords.push('Jammu & Kashmir');
        locationDetectedInCurrentQuery = true;
    }
    else if (query.includes('haryana') || query.includes('gurugram') || query.includes('gurgaon') || query.includes('faridabad') || query.includes('panipat') || query.includes('panchkula') || query.includes('sonipat') || query.includes('हरियाणा') || query.includes('गुरुग्राम') || query.includes('गुड़गांव') || query.includes('फरीदाबाद')) {
        filters.state = 'Haryana';
        if (query.includes('gurugram') || query.includes('gurgaon') || query.includes('गुरुग्राम') || query.includes('गुड़गांव'))
            filters.city = 'Gurugram';
        if (query.includes('faridabad') || query.includes('फरीदाबाद'))
            filters.city = 'Faridabad';
        extractedKeywords.push('Haryana');
        locationDetectedInCurrentQuery = true;
    }
    else if (query.includes('punjab') || query.includes('chandigarh') || query.includes('mohali') || query.includes('ludhiana') || query.includes('amritsar') || query.includes('jalandhar') || query.includes('पंजाब') || query.includes('चंडीगढ़') || query.includes('मोहाली') || query.includes('लुधियाना')) {
        filters.state = 'Punjab';
        if (query.includes('chandigarh') || query.includes('चंडीगढ़'))
            filters.city = 'Chandigarh';
        if (query.includes('mohali') || query.includes('मोहाली'))
            filters.city = 'Mohali';
        if (query.includes('ludhiana') || query.includes('लुधियाना'))
            filters.city = 'Ludhiana';
        extractedKeywords.push('Punjab');
        locationDetectedInCurrentQuery = true;
    }
    else if (query.includes('himachal') || query.includes('hp') || query.includes('shimla') || query.includes('dharamshala') || query.includes('solan') || query.includes('kullu') || query.includes('manali') || query.includes('हिमाचल') || query.includes('शिमला') || query.includes('धर्मशाला')) {
        filters.state = 'Himachal Pradesh';
        if (query.includes('shimla') || query.includes('शिमला'))
            filters.city = 'Shimla';
        if (query.includes('dharamshala') || query.includes('धर्मशाला'))
            filters.city = 'Dharamshala';
        extractedKeywords.push('Himachal Pradesh');
        locationDetectedInCurrentQuery = true;
    }
    else if (query.includes('delhi') || query.includes('ncr') || query.includes('dwarka') || query.includes('saket') || query.includes('rohini') || query.includes('south delhi') || query.includes('दिल्ली') || query.includes('द्वारका') || query.includes('साकेत') || query.includes('रोहिणी')) {
        filters.state = 'Delhi';
        filters.city = 'New Delhi';
        extractedKeywords.push('Delhi');
        locationDetectedInCurrentQuery = true;
    }
    // Detect City / District
    const allDistricts = Object.entries(TARGET_REGIONS).flatMap(([state, data]) => data.districts.map(d => ({ state: state, district: d })));
    for (const item of allDistricts) {
        if (query.includes(item.district.toLowerCase())) {
            filters.city = item.district;
            if (!filters.state)
                filters.state = item.state;
            extractedKeywords.push(item.district);
            locationDetectedInCurrentQuery = true;
            break;
        }
    }
    // Detect Locality
    const allLocalities = Object.entries(TARGET_REGIONS).flatMap(([state, data]) => data.localities.map(l => ({ state: state, locality: l })));
    for (const item of allLocalities) {
        if (query.includes(item.locality.toLowerCase())) {
            filters.locality = item.locality;
            if (!filters.state)
                filters.state = item.state;
            extractedKeywords.push(item.locality);
            locationDetectedInCurrentQuery = true;
            break;
        }
    }
    // 5. Detect Property Categories & Types (Apartments, PGs, Villas, Commercial, Plots)
    if (query.includes('pg') || query.includes('paying guest') || query.includes('co-living') || query.includes('coliving') || query.includes('पीजी')) {
        filters.propertyCategory = 'pg_accommodation';
        filters.propertyType = 'pg_coliving';
        extractedKeywords.push('PG Accommodation');
    }
    else if (query.includes('hostel') || query.includes('छात्रावास')) {
        filters.propertyCategory = 'hostel';
        filters.propertyType = 'pg_coliving';
        extractedKeywords.push('Hostel');
    }
    else if (query.includes('shared room') || query.includes('flatmate') || query.includes('roommate') || query.includes('sharing')) {
        filters.propertyCategory = 'shared_room';
        filters.propertyType = 'studio';
        extractedKeywords.push('Shared Room');
    }
    else if (query.includes('builder floor') || query.includes('independent floor') || query.includes('फ्लोर')) {
        filters.propertyCategory = 'builder_floor';
        filters.propertyType = 'independent_house';
        extractedKeywords.push('Builder Floor');
    }
    else if (query.includes('villa') || query.includes('विल्ला')) {
        filters.propertyCategory = 'villa';
        filters.propertyType = 'villa';
        extractedKeywords.push('Villa');
    }
    else if (query.includes('independent house') || query.includes('kothi') || query.includes('house') || query.includes('कोठी') || query.includes('मकान')) {
        filters.propertyCategory = 'independent_house';
        filters.propertyType = 'independent_house';
        extractedKeywords.push('Independent House');
    }
    else if (query.includes('commercial') || query.includes('shop') || query.includes('office') || query.includes('दुकान') || query.includes('ऑफिस')) {
        filters.propertyCategory = 'commercial';
        extractedKeywords.push('Commercial / Office');
    }
    else if (query.includes('plot') || query.includes('land') || query.includes('ज़मीन') || query.includes('प्लाट') || query.includes('प्लॉट')) {
        filters.propertyCategory = query.includes('agricultural') || query.includes('farm') || query.includes('कृषि') ? 'agricultural_land' : 'residential_plot';
        extractedKeywords.push(filters.propertyCategory === 'agricultural_land' ? 'Agricultural Land' : 'Residential Plot');
    }
    // 6. Detect Bedrooms (BHK)
    if (query.includes('1 bhk') || query.includes('1bhk') || query.includes('1 बीएचके') || query.includes('1 bedroom') || query.includes('1 bed') || query.includes('single room') || query.includes('ek kamra') || query.includes('एक कमरा')) {
        filters.bedrooms = 1;
        filters.propertyType = '1bhk';
        extractedKeywords.push('1 BHK');
    }
    else if (query.includes('2 bhk') || query.includes('2bhk') || query.includes('2 बीएचके') || query.includes('2 bedroom') || query.includes('2 bed') || query.includes('do kamre') || query.includes('दो कमरे')) {
        filters.bedrooms = 2;
        filters.propertyType = '2bhk';
        extractedKeywords.push('2 BHK');
    }
    else if (query.includes('3 bhk') || query.includes('3bhk') || query.includes('3 बीएचके') || query.includes('3 bedroom') || query.includes('3 bed') || query.includes('teen kamre') || query.includes('तीन कमरे')) {
        filters.bedrooms = 3;
        filters.propertyType = '3bhk';
        extractedKeywords.push('3 BHK');
    }
    else if (query.includes('4 bhk') || query.includes('4bhk') || query.includes('4 बीएचके') || query.includes('4 bedroom') || query.includes('4+ bhk') || query.includes('char kamre')) {
        filters.bedrooms = 4;
        filters.propertyType = '4bhk_plus';
        extractedKeywords.push('4+ BHK');
    }
    else if (query.includes('studio') || query.includes('1 rk') || query.includes('1rk')) {
        filters.propertyType = 'studio';
        filters.bedrooms = 1;
        extractedKeywords.push('Studio / 1 RK');
    }
    // 7. Detect Transaction Type & Tenure (Rent, Buy, Short-Term, Long-Term)
    if (query.includes('buy') || query.includes('purchase') || query.includes('khareed') || query.includes('for sale') || query.includes('selling') || query.includes('खरीदना') || query.includes('खरीद')) {
        filters.transactionType = 'buy';
        filters.tenure = 'buy';
        extractedKeywords.push('Purchase / Buy');
    }
    else if (query.includes('short term') || query.includes('1 month') || query.includes('temporary stay') || query.includes('weekly')) {
        filters.transactionType = 'rent';
        filters.tenure = 'short_term';
        extractedKeywords.push('Short-term Rent');
    }
    else if (query.includes('rent') || query.includes('lease') || query.includes('kiraya') || query.includes('किराया') || query.includes('किराये')) {
        filters.transactionType = 'rent';
        filters.tenure = 'long_term';
        extractedKeywords.push('Rent');
    }
    // 8. Detect Budget / Price (Supports Lakhs, Crores, Thousands, and ranges)
    // Check Crores (e.g. "1.5 Cr", "2 crore")
    const crMatch = query.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:cr|crore|करोड़)/i);
    if (crMatch) {
        const val = parseFloat(crMatch[1]) * 10000000;
        if (filters.transactionType === 'buy') {
            filters.maxBudget = val;
        }
        else {
            filters.maxRent = val;
        }
        extractedKeywords.push(`Max ₹${(val / 10000000).toFixed(1)} Cr`);
    }
    else {
        // Check Lakhs (e.g. "25 lakh", "50 L", "₹25 लाख")
        const lakhMatch = query.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:lakh|lac|लाख|l)\b/i);
        if (lakhMatch) {
            const val = parseFloat(lakhMatch[1]) * 100000;
            if (filters.transactionType === 'buy') {
                filters.maxBudget = val;
            }
            else {
                filters.maxRent = val;
            }
            extractedKeywords.push(`Max ₹${(val / 100000).toFixed(1)} Lakh`);
        }
        else {
            // Monthly Rent / Thousands check
            const hindiPreNumMatch = query.match(/([0-9]{4,6})\s*(?:के\s*अंदर|से\s*कम|तक|रुपये|रूपए)/i);
            const underBudgetMatch = query.match(/(?:under|below|upto|up to|max|maximum|less than|budget|se kam|kam)\s*(?:₹|rs\.?|inr)?\s*([0-9]{1,2}(?:,[0-9]{3})+|[0-9]+)\s*(?:k|thousand|हजार)?/i);
            if (hindiPreNumMatch) {
                const num = parseInt(hindiPreNumMatch[1], 10);
                if (!isNaN(num) && num >= 1000) {
                    filters.maxRent = num;
                    extractedKeywords.push(`Max ₹${num.toLocaleString('en-IN')}`);
                }
            }
            else if (underBudgetMatch) {
                const rawAmount = underBudgetMatch[1].replace(/,/g, '');
                let num = parseInt(rawAmount, 10);
                if (query.match(new RegExp(underBudgetMatch[1] + '\\s*k\\b', 'i')) && num < 1000) {
                    num = num * 1000;
                }
                if (!isNaN(num) && num >= 1000) {
                    filters.maxRent = num;
                    extractedKeywords.push(`Max ₹${num.toLocaleString('en-IN')}`);
                }
            }
            else {
                const kMatch = query.match(/\b([0-9]{1,3})\s*k\b/i);
                if (kMatch) {
                    const num = parseInt(kMatch[1], 10) * 1000;
                    if (num >= 2000 && num <= 500000) {
                        filters.maxRent = num;
                        extractedKeywords.push(`Max ₹${num.toLocaleString('en-IN')}`);
                    }
                }
                else {
                    const numMatch = query.match(/(?:₹|rs\.?|inr)\s*([0-9]{4,6})/i);
                    if (numMatch) {
                        const num = parseInt(numMatch[1], 10);
                        if (num >= 2000 && num <= 500000) {
                            filters.maxRent = num;
                            extractedKeywords.push(`Max ₹${num.toLocaleString('en-IN')}`);
                        }
                    }
                }
            }
        }
    }
    // 9. Detect Furnishing
    if (query.includes('fully furnished') || query.includes('full furnished') || query.includes('well furnished') || query.includes('सुसज्जित') || (query.includes('furnished') && !query.includes('unfurnished') && !query.includes('semi'))) {
        filters.furnishing = 'fully_furnished';
        extractedKeywords.push('Fully Furnished');
    }
    else if (query.includes('semi furnished') || query.includes('semi-furnished') || query.includes('अर्ध-सुसज्जित')) {
        filters.furnishing = 'semi_furnished';
        extractedKeywords.push('Semi-Furnished');
    }
    else if (query.includes('unfurnished') || query.includes('bina furniture') || query.includes('गैर-सुसज्जित')) {
        filters.furnishing = 'unfurnished';
        extractedKeywords.push('Unfurnished');
    }
    // 10. Detect Tenant Preference (Family, Bachelor, Students)
    if (query.includes('family') || query.includes('परिवार')) {
        filters.familyOrBachelor = 'family';
        extractedKeywords.push('Family');
    }
    else if (query.includes('bachelor') || query.includes('single') || query.includes('बैचलर')) {
        filters.familyOrBachelor = 'bachelors';
        extractedKeywords.push('Bachelors');
    }
    else if (query.includes('student') || query.includes('छात्र') || query.includes('college')) {
        filters.familyOrBachelor = 'students';
        extractedKeywords.push('Students');
    }
    // 11. Detect Amenities (Parking, Security, Pet)
    if (query.includes('parking') || query.includes('गाड़ी') || query.includes('पार्किंग')) {
        filters.parkingRequired = true;
        extractedKeywords.push('Parking Required');
    }
    if (query.includes('security') || query.includes('cctv') || query.includes('guard') || query.includes('सुरक्षा')) {
        filters.securityRequired = true;
        extractedKeywords.push('Gated Security');
    }
    if (query.includes('pet') || query.includes('dog') || query.includes('cat') || query.includes('पालतू')) {
        filters.petFriendly = true;
        extractedKeywords.push('Pet Friendly');
    }
    // Default onlyVerified to true to uphold integrity
    filters.onlyVerified = true;
    // Determine if this is a follow-up modification
    const isFollowUpQuery = Boolean(previousFilters && Object.keys(previousFilters).length > 0 &&
        (query.startsWith('show only') || query.startsWith('only') || query.startsWith('what about') ||
            query.includes('instead') || query.includes('also with') || query.includes('increase budget') ||
            (!locationDetectedInCurrentQuery && (filters.furnishing || filters.parkingRequired || filters.propertyCategory))));
    if (isFollowUpQuery) {
        isFollowUp = true;
    }
    // Statutory Guidance takes priority if user asks legal/statutory question without specific search
    const isExplicitPropertySearch = (query.includes('find') || query.includes('search') || query.includes('looking for') ||
        query.includes('खोज') || query.includes('dhundh') || query.includes('chahiye') ||
        query.includes('what can i') || query.includes('budget of') || query.includes('options in') ||
        filters.maxBudget !== undefined || filters.maxRent !== undefined) && (filters.bedrooms !== undefined || filters.city !== undefined || filters.locality !== undefined || filters.state !== undefined);
    if (matchedGuidance && !isExplicitPropertySearch && !isFollowUpQuery) {
        return {
            intent: matchedGuidance.id === 'fraud_prevention' ? 'fraud_safety' :
                matchedGuidance.id === 'verification_process' ? 'verification_info' :
                    matchedGuidance.id === 'purchase_advisory' ? 'buying_guidance' : 'renting_guidance',
            filters,
            extractedKeywords,
            isMissingCriticalInfo: false,
            missingParameters: [],
            comparisonPropertyIds: [],
            matchedGuidanceTopic: matchedGuidance,
            isFollowUp: false,
        };
    }
    // Check Property Search Intent
    const hasPropertySearchWords = query.includes('find') || query.includes('search') || query.includes('flat') || query.includes('फ्लैट') ||
        query.includes('apartment') || query.includes('house') || query.includes('bhk') || query.includes('बीएचके') || query.includes('rent') ||
        query.includes('किराया') || query.includes('किराये') || query.includes('room') || query.includes('कमरा') || query.includes('ghar') ||
        query.includes('घर') || query.includes('makan') || query.includes('मकान') || query.includes('kothi') || query.includes('कोठी') ||
        query.includes('pg') || query.includes('hostel') || query.includes('plot') || query.includes('buy') || query.includes('purchase') ||
        query.includes('property') || query.includes('संपत्ति') || query.includes('listing') || query.includes('looking for') || query.includes('चाहिए') || query.includes('खोज') || isFollowUpQuery;
    if (hasPropertySearchWords) {
        if (!filters.state && !filters.city && !filters.locality) {
            missingParameters.push('location');
        }
        if (!filters.maxRent && !filters.maxBudget) {
            missingParameters.push('budget');
        }
        const isMissingCritical = missingParameters.includes('location') && !isFollowUpQuery;
        return {
            intent: isMissingCritical ? 'missing_info_followup' : 'property_search',
            filters,
            extractedKeywords,
            isMissingCriticalInfo: isMissingCritical,
            missingParameters,
            comparisonPropertyIds: [],
            matchedGuidanceTopic: matchedGuidance,
            isFollowUp,
        };
    }
    if (matchedGuidance) {
        return {
            intent: matchedGuidance.id === 'fraud_prevention' ? 'fraud_safety' :
                matchedGuidance.id === 'verification_process' ? 'verification_info' : 'renting_guidance',
            filters,
            extractedKeywords,
            isMissingCriticalInfo: false,
            missingParameters: [],
            comparisonPropertyIds: [],
            matchedGuidanceTopic: matchedGuidance,
            isFollowUp: false,
        };
    }
    return {
        intent: 'general_query',
        filters,
        extractedKeywords,
        isMissingCriticalInfo: false,
        missingParameters: [],
        comparisonPropertyIds: [],
        matchedGuidanceTopic: undefined,
        isFollowUp: false,
    };
}
export const DEFAULT_SCORING_WEIGHTS = {
    budget: 0.25,
    location: 0.25,
    config: 0.15,
    amenities: 0.15,
    verification: 0.10,
    freshness: 0.10,
};
export function calculateRecommendationScore(property, filters, weights = DEFAULT_SCORING_WEIGHTS) {
    const matchHighlights = [];
    const tradeOffs = [];
    const missingDetails = [];
    // 1. Budget Score (0-100)
    let budgetScore = 85;
    const targetBudget = filters.maxRent || filters.maxBudget;
    const actualPrice = property.rentPerMonth || property.salePrice || 0;
    if (targetBudget && targetBudget > 0) {
        if (actualPrice <= targetBudget) {
            const budgetSavingsRatio = (targetBudget - actualPrice) / targetBudget;
            budgetScore = Math.min(100, Math.round(90 + (budgetSavingsRatio * 10)));
            matchHighlights.push(`Monthly outlay ₹${actualPrice.toLocaleString('en-IN')} is within stated budget ₹${targetBudget.toLocaleString('en-IN')}`);
        }
        else {
            // Over budget
            const overRatio = (actualPrice - targetBudget) / targetBudget;
            budgetScore = Math.max(20, Math.round(80 - (overRatio * 100)));
            tradeOffs.push(`Rent ₹${actualPrice.toLocaleString('en-IN')} exceeds stated budget ceiling by ₹${(actualPrice - targetBudget).toLocaleString('en-IN')}`);
        }
    }
    // 2. Location Score (0-100)
    let locationScore = 70;
    if (filters.locality && property.locality.toLowerCase().includes(filters.locality.toLowerCase())) {
        locationScore = 100;
        matchHighlights.push(`Located directly in preferred locality: ${property.locality}`);
    }
    else if (filters.city && property.city.toLowerCase().includes(filters.city.toLowerCase())) {
        locationScore = 85;
        matchHighlights.push(`Located in target city: ${property.city}`);
    }
    else if (filters.state && property.state.toLowerCase() === filters.state.toLowerCase()) {
        locationScore = 70;
    }
    // 3. Configuration & Type Score (0-100)
    let configScore = 80;
    if (filters.bedrooms && property.bedrooms) {
        if (property.bedrooms === filters.bedrooms) {
            configScore = 100;
            matchHighlights.push(`Exact ${property.bedrooms} BHK configuration`);
        }
        else if (Math.abs(property.bedrooms - filters.bedrooms) === 1) {
            configScore = 75;
            tradeOffs.push(`Features ${property.bedrooms} BHK instead of exact ${filters.bedrooms} BHK requested`);
        }
        else {
            configScore = 50;
        }
    }
    if (filters.furnishing && filters.furnishing !== 'any') {
        if (property.furnishing === filters.furnishing) {
            matchHighlights.push(`Furnishing matches: ${property.furnishing.replace('_', ' ')}`);
        }
        else {
            tradeOffs.push(`Furnished as ${property.furnishing.replace('_', ' ')} rather than preferred ${filters.furnishing.replace('_', ' ')}`);
        }
    }
    // 4. Amenities Score (0-100)
    let amenitiesScore = 80;
    const amenitiesList = property.amenities || [];
    if (filters.parkingRequired) {
        const hasParking = amenitiesList.some(a => a.toLowerCase().includes('parking'));
        if (hasParking) {
            matchHighlights.push('Dedicated parking space verified');
        }
        else {
            amenitiesScore -= 20;
            tradeOffs.push('Parking not explicitly listed in property amenities');
        }
    }
    if (filters.securityRequired) {
        const hasSecurity = amenitiesList.some(a => a.toLowerCase().includes('security') || a.toLowerCase().includes('cctv') || a.toLowerCase().includes('guard'));
        if (hasSecurity) {
            matchHighlights.push('24x7 security / CCTV confirmed');
        }
        else {
            amenitiesScore -= 15;
            tradeOffs.push('Gated security not confirmed');
        }
    }
    if (amenitiesList.length === 0) {
        missingDetails.push('Specific amenities list was not provided by owner');
    }
    // 5. Verification & Reliability Score (0-100)
    // Invariant: Never rank unverified property above verified solely for price
    let verificationScore = 30;
    if (property.verificationStatus === 'authoritative_verified') {
        verificationScore = 100;
        matchHighlights.push('Passed 100% authoritative land registry title audit & physical inspection');
    }
    else if (property.verificationStatus === 'physically_inspected') {
        verificationScore = 85;
        matchHighlights.push('Physical on-site inspection completed');
    }
    else if (property.verificationStatus === 'document_verified') {
        verificationScore = 70;
    }
    else {
        verificationScore = 20;
        tradeOffs.push('Listing has not yet completed authoritative verification');
    }
    // 6. Freshness Score (0-100)
    const isFresh = property.availabilityConfirmedAt
        ? (Date.now() - new Date(property.availabilityConfirmedAt).getTime()) <= (FRESHNESS_POLICY_DAYS * 24 * 60 * 60 * 1000)
        : true;
    const freshnessScore = isFresh ? 100 : 40;
    if (!isFresh) {
        tradeOffs.push('Awaiting 60-day owner availability reconfirmation');
    }
    // Detect Missing Information
    if (!property.areaSqFt && !property.carpetAreaSqFt) {
        missingDetails.push('Carpet area not declared by owner');
    }
    if (!property.securityDeposit) {
        missingDetails.push('Exact security deposit figure not declared; estimated per Model Tenancy Act');
    }
    // Overall Weighted Score
    let overallScore = Math.round((budgetScore * weights.budget) +
        (locationScore * weights.location) +
        (configScore * weights.config) +
        (amenitiesScore * weights.amenities) +
        (verificationScore * weights.verification) +
        (freshnessScore * weights.freshness));
    // Invariant enforcement: Unverified properties are capped at max 60 overall score
    if (property.verificationStatus !== 'authoritative_verified' && property.verificationStatus !== 'physically_inspected') {
        overallScore = Math.min(60, overallScore);
    }
    return {
        overallScore,
        budgetScore,
        locationScore,
        configScore,
        amenitiesScore,
        verificationScore,
        freshnessScore,
        weightsUsed: {
            budget: weights.budget * 100,
            location: weights.location * 100,
            config: weights.config * 100,
            amenities: weights.amenities * 100,
            verification: weights.verification * 100,
            freshness: weights.freshness * 100,
        },
        matchHighlights,
        tradeOffs,
        missingDetails,
    };
}
export function executePropertySearch(filters, language = 'en') {
    const allProperties = Array.from(db.properties.values());
    // Strict Public Publication Gate:
    // Must be 'approved' submission status and 'authoritative_verified'.
    // Drafts, pending review, withdrawn, or suspended NEVER leak into Saathi AI results.
    let validCandidates = allProperties.filter((p) => p.submissionStatus === 'approved' && p.verificationStatus === 'authoritative_verified');
    // Apply State filter
    if (filters.state && filters.state !== 'all') {
        validCandidates = validCandidates.filter((p) => p.state.toLowerCase() === filters.state.toLowerCase());
    }
    // Apply City filter
    if (filters.city && filters.city.trim().length > 0) {
        const cleanCity = filters.city.toLowerCase().trim();
        validCandidates = validCandidates.filter((p) => p.city.toLowerCase().includes(cleanCity));
    }
    // Apply Locality filter
    if (filters.locality && filters.locality.trim().length > 0) {
        const cleanLoc = filters.locality.toLowerCase().trim();
        validCandidates = validCandidates.filter((p) => p.locality.toLowerCase().includes(cleanLoc));
    }
    // Apply Bedrooms filter
    if (filters.bedrooms !== undefined && filters.bedrooms > 0) {
        validCandidates = validCandidates.filter((p) => p.bedrooms === filters.bedrooms);
    }
    else if (filters.propertyType && filters.propertyType !== 'all') {
        validCandidates = validCandidates.filter((p) => p.propertyType === filters.propertyType);
    }
    // Apply Max Rent / Budget filter
    if (filters.maxRent !== undefined && filters.maxRent > 0) {
        validCandidates = validCandidates.filter((p) => p.rentPerMonth <= filters.maxRent);
    }
    else if (filters.maxBudget !== undefined && filters.maxBudget > 0) {
        validCandidates = validCandidates.filter((p) => (p.salePrice || p.rentPerMonth) <= filters.maxBudget);
    }
    // Apply Furnishing filter
    if (filters.furnishing && filters.furnishing !== 'any') {
        validCandidates = validCandidates.filter((p) => p.furnishing === filters.furnishing);
    }
    // Score and Rank Candidates using Transparent Weighted Recommendation Engine
    const scoredCandidates = validCandidates.map(p => ({
        property: p,
        score: calculateRecommendationScore(p, filters),
    }));
    // Sort descending by recommendation overallScore
    scoredCandidates.sort((a, b) => b.score.overallScore - a.score.overallScore);
    // Format into SaathiPropertyCards with objective facts and recommendation rationale
    const cards = scoredCandidates.map(({ property: p, score }) => {
        const isFresh = p.availabilityConfirmedAt
            ? (Date.now() - new Date(p.availabilityConfirmedAt).getTime()) <= (FRESHNESS_POLICY_DAYS * 24 * 60 * 60 * 1000)
            : true;
        const rationaleParts = score.matchHighlights.length > 0
            ? score.matchHighlights.join('; ')
            : `${p.bedrooms || 1} BHK in ${p.locality}, ${p.city} at ₹${p.rentPerMonth.toLocaleString('en-IN')}/mo`;
        const matchRationale = language === 'hi'
            ? `सिफारिश स्कोर: ${score.overallScore}%। मुख्य विशेषताएं: ${rationaleParts}।`
            : language === 'hi-en'
                ? `Recommendation Score: ${score.overallScore}%. Highlights: ${rationaleParts}.`
                : `Match Score: ${score.overallScore}% (Budget: ${score.budgetScore}%, Location: ${score.locationScore}%). Key highlights: ${rationaleParts}.`;
        const objectiveFacts = [
            `Rent: ₹${p.rentPerMonth.toLocaleString('en-IN')}/month (Security deposit: ₹${(p.securityDeposit || p.rentPerMonth * 2).toLocaleString('en-IN')})`,
            `Specification: ${p.bedrooms} BHK • ${p.bathrooms || 1} Bath • ${p.areaSqFt ? `${p.areaSqFt} sq.ft` : 'Area not declared'}`,
            `Furnishing: ${p.furnishing.replace('_', ' ').toUpperCase()}`,
            `Authority Audit: Title verified against ${TARGET_REGIONS[p.state]?.registrySystem || 'State Revenue Registry'}`,
            `Availability: ${isFresh ? 'Confirmed Live (Past 60 Days)' : 'Awaiting 60-day owner reconfirmation'}`,
        ];
        if (score.tradeOffs.length > 0) {
            objectiveFacts.push(`Important Considerations: ${score.tradeOffs.join('; ')}`);
        }
        return {
            id: p.id,
            title: p.title,
            propertyType: p.propertyType,
            transactionType: 'rent',
            city: p.city,
            locality: p.locality,
            state: p.state,
            rentPerMonth: p.rentPerMonth,
            securityDeposit: p.securityDeposit,
            maintenanceCharges: p.maintenanceCharges,
            bedrooms: p.bedrooms ?? 1,
            bathrooms: p.bathrooms,
            areaSqFt: p.areaSqFt,
            carpetAreaSqFt: p.carpetAreaSqFt,
            furnishing: p.furnishing,
            verificationStatus: p.verificationStatus,
            isFresh,
            availableFrom: p.availableFrom,
            primaryPhotoUrl: p.photos && p.photos.length > 0 ? p.photos[0] : undefined,
            matchRationale,
            objectiveFacts,
            ownerMaskedContact: p.ownerMaskedContact || 'Masked per DPDP Act',
            recommendationScore: score,
        };
    });
    // Handle Zero-Results vs Matches
    let explanation = '';
    const relaxationSuggestions = [];
    const suggestedActions = [];
    if (cards.length > 0) {
        explanation = language === 'hi'
            ? `सत्यापित डेटाबेस में आपकी खोज के अनुसार ${cards.length} वास्तविक संपत्तियां मिली हैं। प्रत्येक लिस्टिंग का राजस्व रिकॉर्ड और भौतिक सत्यापन किया जा चुका है:`
            : language === 'hi-en'
                ? `Authoritative database mein aapki query ke mutabiq ${cards.length} verified listings match hui hain. All listings carry genuine registry audit proof:`
                : `Found ${cards.length} authentic, authoritatively verified listing${cards.length === 1 ? '' : 's'} ranked by recommendation score:`;
        // Suggest comparison if >= 2
        if (cards.length >= 2) {
            suggestedActions.push({
                id: `act_compare_${Date.now()}`,
                type: 'compare_properties',
                label: language === 'hi' ? 'इन संपत्तियों की तुलना करें' : 'Compare Matching Properties',
                payload: { propertyIds: cards.slice(0, 3).map(c => c.id) },
                requiresConfirmation: false,
            });
        }
        // Add search action suggestions
        suggestedActions.push({
            id: `act_apply_search_${Date.now()}`,
            type: 'apply_search_filters',
            label: language === 'hi' ? 'मुख्य खोज में फ़िल्टर देखें' : 'View in Main Property Search',
            payload: { ...filters },
            requiresConfirmation: false,
        });
    }
    else {
        // Honest Zero-Result explanation
        const filterDesc = [
            filters.bedrooms ? `${filters.bedrooms} BHK` : '',
            filters.city || filters.locality || filters.state || '',
            filters.maxRent ? `under ₹${filters.maxRent.toLocaleString('en-IN')}` : '',
        ].filter(Boolean).join(' in ');
        explanation = language === 'hi'
            ? `वर्तमान डेटाबेस में "${filterDesc || 'आपकी खोज'}" के लिए कोई सत्यापित संपत्ति उपलब्ध नहीं है। गृह साथी कभी भी कृत्रिम (डमी) लिस्टिंग नहीं दिखाता।`
            : language === 'hi-en'
                ? `Current database mein "${filterDesc || 'aapki search'}" ke liye koi verified property available nahi hai. Griha Saathi strict data integrity policy follow karta hai.`
                : `No verified properties currently match "${filterDesc || 'your query'}" in our live database. Griha Saathi never fabricates synthetic listings.`;
        // Calculate relaxation suggestions based on actual properties in the same state or city
        const stateProps = allProperties.filter(p => p.submissionStatus === 'approved' && (!filters.state || p.state === filters.state));
        if (stateProps.length > 0) {
            const minAvailableRent = Math.min(...stateProps.map(p => p.rentPerMonth));
            if (filters.maxRent && filters.maxRent < minAvailableRent) {
                relaxationSuggestions.push(language === 'hi'
                    ? `बजट को कम से कम ₹${minAvailableRent.toLocaleString('en-IN')} तक बढ़ाएं (इस क्षेत्र में सत्यापित किराये इस मूल्य से शुरू होते हैं)।`
                    : `Increase budget to at least ₹${minAvailableRent.toLocaleString('en-IN')}/mo (verified listings in this region currently start here).`);
            }
            relaxationSuggestions.push(language === 'hi'
                ? `विशिष्ट सेक्टर/इलाके की सीमा हटाकर पूरे जिले या शहर में खोजें।`
                : `Widen your locality filter to search across the entire district or neighbouring sectors.`);
        }
        else {
            relaxationSuggestions.push(language === 'hi'
                ? `अन्य लक्षित क्षेत्रों (दिल्ली, हरियाणा, पंजाब, हिमाचल, जम्मू-कश्मीर) में खोजें।`
                : `Explore properties across our other target territories: Delhi, Haryana, Punjab, HP, or J&K.`);
        }
    }
    return {
        properties: cards,
        totalMatches: cards.length,
        explanation,
        relaxationSuggestions,
        suggestedActions,
        disclaimer: 'Griha Saathi objective audit completed. No legal guarantee or absolute safety warranty implied. Always inspect premises before signing.',
    };
}
// ==============================================================================
// 5. DEEP PROPERTY COMPARISON INTELLIGENCE
// ==============================================================================
export function generatePropertyComparison(propertyIds) {
    if (!propertyIds || propertyIds.length === 0)
        return [];
    const comparisonItems = [];
    for (const id of propertyIds.slice(0, 4)) {
        const p = db.properties.get(id);
        if (!p)
            continue;
        comparisonItems.push({
            propertyId: p.id,
            title: p.title || 'Not provided',
            rentOrPrice: `₹${p.rentPerMonth.toLocaleString('en-IN')}/month`,
            propertyType: p.propertyType ? p.propertyType.replace('_', ' ').toUpperCase() : 'Not provided',
            area: p.areaSqFt ? `${p.areaSqFt} sq.ft` : 'Not provided',
            bedrooms: p.bedrooms !== undefined ? `${p.bedrooms} BHK` : 'Not provided',
            bathrooms: p.bathrooms !== undefined ? `${p.bathrooms}` : 'Not provided',
            furnishing: p.furnishing ? p.furnishing.replace('_', ' ') : 'Not provided',
            amenities: p.amenities && p.amenities.length > 0 ? p.amenities : ['Not provided'],
            location: `${p.locality || 'Not provided'}, ${p.city || 'Not provided'}, ${p.state || 'Not provided'}`,
            availability: p.availableFrom ? `From ${p.availableFrom}` : 'Not provided',
            verificationStatus: p.verificationStatus ? p.verificationStatus.replace('_', ' ').toUpperCase() : 'Not provided',
            lastUpdated: p.availabilityConfirmedAt ? new Date(p.availabilityConfirmedAt).toLocaleDateString() : p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'Not provided',
            securityDeposit: p.securityDeposit ? `₹${p.securityDeposit.toLocaleString('en-IN')}` : 'Not provided',
            maintenanceCharges: p.maintenanceCharges ? `₹${p.maintenanceCharges.toLocaleString('en-IN')}/mo` : 'Included / Not provided',
        });
    }
    return comparisonItems;
}
export function generateComprehensiveComparison(propertyIds) {
    const items = generatePropertyComparison(propertyIds);
    if (items.length === 0) {
        return {
            items: [],
            keyDisadvantages: {},
            missingInformation: {},
            questionsForOwner: [],
        };
    }
    const validProps = propertyIds.map(id => db.properties.get(id)).filter(Boolean);
    // Find Strongest Match (Highest verification score & area)
    const strongest = validProps.reduce((best, cur) => {
        const bestScore = (best.areaSqFt || 0) + (best.verificationStatus === 'authoritative_verified' ? 1000 : 0);
        const curScore = (cur.areaSqFt || 0) + (cur.verificationStatus === 'authoritative_verified' ? 1000 : 0);
        return curScore > bestScore ? cur : best;
    }, validProps[0]);
    // Find Best Budget Fit (Lowest monthly outlay)
    const cheapest = validProps.reduce((best, cur) => cur.rentPerMonth < best.rentPerMonth ? cur : best, validProps[0]);
    const keyDisadvantages = {};
    const missingInformation = {};
    for (const p of validProps) {
        keyDisadvantages[p.id] = [];
        missingInformation[p.id] = [];
        if (p.securityDeposit && p.securityDeposit > p.rentPerMonth * 2) {
            keyDisadvantages[p.id].push(`Deposit of ₹${p.securityDeposit.toLocaleString('en-IN')} exceeds standard 2 months statutory cap`);
        }
        if (p.maintenanceCharges && p.maintenanceCharges > 0) {
            keyDisadvantages[p.id].push(`Requires additional ₹${p.maintenanceCharges.toLocaleString('en-IN')}/month maintenance charges`);
        }
        if (!p.areaSqFt) {
            missingInformation[p.id].push('Carpet area not declared by owner');
        }
        if (!p.amenities || p.amenities.length === 0) {
            missingInformation[p.id].push('Specific amenities list not declared');
        }
        if (!p.availableFrom) {
            missingInformation[p.id].push('Exact move-in availability date unconfirmed');
        }
    }
    const questionsForOwner = [
        'Are electricity and water charges billed individually via government meters or sub-metered?',
        'Is the security deposit fully refundable via RTGS/NEFT within 30 days of lease vacating?',
        'Does the society charge any move-in or elevator shifting fees to incoming tenants?',
        'Are two-wheeler and four-wheeler parking spots dedicated and covered?',
    ];
    return {
        items,
        strongestMatch: strongest ? {
            propertyId: strongest.id,
            title: strongest.title,
            reason: `Superior authoritative verification status, verified title deed, and balanced space-to-cost ratio.`,
        } : undefined,
        bestBudgetFit: cheapest ? {
            propertyId: cheapest.id,
            title: cheapest.title,
            rentOrPrice: `₹${cheapest.rentPerMonth.toLocaleString('en-IN')}/month`,
            reason: `Lowest monthly outlay among compared options, saving ₹${(strongest.rentPerMonth - cheapest.rentPerMonth).toLocaleString('en-IN')}/month.`,
        } : undefined,
        bestLocationFit: validProps[0] ? {
            propertyId: validProps[0].id,
            title: validProps[0].title,
            location: `${validProps[0].locality}, ${validProps[0].city}`,
            reason: `Situated directly in requested primary locality hub.`,
        } : undefined,
        keyDisadvantages,
        missingInformation,
        questionsForOwner,
    };
}
// ==============================================================================
// 6. TRUST & FRAUD RISK ANALYSIS ENGINE
// ==============================================================================
export function analyzeFraudRisk(queryText, property) {
    const query = queryText.toLowerCase();
    const findings = [];
    // Finding 1: UPI advance / token money before viewing
    if (query.includes('advance') || query.includes('token') || query.includes('upi') || query.includes('transfer')) {
        findings.push({
            code: 'ADVANCE_PAYMENT_SCAM',
            type: 'confirmed_issue',
            severity: 'high',
            title: 'Advance Payment Before Physical Inspection Demanded',
            description: 'Transferring token money or advance via UPI before physically inspecting the premises and verifying property title is the #1 cyber-fraud pattern in Indian rentals. Never transfer money to unlock a viewing.',
        });
    }
    // Finding 2: Fake Gate Pass / Visiting Card Fee
    if (query.includes('gate pass') || query.includes('visiting card') || query.includes('entry fee') || query.includes('pass fee')) {
        findings.push({
            code: 'GATE_PASS_EXTORTION',
            type: 'confirmed_issue',
            severity: 'high',
            title: 'Fabricated "Gate Pass" or "Visiting Fee" Request',
            description: 'Demanding fees for visiting passes, visitor ID generation, or entry permits is a confirmed fraudulent tactic. Legitimate owners and societies never charge viewing fees.',
        });
    }
    // Finding 3: Military / Defense / NRI Impersonation Tropes
    if (query.includes('army') || query.includes('officer') || query.includes('cisf') || query.includes('air force') || query.includes('nri') || query.includes('transfer')) {
        findings.push({
            code: 'IMPERSONATION_TROPE',
            type: 'potential_warning_sign',
            severity: 'high',
            title: 'Impersonation of Armed Forces / NRI Landlord',
            description: 'Fraudsters frequently impersonate military officers or NRI owners stationed remotely to explain why they cannot meet in person and require digital deposits. Insist on authorized in-person representation.',
        });
    }
    // Finding 4: Price Suspiciously Below Regional Median
    if (property) {
        const regionData = TARGET_REGIONS[property.state];
        if (regionData && property.rentPerMonth < regionData.medianRent2BHK * 0.45) {
            findings.push({
                code: 'UNUSUALLY_LOW_PRICE',
                type: 'potential_warning_sign',
                severity: 'medium',
                title: 'Rent Substantially Below Regional Market Median',
                description: `Rent of ₹${property.rentPerMonth.toLocaleString('en-IN')} is >55% below the regional median (₹${regionData.medianRent2BHK.toLocaleString('en-IN')}). Extremely low prices are often used as clickbait for advance payment scams.`,
            });
        }
    }
    // Finding 5: Insufficient Verification Information
    if (!property || property.verificationStatus !== 'authoritative_verified') {
        findings.push({
            code: 'UNVERIFIED_STATUS',
            type: 'insufficient_information',
            severity: 'medium',
            title: 'Title Deed & Land Registry Audit Pending',
            description: 'This listing has not completed 100% authoritative land registry title audit. Verification of ownership documents is recommended before signing.',
        });
    }
    const overallRiskLevel = findings.some(f => f.severity === 'high') ? 'high' :
        findings.some(f => f.severity === 'medium') ? 'medium' : 'low';
    const verificationChecklist = [
        'Always conduct a physical walk-through before transferring any money.',
        'Check that the landlord name matches the state revenue registry (Jamabandi / DORIS / PLRS / Himbhoomi / Aapki Zameen).',
        'Ensure residential security deposits do not exceed the statutory 2-month rent cap under Model Tenancy Act 2021.',
        'Demand a registered rent agreement with documented lock-in and notice period clauses.',
    ];
    const safeNextSteps = [
        'Schedule a verified viewing using Griha Saathi\'s built-in Visit Scheduler.',
        'If pressured for immediate UPI advance, use the "Report Fraud" button to initiate reviewer audit.',
        'Never share Aadhaar OTPs or bank UPI PINs during house inspections.',
    ];
    const summary = overallRiskLevel === 'high'
        ? 'Critical fraud risk indicators detected. Do not transfer funds or share financial credentials.'
        : overallRiskLevel === 'medium'
            ? 'Potential warning signs identified. Proceed with caution and verify ownership title deeds.'
            : 'No critical fraud patterns detected. Follow standard verification protocol before paying deposits.';
    return {
        overallRiskLevel,
        summary,
        findings,
        verificationChecklist,
        safeNextSteps,
    };
}
// ==============================================================================
// 7. QUALITY CONTROL & POST-GENERATION VALIDATION LAYER
// ==============================================================================
export function validateAiResponse(message) {
    // 1. Audit Property Cards against live database records
    if (message.properties && message.properties.length > 0) {
        const verifiedCards = [];
        for (const card of message.properties) {
            const realProp = db.properties.get(card.id);
            if (!realProp) {
                // Strip out hallucinated property ID!
                console.warn(`[Saathi AI Quality Control] Hallucinated property ID ${card.id} rejected.`);
                continue;
            }
            // Check price fidelity
            if (card.rentPerMonth !== realProp.rentPerMonth) {
                console.warn(`[Saathi AI Quality Control] Price discrepancy fixed on property ${card.id}.`);
                card.rentPerMonth = realProp.rentPerMonth;
            }
            // Check verification status fidelity
            if (card.verificationStatus !== realProp.verificationStatus) {
                card.verificationStatus = realProp.verificationStatus;
            }
            verifiedCards.push(card);
        }
        message.properties = verifiedCards;
    }
    // 2. Audit Comparison Table against real property records
    if (message.comparisonTable && message.comparisonTable.length > 0) {
        message.comparisonTable = message.comparisonTable.filter(item => db.properties.has(item.propertyId));
    }
    return message;
}
// ==============================================================================
// 8. USER FEEDBACK COLLECTION & AGGREGATION
// ==============================================================================
export function recordAiFeedback(submission) {
    const id = `fb_${crypto.randomUUID().slice(0, 10)}`;
    const feedback = {
        ...submission,
        id,
        createdAt: new Date().toISOString(),
    };
    db.aiFeedback.set(id, feedback);
    return feedback;
}
export function getAiFeedbackSummary() {
    const all = Array.from(db.aiFeedback.values());
    const helpfulCount = all.filter(f => f.rating === 'helpful').length;
    const notRelevantCount = all.filter(f => f.rating === 'not_relevant').length;
    const incorrectCount = all.filter(f => f.rating === 'incorrect_information').length;
    const outdatedCount = all.filter(f => f.rating === 'outdated_information').length;
    const missingInfoCount = all.filter(f => f.rating === 'missing_information').length;
    return {
        total: all.length,
        helpfulCount,
        notRelevantCount,
        incorrectCount,
        outdatedCount,
        missingInfoCount,
        helpfulPercentage: all.length > 0 ? Math.round((helpfulCount / all.length) * 100) : 100,
    };
}
// ==============================================================================
// 9. PROVIDER INTEGRATION & HONEST STATUS REPORTING
// ==============================================================================
export function getSaathiProviderStatus() {
    const apiKey = process.env.GEMINI_API_KEY;
    const isKeyConfigured = !!(apiKey && apiKey.trim().length > 0 && apiKey !== 'YOUR_GEMINI_API_KEY');
    if (isKeyConfigured) {
        return {
            provider: 'gemini',
            configured: true,
            apiKeyPresent: true,
            modelName: 'gemini-1.5-flash',
            statusMessage: 'Gemini AI Generative Engine Active',
            notice: 'External generative reasoning is active via Google Gemini API with authoritative tool-calling retrieval.',
        };
    }
    return {
        provider: 'deterministic_rules',
        configured: false,
        apiKeyPresent: false,
        statusMessage: 'Saathi Deterministic Rule-Based Parser Active',
        notice: 'GEMINI_API_KEY is not configured in .env. Saathi AI is running on its built-in deterministic query parser and real database retrieval engine. Zero synthetic properties or fabricated data are generated.',
    };
}
export async function processSaathiChat(options) {
    const { userQuery, language = 'en', authenticatedUserId, sessionId } = options;
    // Sanitize input
    const cleanInput = userQuery.trim().slice(0, 1000);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const status = getSaathiProviderStatus();
    // Retrieve existing session context if available
    const currentSessionId = sessionId || `sess_${crypto.randomUUID().slice(0, 8)}`;
    const sessionContext = db.aiSessions.get(currentSessionId);
    // 1. Parse query with context resolution
    const parsed = parseNaturalLanguageQuery(cleanInput, language, sessionContext);
    // Update session context
    db.aiSessions.set(currentSessionId, {
        sessionId: currentSessionId,
        lastFilters: parsed.filters,
        history: [
            ...(sessionContext?.history || []),
            { role: 'user', text: cleanInput, filters: parsed.filters },
        ],
    });
    // 2. Handle Fraud Risk Analysis Intent
    if (parsed.intent === 'fraud_safety' && parsed.fraudAnalysis) {
        const fa = parsed.fraudAnalysis;
        let fraudText = '';
        if (language === 'hi') {
            fraudText = `⚠️ **धोखाधड़ी जोखिम विश्लेषण**: ${fa.summary}\n\n` +
                `**पहचाने गए जोखिम बिंदु**:\n` +
                fa.findings.map(f => `• [${f.severity.toUpperCase()}] **${f.title}**: ${f.description}`).join('\n') +
                `\n\n**सुरक्षा चेकलिस्ट**:\n` +
                fa.verificationChecklist.map(c => `✓ ${c}`).join('\n');
        }
        else if (language === 'hi-en') {
            fraudText = `⚠️ **Fraud Risk Assessment**: ${fa.summary}\n\n` +
                `**Identified Warnings**:\n` +
                fa.findings.map(f => `• [${f.severity.toUpperCase()}] **${f.title}**: ${f.description}`).join('\n') +
                `\n\n**Safety Checklist**:\n` +
                fa.verificationChecklist.map(c => `✓ ${c}`).join('\n');
        }
        else {
            fraudText = `⚠️ **Trust & Fraud Advisory**: ${fa.summary}\n\n` +
                `**Key Risk Findings**:\n` +
                fa.findings.map(f => `• [${f.severity.toUpperCase()}] **${f.title}**: ${f.description}`).join('\n') +
                `\n\n**Verification Checklist Before Paying Any Deposit**:\n` +
                fa.verificationChecklist.map(c => `✓ ${c}`).join('\n');
        }
        const response = {
            id: `ai_${crypto.randomUUID().slice(0, 8)}`,
            sender: 'assistant',
            text: fraudText,
            timestamp: nowStr,
            intent: 'fraud_safety',
            fraudAnalysis: fa,
            providerInfo: status,
            sessionId: currentSessionId,
            disclaimerNote: 'Saathi AI risk analysis is educational and based on reported fraud patterns. Always physically inspect premises.',
        };
        return validateAiResponse(response);
    }
    // 3. Handle Missing Critical Information Follow-up
    if (parsed.intent === 'missing_info_followup') {
        let followUpText = '';
        if (language === 'hi') {
            followUpText = 'नमस्ते! वास्तविक सत्यापित संपत्तियों को खोजने के लिए, कृपया अपना पसंदीदा शहर या राज्य (जैसे जम्मू, गुरुग्राम, चंडीगढ़, शिमला, या दिल्ली) और अपना अधिकतम बजट बताएं?';
        }
        else if (language === 'hi-en') {
            followUpText = 'Namaste! Authentic verified listings search karne ke liye, kya aap apni preferred location (jaise Jammu, Gurugram, Chandigarh, Shimla, ya Delhi) aur monthly budget bata sakte hain?';
        }
        else {
            followUpText = 'To search our authoritative property database, which city or state (Delhi, Haryana, Punjab, Himachal Pradesh, or Jammu & Kashmir) are you looking in, and what is your target monthly budget?';
        }
        const response = {
            id: `ai_${crypto.randomUUID().slice(0, 8)}`,
            sender: 'assistant',
            text: followUpText,
            timestamp: nowStr,
            intent: 'missing_info_followup',
            followUpQuestion: followUpText,
            providerInfo: status,
            sessionId: currentSessionId,
            actions: [
                {
                    id: `act_jammu_${Date.now()}`,
                    type: 'apply_search_filters',
                    label: 'Jammu (Under ₹15,000)',
                    payload: { city: 'Jammu', state: 'Jammu & Kashmir', maxRent: 15000, propertyType: '2bhk' },
                    requiresConfirmation: false,
                },
                {
                    id: `act_gurugram_${Date.now()}`,
                    type: 'apply_search_filters',
                    label: 'Gurugram (Under ₹35,000)',
                    payload: { city: 'Gurugram', state: 'Haryana', maxRent: 35000, propertyType: '2bhk' },
                    requiresConfirmation: false,
                },
                {
                    id: `act_chandigarh_${Date.now()}`,
                    type: 'apply_search_filters',
                    label: 'Chandigarh (Under ₹25,000)',
                    payload: { city: 'Chandigarh', state: 'Punjab', maxRent: 25000, propertyType: '2bhk' },
                    requiresConfirmation: false,
                },
            ],
            disclaimerNote: 'Saathi AI queries genuine database records only. It will never synthesize fictional properties.',
        };
        return validateAiResponse(response);
    }
    // 4. Handle Property Comparison Intent
    if (parsed.intent === 'property_comparison') {
        let propIds = parsed.comparisonPropertyIds;
        if (propIds.length === 0) {
            const approvedProps = Array.from(db.properties.values())
                .filter(p => p.submissionStatus === 'approved' && p.verificationStatus === 'authoritative_verified')
                .slice(0, 2);
            propIds = approvedProps.map(p => p.id);
        }
        const comprehensiveComparison = generateComprehensiveComparison(propIds);
        let comparisonText = '';
        if (comprehensiveComparison.items.length < 2) {
            comparisonText = language === 'hi'
                ? 'तुलना के लिए डेटाबेस में कम से कम दो सत्यापित संपत्तियों की आवश्यकता है। कृपया खोज से संपत्तियों का चयन करें या प्रॉपर्टी आईडी दर्ज करें।'
                : language === 'hi-en'
                    ? 'Comparison ke liye at least 2 verified properties chahiye. Please search results se properties select karein.'
                    : 'Please specify at least two real properties to compare. You can select properties from search results or provide property IDs.';
        }
        else {
            comparisonText = language === 'hi'
                ? `यहाँ चुनी गई ${comprehensiveComparison.items.length} सत्यापित संपत्तियों की सीधी तुलना दी गई है। अनुपलब्ध फ़ील्ड को "उपलब्ध नहीं कराया गया" के रूप में दिखाया गया है:`
                : language === 'hi-en'
                    ? `Yahan selected ${comprehensiveComparison.items.length} verified properties ka side-by-side comparison diya gaya hai. Missing fields clearly "Not provided" marked hain:`
                    : `Here is a side-by-side comparison of the ${comprehensiveComparison.items.length} selected verified properties. Any missing record details are explicitly marked as "Not provided":`;
        }
        const response = {
            id: `ai_${crypto.randomUUID().slice(0, 8)}`,
            sender: 'assistant',
            text: comparisonText,
            timestamp: nowStr,
            intent: 'property_comparison',
            comparisonTable: comprehensiveComparison.items,
            comprehensiveComparison,
            providerInfo: status,
            sessionId: currentSessionId,
            disclaimerNote: 'Comparisons strictly reflect authoritative database records. No attributes are inferred or guessed.',
        };
        return validateAiResponse(response);
    }
    // 5. Handle Statutory & Advisory Guidance
    if (parsed.matchedGuidanceTopic) {
        const guidance = parsed.matchedGuidanceTopic;
        const langKey = language === 'hi' || language === 'hi-en' ? language : 'en';
        const guidanceText = guidance.content[langKey];
        const response = {
            id: `ai_${crypto.randomUUID().slice(0, 8)}`,
            sender: 'assistant',
            text: guidanceText,
            timestamp: nowStr,
            intent: parsed.intent,
            guidanceTopic: guidance.topic,
            relatedEntities: {
                verifiedPropertyCount: Array.from(db.properties.values()).filter(p => p.verificationStatus === 'authoritative_verified').length,
                legalReference: guidance.statutoryRef,
            },
            providerInfo: status,
            sessionId: currentSessionId,
            actions: [
                {
                    id: `act_search_verified_${Date.now()}`,
                    type: 'apply_search_filters',
                    label: language === 'hi' ? 'सत्यापित संपत्तियां खोजें' : 'Search Verified Properties',
                    payload: { onlyVerified: true },
                    requiresConfirmation: false,
                },
            ],
            disclaimerNote: 'Guidance is provided for educational and procedural clarity under statutory Indian tenancy frameworks and does not constitute guaranteed legal warranty.',
        };
        return validateAiResponse(response);
    }
    // 6. Handle Property Search Intent
    if (parsed.intent === 'property_search') {
        const searchResult = executePropertySearch(parsed.filters, language);
        let messageText = searchResult.explanation;
        if (parsed.isFollowUp) {
            messageText = (language === 'hi'
                ? `आपकी पिछली प्राथमिकताओं को ध्यान में रखते हुए अपडेटेड खोज परिणाम:\n\n`
                : language === 'hi-en'
                    ? `Retaining your earlier search location & budget, here are the updated results:\n\n`
                    : `Retaining your earlier location and budget preferences, here are the updated matching properties:\n\n`) + messageText;
        }
        if (searchResult.relaxationSuggestions.length > 0) {
            messageText += `\n\n${language === 'hi' ? 'सुझाए गए फ़िल्टर समायोजन:' : 'Suggested filter adjustments:'}\n` +
                searchResult.relaxationSuggestions.map(s => `• ${s}`).join('\n');
        }
        const response = {
            id: `ai_${crypto.randomUUID().slice(0, 8)}`,
            sender: 'assistant',
            text: messageText,
            timestamp: nowStr,
            intent: 'property_search',
            suggestedFilters: parsed.filters,
            properties: searchResult.properties,
            actions: searchResult.suggestedActions,
            providerInfo: status,
            sessionId: currentSessionId,
            relatedEntities: {
                verifiedPropertyCount: searchResult.totalMatches,
            },
            disclaimerNote: searchResult.disclaimer,
        };
        return validateAiResponse(response);
    }
    // 7. General Conversational / Default Intent
    const langKey = language === 'hi' || language === 'hi-en' ? language : 'en';
    let defaultResponse = '';
    if (langKey === 'hi') {
        defaultResponse = `नमस्ते! मैं साथी एआई हूँ। मैं दिल्ली, हरियाणा, पंजाब, हिमाचल और जम्मू-कश्मीर में आधिकारिक रूप से सत्यापित संपत्तियां खोजने, संपत्तियों की तुलना करने, या मॉडल टेनेंसी एक्ट और सुरक्षा नियमों को समझने में आपकी सहायता कर सकता हूँ। आप मुझसे विशिष्ट आवश्यकताओं के बारे में पूछ सकते हैं, जैसे: "जम्मू में ₹15,000 के अंदर 2 BHK फ्लैट"।`;
    }
    else if (langKey === 'hi-en') {
        defaultResponse = `Namaste! Main Saathi AI hoon. Main Delhi, Haryana, Punjab, HP aur J&K ke authentic verified listings search karne, side-by-side compare karne, ya Model Tenancy Act rules explain karne ke liye ready hoon. Aap mujhse pooch sakte hain jaise: "Find 2 BHK flat in Jammu under 15k".`;
    }
    else {
        defaultResponse = `Hello! I am Saathi AI. I can help you find genuine verified homes across Delhi, Haryana, Punjab, Himachal Pradesh, and Jammu & Kashmir, compare properties side-by-side, or understand security deposit laws and fraud prevention. For example, try asking: "Find a 2 BHK flat for rent in Jammu under ₹15,000".`;
    }
    const response = {
        id: `ai_${crypto.randomUUID().slice(0, 8)}`,
        sender: 'assistant',
        text: defaultResponse,
        timestamp: nowStr,
        intent: 'general_query',
        providerInfo: status,
        sessionId: currentSessionId,
        actions: [
            {
                id: `act_sample_search_${Date.now()}`,
                type: 'apply_search_filters',
                label: language === 'hi' ? 'जम्मू में 2 BHK खोजें' : 'Search 2 BHK in Jammu',
                payload: { city: 'Jammu', state: 'Jammu & Kashmir', maxRent: 15000, propertyType: '2bhk' },
                requiresConfirmation: false,
            },
            {
                id: `act_sample_deposit_${Date.now()}`,
                type: 'view_details',
                label: language === 'hi' ? 'डिपॉजिट नियम समझें' : 'Security Deposit Rules',
                payload: { topic: 'deposit_cap' },
                requiresConfirmation: false,
            },
        ],
        disclaimerNote: 'Saathi AI operates exclusively with authenticated property data and statutory tenancy frameworks.',
    };
    return validateAiResponse(response);
}
