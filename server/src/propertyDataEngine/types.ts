import { Property, TargetState, RegionalCoverageStatus, RegionalStatusReport, RegionalCoverageMatrix } from '../../../shared/types.js';

export interface ProviderHealthStatus {
  id: string;
  name: string;
  category: 'first_party_direct' | 'open_data_gov' | 'state_rera' | 'partner_syndication';
  targetRegions: TargetState[];
  configured: boolean;
  status: 'connected' | 'awaiting_credentials' | 'temporarily_unavailable' | 'unsupported';
  statusMessage: string;
  requiredCredentials: string[];
  documentationRef: string;
  lastCheckedAt: string;
}

export interface PropertyQueryFilters {
  state?: TargetState | 'all';
  city?: string;
  locality?: string;
  propertyType?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number | string;
  bathrooms?: number | string;
  furnishing?: string;
  preference?: string;
  amenities?: string[];
  availableFrom?: string;
  dataSource?: string;
  onlyVerified?: boolean;
  confirmedAvailableOnly?: boolean;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface ProviderFetchResult {
  providerId: string;
  success: boolean;
  properties: Property[];
  totalMatches: number;
  statusMessage?: string;
  isFallback: false; // Strictly false. Fallback to synthetic listings is prohibited by Directive 0.
}

export interface IPropertyDataProviderAdapter {
  readonly id: string;
  readonly name: string;
  readonly category: 'first_party_direct' | 'open_data_gov' | 'state_rera' | 'partner_syndication';
  readonly targetRegions: TargetState[];

  isConfigured(): boolean;
  getStatus(): ProviderHealthStatus;
  fetchListings(query: PropertyQueryFilters): Promise<ProviderFetchResult>;
}
