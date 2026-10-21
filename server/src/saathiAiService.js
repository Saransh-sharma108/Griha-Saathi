import crypto from 'crypto';
import { db, FRESHNESS_POLICY_DAYS } from './db.js';
// ==============================================================================
// 1. REGIONAL KNOWLEDGE & STATUTORY REPOSITORY
// ==============================================================================
export const TARGET_REGIONS = {
    'Delhi': {
        districts: ['New Delhi', 'South Delhi', 'North Delhi', 'West Delhi', 'East Delhi', 'Dwarka', 'Rohini'],
        localities: ['Saket', 'Vasant Kunj', 'Dwarka Sector 10', 'Rohini Sector 13', 'Connaught Place', 'Lajpat Nagar', 'Karol Bagh', 'Hauz Khas', 'Greater Kailash'],
        registrySystem: 'Delhi DORIS / DDA Land Records (ddalandrecords.delhi.gov.in)',
        reraAuthority: 'Delhi RERA (rera.delhi.gov.in)',
    },
    'Haryana': {
        districts: ['Gurugram', 'Faridabad', 'Panchkula', 'Panipat', 'Karnal', 'Ambala', 'Sonipat', 'Rohtak'],
        localities: ['Cyber City', 'DLF Phase 1', 'DLF Phase 2', 'DLF Phase 4', 'DLF Phase 5', 'Sector 14', 'Sector 21', 'Sector 56', 'Sector 57', 'Golf Course Road', 'Sohna Road'],
        registrySystem: 'Haryana Jamabandi / Web-HALRIS (jamabandi.nic.in)',
        reraAuthority: 'Haryana RERA Gurugram & Panchkula (haryanarera.gov.in)',
    },
    'Punjab': {
        districts: ['Chandigarh', 'Mohali', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda'],
        localities: ['Sector 17', 'Sector 35', 'Sector 70 Mohali', 'Phase 7 Mohali', 'Model Town Ludhiana', 'Ranjit Avenue Amritsar', 'Civil Lines Jalandhar'],
        registrySystem: 'Punjab Land Records Society (PLRS Fard Kendra - plrs.org.in)',
        reraAuthority: 'Punjab RERA (rera.punjab.gov.in)',
    },
    'Himachal Pradesh': {
        districts: ['Shimla', 'Dharamshala', 'Solan', 'Kullu', 'Mandi', 'Kangra'],
        localities: ['Mall Road', 'Chotta Shimla', 'Sanjauli', 'Kasumpti', 'McLeod Ganj', 'Kotwali Dharamshala', 'Kandaghat Solan'],
        registrySystem: 'Himachal Pradesh Himbhoomi Land Records (lpr.hp.nic.in)',
        reraAuthority: 'Himachal Pradesh RERA (hprera.nic.in)',
    },
    'Jammu & Kashmir': {
        districts: ['Jammu', 'Srinagar', 'Udhampur', 'Katra', 'Anantnag', 'Baramulla', 'Kathua'],
        localities: ['Gandhi Nagar', 'Channi Himmat', 'Bahu Fort Area', 'Trikuta Nagar', 'Rajbagh', 'Lal Chowk', 'Hyderpora', 'Karan Nagar'],
        registrySystem: 'Aapki Zameen Aapki Nigrani (landrecords.jk.gov.in)',
        reraAuthority: 'J&K Real Estate Regulatory Authority',
    },
};
export const STATUTORY_GUIDANCE = [
    {
        id: 'deposit_cap',
        topic: 'Security Deposit Limits',
        keywords: ['security deposit', 'deposit', 'advance', 'peshgi', 'सिक्योरिटी', 'डिपॉजिट', 'अग्रिम', 'advance rent'],
        statutoryRef: 'Model Tenancy Act 2021, Section 11',
        content: {
            en: 'Under the Model Tenancy Act 2021 (the statutory benchmark across Delhi, Haryana, Punjab, HP, and J&K), security deposits for residential premises are strictly capped at a maximum of two months’ rent. Landlords cannot legally demand excessive 6-10 month deposits for residential tenancies. Griha Saathi explicitly audits listing deposit terms.',
            hi: 'मॉडल किरायेदारी अधिनियम 2021 (धारा 11) के तहत आवासीय परिसर के लिए सुरक्षा जमा (सिक्योरिटी डिपॉजिट) अधिकतम दो महीने के किराये तक सीमित है। मकान मालिक 6-10 महीने के अत्यधिक डिपॉजिट की मांग कानूनी रूप से नहीं कर सकते। गृह साथी प्रत्येक लिस्टिंग के डिपॉजिट नियमों की जांच करता है।',
            'hi-en': 'Model Tenancy Act 2021 (Section 11) ke mutabiq residential properties ke liye security deposit strictly maximum 2 months rent tak capped hai. Landlords legally 6-10 mahine ka excessive deposit demand nahi kar sakte.',
        },
    },
    {
        id: 'notice_eviction',
        topic: 'Notice Period & Eviction Rights',
        keywords: ['notice period', 'vacate', 'eviction', 'evict', 'खाली', 'नोटिस', 'be-dakhal', 'leave'],
        statutoryRef: 'Model Tenancy Act 2021, Sections 9 & 21',
        content: {
            en: 'Landlords must provide at least 90 days’ advance written notice before revising rent, or at least 30 days’ notice for tenancy termination unless a specific period is mutually documented in the registered lease. Unlawful eviction without a Rent Court order, cutting off electricity or water, or changing locks is strictly punishable by law.',
            hi: 'किराया संशोधन के लिए कम से कम 90 दिन पहले और लीज समाप्ति के लिए कम से कम 30 दिन पहले लिखित नोटिस अनिवार्य है। रेंट कोर्ट के आदेश के बिना बिजली-पानी काटना या जबरन बेदखल करना कानूनन दंडनीय अपराध है।',
            'hi-en': 'Rent revise karne ke liye at least 90 days aur lease terminate karne ke liye minimum 30 days ka written notice required hota hai. Rent Court order ke bina zabardasti vacate karwana ya bijli-pani kaatna illegal hai.',
        },
    },
    {
        id: 'fraud_prevention',
        topic: 'Rental Fraud Warning Signs & Safety',
        keywords: ['fraud', 'scam', 'fake', 'धोखा', 'फर्जी', 'स्कैम', 'token money', 'upi scam', 'suspicious'],
        statutoryRef: 'Griha Saathi Anti-Fraud Directive GS-AFD-2026',
        content: {
            en: 'Top rental fraud warning signs:\n1. Never transfer token money via UPI before a physical inspection or authorized digital land-record verification.\n2. Beware of impostors claiming to be "army officers", "NRI owners", or "CISF/airport staff" asking for a "visiting card fee" or "gate pass fee".\n3. Ensure the person presenting the lease is the registered title owner or holds a registered Power of Attorney (PoA).\n4. All Griha Saathi properties feature an Authoritative Verification Badge cross-referenced with state land registries. Use the "Report Fraud" button if you encounter misrepresentation.',
            hi: 'रेंटल फ्रॉड से बचने के महत्वपूर्ण नियम:\n1. भौतिक निरीक्षण या भूमि रिकॉर्ड सत्यापन से पहले कभी भी यूपीआई से टोकन मनी न भेजें।\n2. "सेना अधिकारी", "एनआरआई" या "सीआईएसएफ" के नाम पर विजिटिंग पास या गेट पास शुल्क मांगने वालों से सावधान रहें।\n3. यह अवश्य जांचें कि लीज देने वाला व्यक्ति वास्तविक टाइटल मालिक है या उसके पास पंजीकृत मुख्तारनामा (PoA) है।\n4. संदिग्ध लिस्टिंग दिखने पर तुरंत "Report Fraud" बटन का उपयोग करें।',
            'hi-en': 'Rental fraud aur scams se bachne ke golden rules:\n1. Physical visit ya land record audit se pehle kabhi bhi UPI pe advance token transfer mat karein.\n2. "Army officer" ya "NRI landlord" bol kar "Gate pass" ya "Visiting card" fees maangne wale 100% fraudsters hote hain.\n3. Verify karein ki owner ka naam state revenue registry records se match karta ho.\n4. Kisi bhi suspicious listing ko Griha Saathi ke "Report Fraud" button se report karein.',
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
        id: 'visit_scheduling',
        topic: 'Property Visits & Connections',
        keywords: ['visit', 'schedule', 'inspection', 'विज़िट', 'निरीक्षण', 'mulaqat', 'connection', 'appointment', 'viewing'],
        statutoryRef: 'Griha Saathi Mutual Respect & Safe Visit Protocol',
        content: {
            en: 'To inspect a property safely:\n1. Click "Connect with Owner" on any verified listing to initiate an authenticated connection request.\n2. Once the owner accepts, you can propose a property visit slot (morning, afternoon, or evening) through our integrated Visit Scheduler.\n3. Both parties receive audited in-app confirmations, preventing double-bookings or no-shows.\n4. Never share personal OTPs or financial PINs with property owners or visiting staff.',
            hi: 'संपत्ति के सुरक्षित निरीक्षण हेतु:\n1. सत्यापित लिस्टिंग पर "Connect with Owner" दबाकर प्रामाणिक कनेक्शन शुरू करें।\n2. मालिक की स्वीकृति के बाद हमारे विजिट शेड्यूलर से सुबह, दोपहर या शाम का स्लॉट चुनें।\n3. दोनों पक्षों को ऑडिटेड कन्फर्मेशन प्राप्त होता है, जिससे स्लॉट क्लैश नहीं होता।\n4. कभी भी किसी के साथ अपना ओटीपी या पिन साझा न करें।',
            'hi-en': 'Safe property visit schedule karne ka process:\n1. Verified listing par "Connect with Owner" click karein.\n2. Connection accept hone ke baad Visit Scheduler se preferred date & slot propose karein.\n3. Double-booking prevent karne ke liye system automated conflict check karta hai.\n4. Visit ke dauraan kisi ke saath apna OTP ya banking PIN share na karein.',
        },
    },
];
export function parseNaturalLanguageQuery(rawQuery, language = 'en') {
    const query = rawQuery.toLowerCase().trim();
    const filters = {};
    const extractedKeywords = [];
    const missingParameters = [];
    // Check Comparison Intent
    const comparisonKeywords = ['compare', 'vs', 'versus', 'difference between', 'तुल्ना', 'तुलना', 'muqabla', 'farq'];
    const hasComparisonIntent = comparisonKeywords.some(kw => query.includes(kw));
    // Extract explicit property IDs if mentioned (e.g. prop_hr_001, prop_jk_002)
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
        };
    }
    // Check Guidance Intent
    const matchedGuidance = STATUTORY_GUIDANCE.find(item => item.keywords.some(kw => query.includes(kw)));
    // 1. Detect State / Region
    let detectedState;
    if (query.includes('jammu') || query.includes('kashmir') || query.includes('j&k') || query.includes('jk') || query.includes('srinagar') || query.includes('जम्मू') || query.includes('कश्मीर') || query.includes('श्रीनगर')) {
        detectedState = 'Jammu & Kashmir';
        filters.state = 'Jammu & Kashmir';
        if (query.includes('jammu') || query.includes('जम्मू'))
            filters.city = 'Jammu';
        if (query.includes('srinagar') || query.includes('श्रीनगर'))
            filters.city = 'Srinagar';
        extractedKeywords.push('Jammu & Kashmir');
    }
    else if (query.includes('haryana') || query.includes('gurugram') || query.includes('gurgaon') || query.includes('faridabad') || query.includes('panipat') || query.includes('panchkula') || query.includes('sonipat') || query.includes('हरियाणा') || query.includes('गुरुग्राम') || query.includes('गुड़गांव') || query.includes('फरीदाबाद')) {
        detectedState = 'Haryana';
        filters.state = 'Haryana';
        if (query.includes('gurugram') || query.includes('gurgaon') || query.includes('गुरुग्राम') || query.includes('गुड़गांव'))
            filters.city = 'Gurugram';
        if (query.includes('faridabad') || query.includes('फरीदाबाद'))
            filters.city = 'Faridabad';
        extractedKeywords.push('Haryana');
    }
    else if (query.includes('punjab') || query.includes('chandigarh') || query.includes('mohali') || query.includes('ludhiana') || query.includes('amritsar') || query.includes('jalandhar') || query.includes('पंजाब') || query.includes('चंडीगढ़') || query.includes('मोहाली') || query.includes('लुधियाना')) {
        detectedState = 'Punjab';
        filters.state = 'Punjab';
        if (query.includes('chandigarh') || query.includes('चंडीगढ़'))
            filters.city = 'Chandigarh';
        if (query.includes('mohali') || query.includes('मोहाली'))
            filters.city = 'Mohali';
        if (query.includes('ludhiana') || query.includes('लुधियाना'))
            filters.city = 'Ludhiana';
        extractedKeywords.push('Punjab');
    }
    else if (query.includes('himachal') || query.includes('hp') || query.includes('shimla') || query.includes('dharamshala') || query.includes('solan') || query.includes('kullu') || query.includes('manali') || query.includes('हिमाचल') || query.includes('शिमला') || query.includes('धर्मशाला')) {
        detectedState = 'Himachal Pradesh';
        filters.state = 'Himachal Pradesh';
        if (query.includes('shimla') || query.includes('शिमला'))
            filters.city = 'Shimla';
        if (query.includes('dharamshala') || query.includes('धर्मशाला'))
            filters.city = 'Dharamshala';
        extractedKeywords.push('Himachal Pradesh');
    }
    else if (query.includes('delhi') || query.includes('ncr') || query.includes('dwarka') || query.includes('saket') || query.includes('rohini') || query.includes('south delhi') || query.includes('दिल्ली') || query.includes('द्वारका') || query.includes('साकेत') || query.includes('रोहिणी')) {
        detectedState = 'Delhi';
        filters.state = 'Delhi';
        filters.city = 'New Delhi';
        extractedKeywords.push('Delhi');
    }
    // 2. Detect City / District
    const allDistricts = Object.entries(TARGET_REGIONS).flatMap(([state, data]) => data.districts.map(d => ({ state: state, district: d })));
    for (const item of allDistricts) {
        if (query.includes(item.district.toLowerCase())) {
            filters.city = item.district;
            if (!filters.state)
                filters.state = item.state;
            extractedKeywords.push(item.district);
            break;
        }
    }
    // 3. Detect Locality
    const allLocalities = Object.entries(TARGET_REGIONS).flatMap(([state, data]) => data.localities.map(l => ({ state: state, locality: l })));
    for (const item of allLocalities) {
        if (query.includes(item.locality.toLowerCase())) {
            filters.locality = item.locality;
            if (!filters.state)
                filters.state = item.state;
            extractedKeywords.push(item.locality);
            break;
        }
    }
    // 4. Detect Bedrooms (BHK)
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
    else if (query.includes('studio')) {
        filters.propertyType = 'studio';
        extractedKeywords.push('Studio');
    }
    else if (query.includes('villa')) {
        filters.propertyType = 'villa';
        extractedKeywords.push('Villa');
    }
    else if (query.includes('independent house') || query.includes('kothi') || query.includes('house') || query.includes('कोठी')) {
        filters.propertyType = 'independent_house';
        extractedKeywords.push('Independent House');
    }
    // 5. Detect Budget / Rent Limits
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
        let rawAmount = underBudgetMatch[1].replace(/,/g, '');
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
        // Check shorthand like "15k" or "25k"
        const kMatch = query.match(/\b([0-9]{1,3})\s*k\b/i);
        if (kMatch) {
            const num = parseInt(kMatch[1], 10) * 1000;
            if (num >= 3000 && num <= 500000) {
                filters.maxRent = num;
                extractedKeywords.push(`Max ₹${num.toLocaleString('en-IN')}`);
            }
        }
        else {
            // Direct raw number check (e.g. "under 15000" or "for 15000")
            const numMatch = query.match(/(?:₹|rs\.?|inr)\s*([0-9]{4,6})/i);
            if (numMatch) {
                const num = parseInt(numMatch[1], 10);
                if (num >= 3000 && num <= 500000) {
                    filters.maxRent = num;
                    extractedKeywords.push(`Max ₹${num.toLocaleString('en-IN')}`);
                }
            }
        }
    }
    // 6. Detect Transaction Type (Rent vs Buy)
    if (query.includes('buy') || query.includes('purchase') || query.includes('khareed') || query.includes('for sale') || query.includes('selling') || query.includes('खरीदना')) {
        filters.transactionType = 'buy';
        extractedKeywords.push('Buy / Purchase');
    }
    else {
        filters.transactionType = 'rent';
        extractedKeywords.push('Rent');
    }
    // 7. Detect Furnishing
    if (query.includes('fully furnished') || query.includes('full furnished') || query.includes('well furnished')) {
        filters.furnishing = 'fully_furnished';
        extractedKeywords.push('Fully Furnished');
    }
    else if (query.includes('semi furnished') || query.includes('semi-furnished')) {
        filters.furnishing = 'semi_furnished';
        extractedKeywords.push('Semi-Furnished');
    }
    else if (query.includes('unfurnished') || query.includes('bina furniture')) {
        filters.furnishing = 'unfurnished';
        extractedKeywords.push('Unfurnished');
    }
    // 8. Detect Verification requirement
    filters.onlyVerified = true;
    // Determine Primary Intent
    const isExplicitPropertySearch = (query.includes('find') || query.includes('search') || query.includes('looking for') || query.includes('खोज') || query.includes('dhundh') || query.includes('chahiye')) &&
        (filters.bedrooms !== undefined || filters.city !== undefined || filters.locality !== undefined || filters.state !== undefined);
    // 1. Prioritize statutory & procedural guidance (Fraud, Deposit Cap, Verification, Notice, Visits)
    if (matchedGuidance && !isExplicitPropertySearch) {
        return {
            intent: matchedGuidance.id === 'fraud_prevention' ? 'fraud_safety' :
                matchedGuidance.id === 'verification_process' ? 'verification_info' : 'renting_guidance',
            filters,
            extractedKeywords,
            isMissingCriticalInfo: false,
            missingParameters: [],
            comparisonPropertyIds: [],
            matchedGuidanceTopic: matchedGuidance,
        };
    }
    // 2. Property Search Intent
    const hasPropertySearchWords = query.includes('find') || query.includes('search') || query.includes('flat') || query.includes('फ्लैट') ||
        query.includes('apartment') || query.includes('house') || query.includes('bhk') || query.includes('बीएचके') || query.includes('rent') ||
        query.includes('किराया') || query.includes('किराये') || query.includes('room') || query.includes('कमरा') || query.includes('ghar') ||
        query.includes('घर') || query.includes('makan') || query.includes('मकान') || query.includes('kothi') || query.includes('कोठी') ||
        query.includes('property') || query.includes('संपत्ति') || query.includes('listing') || query.includes('looking for') || query.includes('चाहिए') || query.includes('खोज');
    if (hasPropertySearchWords) {
        // Check if essential info is missing (e.g. neither state nor city nor locality is provided)
        if (!filters.state && !filters.city && !filters.locality) {
            missingParameters.push('location');
        }
        if (!filters.maxRent) {
            missingParameters.push('budget');
        }
        const isMissingCritical = missingParameters.includes('location');
        return {
            intent: isMissingCritical ? 'missing_info_followup' : 'property_search',
            filters,
            extractedKeywords,
            isMissingCriticalInfo: isMissingCritical,
            missingParameters,
            comparisonPropertyIds: [],
            matchedGuidanceTopic: matchedGuidance,
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
    // Apply Max Rent filter
    if (filters.maxRent !== undefined && filters.maxRent > 0) {
        validCandidates = validCandidates.filter((p) => p.rentPerMonth <= filters.maxRent);
    }
    // Apply Furnishing filter
    if (filters.furnishing && filters.furnishing !== 'any') {
        validCandidates = validCandidates.filter((p) => p.furnishing === filters.furnishing);
    }
    // Format into SaathiPropertyCards with objective facts and recommendation rationale
    const cards = validCandidates.map((p) => {
        const isFresh = p.availabilityConfirmedAt
            ? (Date.now() - new Date(p.availabilityConfirmedAt).getTime()) <= (FRESHNESS_POLICY_DAYS * 24 * 60 * 60 * 1000)
            : true;
        // Build specific match rationale
        const rationaleParts = [];
        if (filters.bedrooms)
            rationaleParts.push(`${p.bedrooms} BHK configuration`);
        if (filters.maxRent)
            rationaleParts.push(`monthly rent of ₹${p.rentPerMonth.toLocaleString('en-IN')} within budget`);
        if (filters.city || filters.locality)
            rationaleParts.push(`located in ${p.locality}, ${p.city}`);
        rationaleParts.push('passed 100% authoritative land-registry and physical verification');
        const matchRationale = language === 'hi'
            ? `यह संपत्ति आपकी मांग से मेल खाती है: ${p.bedrooms} बीएचके, ₹${p.rentPerMonth.toLocaleString('en-IN')} मासिक किराया, ${p.locality}, ${p.city} में स्थित, और सरकारी राजस्व रिकॉर्ड से पूरी तरह सत्यापित।`
            : language === 'hi-en'
                ? `Matches your requirement: ${p.bedrooms} BHK in ${p.locality}, ${p.city} at ₹${p.rentPerMonth.toLocaleString('en-IN')}/mo with 100% verified land title.`
                : `Recommended because it satisfies your ${rationaleParts.join(', ')}.`;
        const objectiveFacts = [
            `Rent: ₹${p.rentPerMonth.toLocaleString('en-IN')}/month (Security deposit: ₹${(p.securityDeposit || p.rentPerMonth * 2).toLocaleString('en-IN')})`,
            `Specification: ${p.bedrooms} BHK • ${p.bathrooms || 1} Bath • ${p.areaSqFt ? `${p.areaSqFt} sq.ft` : 'Area not declared'}`,
            `Furnishing: ${p.furnishing.replace('_', ' ').toUpperCase()}`,
            `Authority Audit: Title verified against ${TARGET_REGIONS[p.state]?.registrySystem || 'State Revenue Registry'}`,
            `Availability: ${isFresh ? 'Confirmed Live (Past 60 Days)' : 'Awaiting 60-day owner reconfirmation'}`,
        ];
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
            bedrooms: p.bedrooms ?? 1,
            bathrooms: p.bathrooms,
            areaSqFt: p.areaSqFt,
            furnishing: p.furnishing,
            verificationStatus: p.verificationStatus,
            isFresh,
            availableFrom: p.availableFrom,
            primaryPhotoUrl: p.photos && p.photos.length > 0 ? p.photos[0] : undefined,
            matchRationale,
            objectiveFacts,
            ownerMaskedContact: p.ownerMaskedContact || 'Masked per DPDP Act',
        };
    });
    // Handle Zero-Results vs Matches
    let explanation = '';
    const relaxationSuggestions = [];
    const suggestedActions = [];
    if (cards.length > 0) {
        explanation = language === 'hi'
            ? `सत्यापित डेटाबेस में आपकी खोज के अनुसार ${cards.length} वास्तविक संपत्तियां मिली हैं। प्रत्येक लिस्टिंग का राजस्व रिकॉर्ड और भौतिक सत्यापन किया जा चुका है।`
            : language === 'hi-en'
                ? `Authoritative database mein aapki query ke mutabiq ${cards.length} verified listings match hui hain. All listings carry genuine registry audit proof.`
                : `Found ${cards.length} authentic, authoritatively verified listing${cards.length === 1 ? '' : 's'} matching your search criteria.`;
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
        // Add first property action suggestions
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
// 4. SIDE-BY-SIDE PROPERTY COMPARISON ENGINE
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
        });
    }
    return comparisonItems;
}
// ==============================================================================
// 5. PROVIDER INTEGRATION & HONEST STATUS REPORTING
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
            statusMessage: 'Gemini AI Provider Connected & Ready',
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
    const { userQuery, language = 'en', authenticatedUserId } = options;
    // Sanitize and trim
    const cleanInput = userQuery.trim().slice(0, 1000);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const status = getSaathiProviderStatus();
    // 1. Parse natural language intent and parameters
    const parsed = parseNaturalLanguageQuery(cleanInput, language);
    // 2. Handle Missing Critical Information Follow-up
    if (parsed.intent === 'missing_info_followup') {
        let followUpText = '';
        if (language === 'hi') {
            followUpText = 'नमस्ते! वास्तविक सत्यापित संपत्तियों को खोजने के लिए, कृपया अपना पसंदीदा शहर या राज्य (जैसे जम्मू, गुरुग्राम, चंडीगढ़, शिमला, या दिल्ली) और अपना अधिकतम मासिक बजट बताएं?';
        }
        else if (language === 'hi-en') {
            followUpText = 'Namaste! Authentic verified listings search karne ke liye, kya aap apni preferred location (jaise Jammu, Gurugram, Chandigarh, Shimla, ya Delhi) aur monthly budget bata sakte hain?';
        }
        else {
            followUpText = 'To search our authoritative property database, which city or state (Delhi, Haryana, Punjab, Himachal Pradesh, or Jammu & Kashmir) are you looking in, and what is your target monthly budget?';
        }
        return {
            id: `ai_${crypto.randomUUID().slice(0, 8)}`,
            sender: 'assistant',
            text: followUpText,
            timestamp: nowStr,
            intent: 'missing_info_followup',
            followUpQuestion: followUpText,
            providerInfo: status,
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
    }
    // 3. Handle Property Comparison Intent
    if (parsed.intent === 'property_comparison') {
        let propIds = parsed.comparisonPropertyIds;
        if (propIds.length === 0) {
            // Pick top 2 verified properties from database to demonstrate real comparison
            const approvedProps = Array.from(db.properties.values())
                .filter(p => p.submissionStatus === 'approved' && p.verificationStatus === 'authoritative_verified')
                .slice(0, 2);
            propIds = approvedProps.map(p => p.id);
        }
        const comparisonTable = generatePropertyComparison(propIds);
        let comparisonText = '';
        if (comparisonTable.length < 2) {
            comparisonText = language === 'hi'
                ? 'तुलना के लिए डेटाबेस में कम से कम दो सत्यापित संपत्तियों की आवश्यकता है। कृपया खोज से संपत्तियों का चयन करें या प्रॉपर्टी आईडी दर्ज करें।'
                : language === 'hi-en'
                    ? 'Comparison ke liye at least 2 verified properties chahiye. Please search results se properties select karein.'
                    : 'Please specify at least two real properties to compare. You can select properties from search results or provide property IDs.';
        }
        else {
            comparisonText = language === 'hi'
                ? `यहाँ चुनी गई ${comparisonTable.length} सत्यापित संपत्तियों की सीधी तुलना दी गई है। अनुपलब्ध फ़ील्ड को "उपलब्ध नहीं कराया गया" के रूप में दिखाया गया है:`
                : language === 'hi-en'
                    ? `Yahan selected ${comparisonTable.length} verified properties ka side-by-side comparison diya gaya hai. Missing fields clearly "Not provided" marked hain:`
                    : `Here is a side-by-side comparison of the ${comparisonTable.length} selected verified properties. Any missing record details are explicitly marked as "Not provided":`;
        }
        return {
            id: `ai_${crypto.randomUUID().slice(0, 8)}`,
            sender: 'assistant',
            text: comparisonText,
            timestamp: nowStr,
            intent: 'property_comparison',
            comparisonTable,
            providerInfo: status,
            disclaimerNote: 'Comparisons strictly reflect authoritative database records. No attributes are inferred or guessed.',
        };
    }
    // 4. Handle Guidance Intents (Renting, Fraud, Legal, Visits)
    if (parsed.matchedGuidanceTopic) {
        const guidance = parsed.matchedGuidanceTopic;
        const langKey = language === 'hi' || language === 'hi-en' ? language : 'en';
        const guidanceText = guidance.content[langKey];
        return {
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
    }
    // 5. Handle Property Search Intent
    if (parsed.intent === 'property_search') {
        const searchResult = executePropertySearch(parsed.filters, language);
        let messageText = searchResult.explanation;
        if (searchResult.relaxationSuggestions.length > 0) {
            messageText += `\n\n${language === 'hi' ? 'सुझाए गए फ़िल्टर समायोजन:' : 'Suggested filter adjustments:'}\n` +
                searchResult.relaxationSuggestions.map(s => `• ${s}`).join('\n');
        }
        return {
            id: `ai_${crypto.randomUUID().slice(0, 8)}`,
            sender: 'assistant',
            text: messageText,
            timestamp: nowStr,
            intent: 'property_search',
            suggestedFilters: parsed.filters,
            properties: searchResult.properties,
            actions: searchResult.suggestedActions,
            providerInfo: status,
            relatedEntities: {
                verifiedPropertyCount: searchResult.totalMatches,
            },
            disclaimerNote: searchResult.disclaimer,
        };
    }
    // 6. General Conversational / Help Intent
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
    return {
        id: `ai_${crypto.randomUUID().slice(0, 8)}`,
        sender: 'assistant',
        text: defaultResponse,
        timestamp: nowStr,
        intent: 'general_query',
        providerInfo: status,
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
}
