import { Router } from 'express';
export const providersRouter = Router();
const targetStates = ['Delhi', 'Haryana', 'Punjab', 'Himachal Pradesh', 'Jammu & Kashmir'];
export function getProviderIntegrations() {
    return [
        {
            id: 'prov_telecom_sms',
            name: 'TRAI-DLT Registered SMS Gateway (MSG91 / Twilio)',
            category: 'sms_email',
            targetRegions: targetStates,
            configured: Boolean(process.env.SMS_GATEWAY_API_KEY && process.env.SMS_GATEWAY_API_KEY !== 'YOUR_SMS_API_KEY'),
            statusMessage: process.env.SMS_GATEWAY_API_KEY && process.env.SMS_GATEWAY_API_KEY !== 'YOUR_SMS_API_KEY'
                ? 'Connected & active.'
                : 'Unconfigured. Awaiting TRAI DLT approved sender ID and SMS Gateway API key in .env.',
            requiredCredentials: ['SMS_GATEWAY_API_KEY', 'SMS_GATEWAY_SENDER_ID', 'SMS_DLT_TEMPLATE_ID'],
            documentationRef: '/docs/data_providers_and_integrations.md#1-telecom-sms--email-gateways',
        },
        {
            id: 'prov_digilocker',
            name: 'DigiLocker / UIDAI Identity Gateway',
            category: 'identity_digilocker',
            targetRegions: targetStates,
            configured: Boolean(process.env.DIGILOCKER_CLIENT_ID && process.env.DIGILOCKER_CLIENT_ID !== 'YOUR_DIGILOCKER_CLIENT_ID'),
            statusMessage: process.env.DIGILOCKER_CLIENT_ID && process.env.DIGILOCKER_CLIENT_ID !== 'YOUR_DIGILOCKER_CLIENT_ID'
                ? 'Connected & active.'
                : 'Unconfigured. Requires DigiLocker Requester Organization registration and client credentials.',
            requiredCredentials: ['DIGILOCKER_CLIENT_ID', 'DIGILOCKER_CLIENT_SECRET', 'DIGILOCKER_REDIRECT_URI'],
            documentationRef: '/docs/data_providers_and_integrations.md#2-digilocker--aadhaar-identity-verification',
        },
        {
            id: 'prov_haryana_jamabandi',
            name: 'Haryana Land Records (Jamabandi / Web-HALRIS)',
            category: 'land_registry',
            targetRegions: ['Haryana'],
            configured: Boolean(process.env.HARYANA_JAMABANDI_API_KEY),
            statusMessage: process.env.HARYANA_JAMABANDI_API_KEY
                ? 'Connected & active.'
                : 'Awaiting Department of Revenue & Disaster Management Haryana e-Bhoomi API agreement.',
            requiredCredentials: ['HARYANA_JAMABANDI_API_URL', 'HARYANA_JAMABANDI_API_KEY', 'HARTRON_CLIENT_CERT'],
            documentationRef: '/docs/data_providers_and_integrations.md#3-haryana-jamabandi--web-halris',
        },
        {
            id: 'prov_punjab_plrs',
            name: 'Punjab Land Records Society (PLRS / Fard Kendra)',
            category: 'land_registry',
            targetRegions: ['Punjab'],
            configured: Boolean(process.env.PUNJAB_PLRS_API_KEY),
            statusMessage: process.env.PUNJAB_PLRS_API_KEY
                ? 'Connected & active.'
                : 'Awaiting Punjab Department of Governance Reforms (DGR) institutional API access.',
            requiredCredentials: ['PUNJAB_PLRS_ENDPOINT', 'PUNJAB_PLRS_API_KEY', 'PUNJAB_DGR_SIGNATURE'],
            documentationRef: '/docs/data_providers_and_integrations.md#4-punjab-land-records-society-plrs',
        },
        {
            id: 'prov_delhi_doris',
            name: 'Delhi Land Records & DDA Portal (DORIS / Bhoomi)',
            category: 'land_registry',
            targetRegions: ['Delhi'],
            configured: Boolean(process.env.DELHI_DORIS_API_KEY),
            statusMessage: process.env.DELHI_DORIS_API_KEY
                ? 'Connected & active.'
                : 'Awaiting NIC Delhi / GNCTD Revenue Department digital gateway integration agreement.',
            requiredCredentials: ['DELHI_REVENUE_API_URL', 'DELHI_DORIS_API_KEY'],
            documentationRef: '/docs/data_providers_and_integrations.md#5-delhi-doris--dda-land-registry',
        },
        {
            id: 'prov_hp_himbhoomi',
            name: 'Himachal Pradesh Himbhoomi (Land Records HP)',
            category: 'land_registry',
            targetRegions: ['Himachal Pradesh'],
            configured: Boolean(process.env.HP_HIMBHOOMI_API_KEY),
            statusMessage: process.env.HP_HIMBHOOMI_API_KEY
                ? 'Connected & active.'
                : 'Awaiting Himachal Pradesh State Data Center authorization and NIC HP clearance.',
            requiredCredentials: ['HP_HIMBHOOMI_API_URL', 'HP_HIMBHOOMI_API_KEY'],
            documentationRef: '/docs/data_providers_and_integrations.md#6-himachal-pradesh-himbhoomi',
        },
        {
            id: 'prov_jk_land_records',
            name: 'J&K Revenue Portal (Aapki Zameen Aapki Nigrani)',
            category: 'land_registry',
            targetRegions: ['Jammu & Kashmir'],
            configured: Boolean(process.env.JK_LAND_RECORDS_API_KEY),
            statusMessage: process.env.JK_LAND_RECORDS_API_KEY
                ? 'Connected & active.'
                : 'Awaiting J&K e-Governance Agency (JaKeGA) enterprise API integration agreement.',
            requiredCredentials: ['JK_LAND_RECORDS_API_URL', 'JK_LAND_RECORDS_API_KEY'],
            documentationRef: '/docs/data_providers_and_integrations.md#7-jammu--kashmir-land-records',
        },
        {
            id: 'prov_cersai',
            name: 'CERSAI Asset Encumbrance Registry',
            category: 'cersai',
            targetRegions: targetStates,
            configured: Boolean(process.env.CERSAI_INSTITUTION_ID),
            statusMessage: process.env.CERSAI_INSTITUTION_ID
                ? 'Connected & active.'
                : 'Awaiting institutional member registration with CERSAI under SARFAESI Act.',
            requiredCredentials: ['CERSAI_INSTITUTION_ID', 'CERSAI_API_SECRET', 'CERSAI_PUBLIC_KEY'],
            documentationRef: '/docs/data_providers_and_integrations.md#8-cersai-asset-encumbrance-registry',
        },
    ];
}
/**
 * GET /api/providers
 * Returns live status of all external authorized integrations.
 */
providersRouter.get('/', (req, res) => {
    const integrations = getProviderIntegrations();
    const configuredCount = integrations.filter((i) => i.configured).length;
    return res.json({
        success: true,
        totalCount: integrations.length,
        configuredCount,
        unconfiguredCount: integrations.length - configuredCount,
        integrations,
        disclaimer: 'Griha Saathi never simulates external provider responses. Missing integrations are clearly declared and gated until authorized keys are loaded.',
    });
});
