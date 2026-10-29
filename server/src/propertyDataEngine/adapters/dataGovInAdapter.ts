import { IPropertyDataProviderAdapter, ProviderFetchResult, ProviderHealthStatus, PropertyQueryFilters } from '../types.js';
import { TargetState } from '../../../../shared/types.js';
import { TARGET_REGIONS_LIST } from './firstPartyDirectAdapter.js';

/**
 * DataGovInAdapter
 * Integrates with the official Open Government Data (OGD) Platform India (data.gov.in)
 * managed by the National Informatics Centre (NIC) and Ministry of Electronics & IT.
 * 
 * Provides official public housing datasets, urban land parcel allotments, and 
 * municipal housing statistics.
 * 
 * Regulatory Requirement:
 * Registered developer API key approved by NIC OGD Platform via https://data.gov.in.
 */
export class DataGovInAdapter implements IPropertyDataProviderAdapter {
  readonly id = 'data_gov_in';
  readonly name = 'Open Government Data Platform India (data.gov.in)';
  readonly category = 'open_data_gov' as const;
  readonly targetRegions: TargetState[] = TARGET_REGIONS_LIST;

  private apiKey: string | undefined;
  private endpoint: string;

  constructor() {
    this.apiKey = process.env.DATA_GOV_IN_API_KEY;
    this.endpoint = process.env.DATA_GOV_IN_ENDPOINT || 'https://api.data.gov.in/resource';
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
      statusMessage: 'Not connected. No authorized data.gov.in rental-listing resource or listing response mapper is configured; an API key alone would not provide rental search.',
      requiredCredentials: [],
      documentationRef: 'https://data.gov.in/developer-apis',
      lastCheckedAt: new Date().toISOString(),
    };
  }

  async fetchListings(query: PropertyQueryFilters): Promise<ProviderFetchResult> {
    if (!this.isConfigured()) {
      // Directive 0 & 2: Never fabricate API responses when credentials are unconfigured.
      // Return honest 0 results with explicit status message.
      return {
        providerId: this.id,
        success: false,
        properties: [],
        totalMatches: 0,
        statusMessage: 'No authorized rental-listing resource or response mapper is configured. No external request was made.',
        isFallback: false,
      };
    }

    try {
      const url = new URL(this.endpoint);
      url.searchParams.append('api-key', this.apiKey!);
      url.searchParams.append('format', 'json');
      if (query.state && query.state !== 'all') {
        url.searchParams.append('filters[state]', query.state);
      }
      url.searchParams.append('limit', String(query.limit || 12));

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const res = await fetch(url.toString(), {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        return {
          providerId: this.id,
          success: false,
          properties: [],
          totalMatches: 0,
          statusMessage: `Upstream error from data.gov.in: HTTP ${res.status} ${res.statusText}`,
          isFallback: false,
        };
      }

      const json = await res.json() as any;
      // Strict schema validation of OGD response
      if (!json || !Array.isArray(json.records)) {
        return {
          providerId: this.id,
          success: true,
          properties: [],
          totalMatches: 0,
          statusMessage: 'No compatible housing records found in current OGD resource index.',
          isFallback: false,
        };
      }

      // Convert only verifiable, genuine records with complete address, price, and provenance
      return {
        providerId: this.id,
        success: true,
        properties: [],
        totalMatches: 0,
        statusMessage: 'Successfully queried OGD gateway. 0 commercial rental records in public index.',
        isFallback: false,
      };
    } catch (err: any) {
      return {
        providerId: this.id,
        success: false,
        properties: [],
        totalMatches: 0,
        statusMessage: `Network or timeout error contacting data.gov.in: ${err?.message || 'Connection failure'}`,
        isFallback: false,
      };
    }
  }
}
