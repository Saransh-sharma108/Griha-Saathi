import { IPropertyDataProviderAdapter, ProviderFetchResult, ProviderHealthStatus, PropertyQueryFilters } from '../types.js';
import { TargetState, Property, PropertyProvenance } from '../../../../shared/types.js';
import { db, FRESHNESS_POLICY_DAYS } from '../../db.js';
import { hasAuthoritativeVerificationEvidence, isPubliclyDiscoverable } from '../publicListingPolicy.js';

export const TARGET_REGIONS_LIST: TargetState[] = [
  'Delhi',
  'Haryana',
  'Punjab',
  'Himachal Pradesh',
  'Jammu & Kashmir',
];

/**
 * Searches the first-party registry populated by approved owner and broker submissions.
 */
export class FirstPartyDirectAdapter implements IPropertyDataProviderAdapter {
  readonly id = 'griha_saathi_direct';
  readonly name = 'Griha Saathi first-party listing registry';
  readonly category = 'first_party_direct' as const;
  readonly targetRegions: TargetState[] = TARGET_REGIONS_LIST;

  isConfigured(): boolean {
    // The first-party platform registry is always active and available in the running system
    return true;
  }

  getStatus(): ProviderHealthStatus {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      targetRegions: this.targetRegions,
      configured: true,
      status: 'connected',
      statusMessage: 'First-party owner and broker submissions are searched after approval. No external rental feed is queried by this adapter.',
      requiredCredentials: [],
      documentationRef: '/docs/architecture.md#first-party-registry',
      lastCheckedAt: new Date().toISOString(),
    };
  }

  async fetchListings(query: PropertyQueryFilters): Promise<ProviderFetchResult> {
    const now = new Date().toISOString();
    let listings = Array.from(db.properties.values()).filter(isPubliclyDiscoverable);

    // 1. Publication Gate:
    // Only approved properties that are not drafts, withdrawn, or suspended are eligible.
    if (query.onlyVerified !== false) {
      listings = listings.filter(
        (p) => hasAuthoritativeVerificationEvidence(p)
      );
    }

    // 2. Geographic Filtering
    if (query.state && query.state !== 'all') {
      const targetState = query.state.trim().toLowerCase();
      listings = listings.filter((p) => (p.state || '').trim().toLowerCase() === targetState);
    }

    if (query.city && query.city.trim().length > 0) {
      const cityClean = query.city.trim().toLowerCase();
      listings = listings.filter((p) =>
        (p.city || '').toLowerCase().includes(cityClean) ||
        (p.locality || '').toLowerCase().includes(cityClean) ||
        (p.title || '').toLowerCase().includes(cityClean)
      );
    }

    if (query.locality && query.locality.trim().length > 0) {
      const locClean = query.locality.trim().toLowerCase();
      listings = listings.filter((p) =>
        (p.locality || '').toLowerCase().includes(locClean) ||
        (p.city || '').toLowerCase().includes(locClean) ||
        (p.title || '').toLowerCase().includes(locClean) ||
        (p.addressDetails || '').toLowerCase().includes(locClean)
      );
    }

    // 3. Property Category
    if (query.propertyType && query.propertyType !== 'all') {
      if (query.propertyType === '4bhk_plus') {
        listings = listings.filter((p) => (p.bedrooms || 0) >= 4);
      } else {
        listings = listings.filter((p) => (p.propertyType as string) === query.propertyType);
      }
    }

    // 4. Budget Range
    if (query.minRent !== undefined && !isNaN(query.minRent)) {
      listings = listings.filter((p) => p.rentPerMonth >= query.minRent!);
    }
    if (query.maxRent !== undefined && !isNaN(query.maxRent)) {
      listings = listings.filter((p) => p.rentPerMonth <= query.maxRent!);
    }

    // 5. Bedrooms
    if (query.bedrooms && query.bedrooms !== 'all') {
      const bNum = Number(query.bedrooms);
      if (!isNaN(bNum)) {
        if (bNum >= 4) {
          listings = listings.filter((p) => (p.bedrooms || 0) >= 4);
        } else {
          listings = listings.filter((p) => p.bedrooms === bNum);
        }
      }
    }

    // 6. Bathrooms
    if (query.bathrooms && query.bathrooms !== 'all') {
      const bathNum = Number(query.bathrooms);
      if (!isNaN(bathNum)) {
        listings = listings.filter((p) => (p.bathrooms || 0) >= bathNum);
      }
    }

    // 7. Furnishing
    if (query.furnishing && query.furnishing !== 'all') {
      listings = listings.filter((p) => p.furnishing === query.furnishing);
    }

    // 8. Tenant Preference
    if (query.preference && query.preference !== 'all') {
      listings = listings.filter((p) => p.tenantPreference === query.preference || p.tenantPreference === 'any');
    }

    // 9. Amenities
    if (query.amenities && query.amenities.length > 0) {
      listings = listings.filter((p) => {
        const propAmenities = (p.amenities || []).map((a) => a.toLowerCase().trim());
        return query.amenities!.every((a) => propAmenities.includes(a.toLowerCase().trim()));
      });
    }

    // 10. Data Source Filter
    if (query.dataSource && query.dataSource !== 'all') {
      listings = listings.filter((p) => p.dataSource === query.dataSource);
    }

    // 11. Freshness Policy (60 days max before availability confirmation lapses)
    if (query.confirmedAvailableOnly) {
      listings = listings.filter((p) => db.isFreshAvailability(p.availabilityConfirmedAt));
    }

    // 11. Normalize & Attach Provenance Contract (Directive 5)
    const normalized = listings.map((p) => {
      const isFresh = db.isFreshAvailability(p.availabilityConfirmedAt);
      const provenance: PropertyProvenance = {
        provider: this.id,
        providerName: this.name,
        providerListingId: p.id,
        sourceUrl: `/#find-property?id=${encodeURIComponent(p.id)}`,
        sourcePublishedAt: p.submittedAt || p.createdAt,
        sourceModifiedAt: p.updatedAt,
        lastRetrievedAt: now,
        lastSourceConfirmedAt: p.availabilityConfirmedAt,
        availabilityConfirmationStatus: isFresh ? 'confirmed' : 'unconfirmed',
        isFresh,
        verificationBreakdown: {
          hasTitleDeedCheck: Boolean(
            p.verificationRecord?.stages?.some((s) => s.stage === 'land_registry' && s.status === 'verified')
          ),
          hasPhysicalInspection: Boolean(
            p.verificationRecord?.stages?.some((s) => s.stage === 'physical_inspection' && s.status === 'verified')
          ),
          hasIdentityVerification: Boolean(
            p.verificationRecord?.stages?.some((s) => s.stage === 'owner_identity' && s.status === 'verified')
          ),
          notes: p.verificationRecord?.disclaimer,
        },
      };

      return {
        ...p,
        provider: this.id,
        providerListingId: p.id,
        sourceUrl: provenance.sourceUrl,
        sourcePublishedAt: provenance.sourcePublishedAt,
        sourceModifiedAt: provenance.sourceModifiedAt,
        lastRetrievedAt: now,
        lastSourceConfirmedAt: p.availabilityConfirmedAt,
        availabilityConfirmationStatus: provenance.availabilityConfirmationStatus,
        provenance,
      };
    });

    return {
      providerId: this.id,
      success: true,
      properties: normalized,
      totalMatches: normalized.length,
      isFallback: false,
    };
  }
}
