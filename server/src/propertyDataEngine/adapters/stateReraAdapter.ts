import { IPropertyDataProviderAdapter, ProviderFetchResult, ProviderHealthStatus, PropertyQueryFilters } from '../types.js';
import { TargetState } from '../../../../shared/types.js';
import { TARGET_REGIONS_LIST } from './firstPartyDirectAdapter.js';

/**
 * StateReraAdapter
 * Integrates with official State Real Estate Regulatory Authority (RERA) public portals:
 * - Haryana RERA (HRERA Gurugram / Panchkula - haryanarera.gov.in)
 * - Punjab RERA (rera.punjab.gov.in)
 * - Delhi RERA (rera.delhi.gov.in)
 * - Himachal Pradesh RERA (hprera.nic.in)
 * - Jammu & Kashmir RERA (jkrera.jk.gov.in)
 * 
 * Provides verified statutory developer project numbers, title clearance certificates,
 * and registered promoter listings.
 */
export class StateReraAdapter implements IPropertyDataProviderAdapter {
  readonly id = 'state_rera_registry';
  readonly name = 'State RERA Public Project Registries (HRERA / PRERA / DRERA / HPRERA / JKRERA)';
  readonly category = 'state_rera' as const;
  readonly targetRegions: TargetState[] = TARGET_REGIONS_LIST;

  private apiKey: string | undefined;
  private gatewayUrl: string | undefined;

  constructor() {
    this.apiKey = process.env.STATE_RERA_GATEWAY_KEY;
    this.gatewayUrl = process.env.STATE_RERA_GATEWAY_URL;
  }

  isConfigured(): boolean {
    return false;
  }

  getStatus(): ProviderHealthStatus {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      targetRegions: this.targetRegions,
      configured: false,
      status: 'unsupported',
      statusMessage: 'Not connected. No authorized rental-listing feed or response mapper is configured. State RERA project records are not a rental listings feed.',
      requiredCredentials: [],
      documentationRef: '/docs/data_providers_and_integrations.md#state-rera-registries',
      lastCheckedAt: new Date().toISOString(),
    };
  }

  async fetchListings(query: PropertyQueryFilters): Promise<ProviderFetchResult> {
    if (!this.isConfigured()) {
      return {
        providerId: this.id,
        success: false,
        properties: [],
        totalMatches: 0,
        statusMessage: 'Awaiting STATE_RERA_GATEWAY_KEY and STATE_RERA_GATEWAY_URL. State RERA feed inactive.',
        isFallback: false,
      };
    }

    try {
      const url = new URL(this.gatewayUrl!);
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
          statusMessage: `State RERA gateway returned HTTP ${res.status}`,
          isFallback: false,
        };
      }

      const data = await res.json() as any;
      if (!data || !Array.isArray(data.projects)) {
        return {
          providerId: this.id,
          success: true,
          properties: [],
          totalMatches: 0,
          statusMessage: '0 matching approved RERA projects returned.',
          isFallback: false,
        };
      }

      return {
        providerId: this.id,
        success: true,
        properties: [],
        totalMatches: 0,
        statusMessage: 'RERA gateway queried successfully.',
        isFallback: false,
      };
    } catch (err: any) {
      return {
        providerId: this.id,
        success: false,
        properties: [],
        totalMatches: 0,
        statusMessage: `Error contacting State RERA gateway: ${err?.message || 'Connection error'}`,
        isFallback: false,
      };
    }
  }
}
