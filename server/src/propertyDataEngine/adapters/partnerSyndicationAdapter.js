import { TARGET_REGIONS_LIST } from './firstPartyDirectAdapter.js';
/**
 * PartnerSyndicationAdapter
 * Connects to authorized B2B real-estate syndication partner APIs (e.g. licensed broker CRMs,
 * enterprise property syndicators using RESO / PropTech JSON schema).
 *
 * Strict Data Integrity:
 * - Only genuine partner feeds backed by active B2B contract and verifiable credentials.
 * - Incomplete listings or listings with synthetic prices/invented photos are rejected.
 */
export class PartnerSyndicationAdapter {
    id = 'partner_syndication';
    name = 'Authorized B2B Syndication Feed (RESO / PropTech JSON)';
    category = 'partner_syndication';
    targetRegions = TARGET_REGIONS_LIST;
    endpoint;
    apiKey;
    constructor() {
        this.endpoint = process.env.PARTNER_SYNDICATION_ENDPOINT;
        this.apiKey = process.env.PARTNER_SYNDICATION_API_KEY;
    }
    isConfigured() {
        return false;
    }
    getStatus() {
        return {
            id: this.id,
            name: this.name,
            category: this.category,
            targetRegions: this.targetRegions,
            configured: false,
            status: 'unsupported',
            statusMessage: 'Not connected. No authorized partner agreement or listing response mapper is configured; credentials alone would not enable rental search.',
            requiredCredentials: [],
            documentationRef: '/docs/data_providers_and_integrations.md#b2b-syndication',
            lastCheckedAt: new Date().toISOString(),
        };
    }
    async fetchListings(query) {
        if (!this.isConfigured()) {
            return {
                providerId: this.id,
                success: false,
                properties: [],
                totalMatches: 0,
                statusMessage: 'Partner syndication unconfigured. 0 external listings returned.',
                isFallback: false,
            };
        }
        try {
            const url = new URL(this.endpoint);
            if (query.state && query.state !== 'all') {
                url.searchParams.append('state', query.state);
            }
            url.searchParams.append('limit', String(query.limit || 12));
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json',
                },
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (!res.ok) {
                return {
                    providerId: this.id,
                    success: false,
                    properties: [],
                    totalMatches: 0,
                    statusMessage: `Partner syndication feed error: HTTP ${res.status}`,
                    isFallback: false,
                };
            }
            const data = await res.json();
            if (!data || !Array.isArray(data.listings)) {
                return {
                    providerId: this.id,
                    success: true,
                    properties: [],
                    totalMatches: 0,
                    statusMessage: '0 syndication listings returned.',
                    isFallback: false,
                };
            }
            return {
                providerId: this.id,
                success: true,
                properties: [],
                totalMatches: 0,
                statusMessage: 'Partner syndication queried successfully.',
                isFallback: false,
            };
        }
        catch (err) {
            return {
                providerId: this.id,
                success: false,
                properties: [],
                totalMatches: 0,
                statusMessage: `Failed to connect to partner syndication endpoint: ${err?.message || 'Network error'}`,
                isFallback: false,
            };
        }
    }
}
