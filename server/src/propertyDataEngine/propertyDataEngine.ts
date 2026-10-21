import { 
  IPropertyDataProviderAdapter, 
  PropertyQueryFilters, 
  ProviderHealthStatus, 
  ProviderFetchResult 
} from './types.js';
import { 
  Property, 
  TargetState, 
  RegionalStatusReport, 
  RegionalCoverageMatrix, 
  RegionalCoverageStatus 
} from '../../../shared/types.js';
import { db, FRESHNESS_POLICY_DAYS } from '../db.js';
import { FirstPartyDirectAdapter, TARGET_REGIONS_LIST } from './adapters/firstPartyDirectAdapter.js';
import { DataGovInAdapter } from './adapters/dataGovInAdapter.js';
import { StateReraAdapter } from './adapters/stateReraAdapter.js';
import { PartnerSyndicationAdapter } from './adapters/partnerSyndicationAdapter.js';

export interface DataEngineSearchResult {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  properties: Property[];
  regionalMatrix: RegionalCoverageMatrix;
  metadata: {
    appliedFilters: PropertyQueryFilters;
    stalePolicyDays: number;
    targetStates: TargetState[];
    realDataOnly: true;
    zeroSyntheticPolicyEnforced: true;
    connectedProvidersCount: number;
    unconfiguredProvidersCount: number;
  };
}

export class PropertyDataEngine {
  private adapters: Map<string, IPropertyDataProviderAdapter> = new Map();

  constructor() {
    this.registerAdapter(new FirstPartyDirectAdapter());
    this.registerAdapter(new DataGovInAdapter());
    this.registerAdapter(new StateReraAdapter());
    this.registerAdapter(new PartnerSyndicationAdapter());
  }

  public registerAdapter(adapter: IPropertyDataProviderAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  public getAdapter(id: string): IPropertyDataProviderAdapter | undefined {
    return this.adapters.get(id);
  }

  public getAllProvidersStatus(): ProviderHealthStatus[] {
    return Array.from(this.adapters.values()).map((a) => a.getStatus());
  }

  /**
   * Computes the 5-Region Evidence-Based Integration Matrix (Directive 3)
   * Tracks actual operational state per region based strictly on genuine records.
   */
  public getRegionalCoverageMatrix(): RegionalCoverageMatrix {
    const timestamp = new Date().toISOString();
    const providers = this.getAllProvidersStatus();
    const connectedProviders = providers.filter((p) => p.configured);
    const connectedProviderIds = connectedProviders.map((p) => p.name);

    const regions: Record<TargetState, RegionalStatusReport> = {} as any;
    let totalGenuineListings = 0;
    let connectedRegionsCount = 0;

    for (const region of TARGET_REGIONS_LIST) {
      // Query database directly for genuine, approved listings in this region
      const genuineListingsInRegion = Array.from(db.properties.values()).filter(
        (p) =>
          p.state.toLowerCase() === region.toLowerCase() &&
          p.submissionStatus === 'approved'
      );

      const count = genuineListingsInRegion.length;
      totalGenuineListings += count;

      let status: RegionalCoverageStatus;
      let statusLabel: string;
      let limitations: string;

      if (count > 0) {
        status = 'connected';
        statusLabel = `Connected • ${count} Verified Listing${count > 1 ? 's' : ''}`;
        connectedRegionsCount++;
        limitations = 'Subject to 60-day availability re-verification cycle and Title Deed registry audit.';
      } else {
        // First-party submission portal is open and operational, but 0 listings currently match
        status = 'connected_no_listings';
        statusLabel = 'Connected • 0 Current Listings';
        limitations = `First-party owner submission pipeline operational. Direct listings pending owner onboarding in ${region}. Third-party syndication feeds await partner credentials.`;
      }

      // Collect available property types from real data
      const availableTypes = Array.from(new Set(genuineListingsInRegion.map((p) => p.propertyType)));

      regions[region] = {
        region,
        status,
        statusLabel,
        connectedProviders: connectedProviderIds,
        activeListingCount: count,
        lastCheckedAt: timestamp,
        freshnessWindowDays: FRESHNESS_POLICY_DAYS,
        limitations,
        availablePropertyTypes: availableTypes,
        documentationRef: '/docs/data_providers_and_integrations.md',
      };
    }

    return {
      timestamp,
      totalRegions: TARGET_REGIONS_LIST.length,
      connectedRegionsCount,
      totalGenuineListings,
      zeroSyntheticPolicyEnforced: true,
      regions,
      disclaimer: 'Griha Saathi never fabricates property listings. Real property owners and authorized brokers submit listings verified against state revenue records.',
    };
  }

  /**
   * Search Properties with Provenance & Zero-Synthetic Data Invariant (Directives 4, 5, 8, 9)
   */
  public async searchProperties(query: PropertyQueryFilters): Promise<DataEngineSearchResult> {
    const pageNum = Math.max(1, query.page || 1);
    const limitNum = Math.min(50, Math.max(1, query.limit || 12));

    // Query all configured adapters
    const allResults: Property[] = [];
    const seenIds = new Set<string>();

    for (const adapter of this.adapters.values()) {
      if (adapter.isConfigured()) {
        try {
          const fetchRes = await adapter.fetchListings(query);
          if (fetchRes.success && Array.isArray(fetchRes.properties)) {
            for (const prop of fetchRes.properties) {
              if (!seenIds.has(prop.id)) {
                // Strict Data Integrity Audit (Directive 0)
                this.validateDataIntegrity(prop);
                seenIds.add(prop.id);
                allResults.push(prop);
              }
            }
          }
        } catch (err) {
          console.error(`[PropertyDataEngine] Error querying adapter ${adapter.id}:`, err);
          // Fail safely: error in one adapter does not corrupt or inject fake data (Directive 4)
        }
      }
    }

    // Sorting Logic
    const sortBy = query.sortBy || 'verified_first';
    allResults.sort((a, b) => {
      if (sortBy === 'rent_asc') {
        return a.rentPerMonth - b.rentPerMonth;
      }
      if (sortBy === 'rent_desc') {
        return b.rentPerMonth - a.rentPerMonth;
      }
      if (sortBy === 'newest') {
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      }
      // verified_first (default)
      const aVerified = a.verificationStatus === 'authoritative_verified' ? 1 : 0;
      const bVerified = b.verificationStatus === 'authoritative_verified' ? 1 : 0;
      if (bVerified !== aVerified) {
        return bVerified - aVerified;
      }
      return Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt);
    });

    // Pagination
    const total = allResults.length;
    const totalPages = total > 0 ? Math.ceil(total / limitNum) : 0;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = allResults.slice(startIndex, startIndex + limitNum);

    const regionalMatrix = this.getRegionalCoverageMatrix();
    const providers = this.getAllProvidersStatus();
    const connectedCount = providers.filter((p) => p.configured).length;

    return {
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      properties: paginated,
      regionalMatrix,
      metadata: {
        appliedFilters: query,
        stalePolicyDays: FRESHNESS_POLICY_DAYS,
        targetStates: TARGET_REGIONS_LIST,
        realDataOnly: true,
        zeroSyntheticPolicyEnforced: true,
        connectedProvidersCount: connectedCount,
        unconfiguredProvidersCount: providers.length - connectedCount,
      },
    };
  }

  /**
   * Strict Data Integrity Validator (Directive 0, 5, 8, 12)
   * Throws an error if any property exhibits characteristics of synthetic/mock data.
   */
  public validateDataIntegrity(property: Property): void {
    if (!property.id || typeof property.id !== 'string') {
      throw new Error(`Data integrity violation: Property missing valid id.`);
    }

    if (!property.title || property.title.trim().length === 0) {
      throw new Error(`Data integrity violation: Property ${property.id} missing title.`);
    }

    if (!TARGET_REGIONS_LIST.includes(property.state)) {
      throw new Error(`Data integrity violation: Property ${property.id} in unsupported state: ${property.state}`);
    }

    if (typeof property.rentPerMonth !== 'number' || isNaN(property.rentPerMonth) || property.rentPerMonth < 0) {
      throw new Error(`Data integrity violation: Property ${property.id} has invalid rent: ${property.rentPerMonth}`);
    }

    // Check for fake/synthetic placeholder indicators
    const lowerTitle = property.title.toLowerCase();
    const lowerDesc = (property.description || '').toLowerCase();
    const prohibitedWords = ['lorem ipsum', 'test property', 'sample listing', 'fake property', 'dummy property'];
    for (const word of prohibitedWords) {
      if (lowerTitle.includes(word) || lowerDesc.includes(word)) {
        throw new Error(`Data integrity violation: Property ${property.id} contains synthetic placeholder text: "${word}".`);
      }
    }

    // Verify timestamps are not in the future
    const nowMs = Date.now() + 60000; // allow 1 min clock skew
    if (Date.parse(property.createdAt) > nowMs) {
      throw new Error(`Data integrity violation: Property ${property.id} has future creation date.`);
    }

    // Decouple verification badge from submission (Directive 7)
    if (property.verificationStatus === 'authoritative_verified' && !property.verificationRecord) {
      throw new Error(`Data integrity violation: Property ${property.id} claimed authoritative_verified without supporting verificationRecord.`);
    }
  }
}

// Global Singleton Instance
export const propertyDataEngine = new PropertyDataEngine();
