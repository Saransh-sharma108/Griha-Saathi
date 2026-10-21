/**
 * Griha Saathi - Shared TypeScript Domain Types & Interfaces
 * Phase 1 Foundation
 */

export type TargetState = 
  | 'Delhi'
  | 'Haryana'
  | 'Punjab'
  | 'Himachal Pradesh'
  | 'Jammu & Kashmir';

export interface RegionDefinition {
  state: TargetState;
  popularDistricts: string[];
  regulatoryAuthority: string; // e.g. "Delhi RERA", "Haryana RERA (HRERA)", "Punjab RERA"
  landRegistrySystem: string;  // e.g. "Jamabandi / Web-HALRIS", "PLRS", "Himbhoomi"
}

export type PropertyType = 
  | '1bhk'
  | '2bhk'
  | '3bhk'
  | '4bhk_plus'
  | 'independent_house'
  | 'studio'
  | 'pg_coliving'
  | 'villa';

export type TenantPreference = 
  | 'family'
  | 'bachelors'
  | 'working_professionals'
  | 'students'
  | 'any';

export type FurnishingStatus = 
  | 'unfurnished'
  | 'semi_furnished'
  | 'fully_furnished';

export type VerificationStatus = 
  | 'unverified'
  | 'pending_review'
  | 'document_verified'
  | 'physically_inspected'
  | 'authoritative_verified'
  | 'rejected';

export interface VerificationAuditItem {
  stage: 'land_registry' | 'physical_inspection' | 'owner_identity' | 'police_intimation';
  authorityName: string;
  status: 'pending' | 'in_progress' | 'verified' | 'failed' | 'not_initiated';
  details: string;
  verifiedAt?: string;
  evidenceHash?: string;
}

export interface VerificationRecord {
  propertyId?: string;
  status: VerificationStatus;
  overallScore?: number;
  stages: VerificationAuditItem[];
  verifiedAt?: string;
  authorizedInspectorId?: string;
  disclaimer: string;
}

export type ListingSubmissionStatus = 
  | 'draft'
  | 'not_submitted'
  | 'submitted'
  | 'pending_verification'
  | 'under_review'
  | 'additional_information_required'
  | 'correction_requested'
  | 'resubmitted'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'withdrawn'
  | 'suspended';

export type VerificationBadgeType = 
  | 'contact_verified'
  | 'documents_reviewed'
  | 'details_reviewed'
  | 'physical_inspection_completed'
  | 'availability_confirmed'
  | 'verification_pending'
  | 'additional_info_required'
  | 'suspended';

export interface VerificationBadge {
  id: string;
  type: VerificationBadgeType;
  label: string;
  description: string;
  checkedAt?: string;
  limitations: string;
  isPositive: boolean;
}

export interface VerificationChecklistItem {
  id: string;
  category: 'identity_authority' | 'property_documents' | 'listing_consistency' | 'availability_status' | 'physical_inspection';
  title: string;
  description: string;
  status: 'passed' | 'failed' | 'needs_info' | 'pending' | 'not_applicable';
  checkedAt?: string;
  checkedBy?: string;
  notes?: string;
}

export interface RiskIndicator {
  code: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  field?: string;
}

export interface DuplicateListingWarning {
  matchedPropertyId: string;
  matchedTitle: string;
  similarityScore: number;
  reasons: string[];
}

export interface VerificationChecklist {
  submitterIdentityVerified: boolean;
  authorityDeclared: string;
  authorityEvidenceReviewed: boolean;
  documentsReviewedCount: number;
  totalDocumentsCount: number;
  consistencyChecksPassed: boolean;
  riskFlags: RiskIndicator[];
  duplicateWarnings: DuplicateListingWarning[];
  availabilityConfirmedRecently: boolean;
  physicalInspectionPerformed: boolean;
  items: VerificationChecklistItem[];
  lastUpdated: string;
}

export type FraudReportReason = 
  | 'suspected_fake'
  | 'misrepresented_rent'
  | 'unauthorized_listing'
  | 'suspicious_payment'
  | 'misleading_photos'
  | 'duplicate_listing'
  | 'impersonation_fraud'
  | 'other';

export type FraudReportStatus = 'pending' | 'under_investigation' | 'action_taken' | 'dismissed';

export interface FraudReport {
  id: string;
  propertyId: string;
  reporterId: string; // Internal only, scrubbed from public queries
  reporterMaskedContact?: string;
  reason: FraudReportReason;
  description: string;
  status: FraudReportStatus;
  moderatorNotes?: string;
  moderatorAction?: 'none' | 'warning_issued' | 'listing_suspended' | 'owner_banned';
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListingAppeal {
  id: string;
  propertyId: string;
  ownerId: string;
  reason: string;
  supportingDocumentUrls?: string[];
  status: 'pending' | 'under_review' | 'accepted' | 'rejected';
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export type NotificationType = 
  | 'submission' 
  | 'review' 
  | 'correction' 
  | 'approval' 
  | 'rejection' 
  | 'suspension' 
  | 'appeal' 
  | 'freshness'
  | 'connection_request'
  | 'connection_accepted'
  | 'connection_declined'
  | 'new_message'
  | 'visit_requested'
  | 'visit_confirmed'
  | 'visit_declined'
  | 'visit_rescheduled'
  | 'visit_cancelled'
  | 'saved_search_alert'
  | 'security_alert'
  | 'expiry'
  | 'availability_reminder';

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedPropertyId?: string;
  relatedConnectionId?: string;
  relatedVisitId?: string;
  relatedSearchId?: string;
  isRead: boolean;
  createdAt: string;
}

export type DeclaredAuthority = 
  | 'sole_owner'
  | 'authorized_co_owner'
  | 'licensed_broker'
  | 'builder_representative'
  | 'property_manager'
  | 'authorized_sublessor'
  | 'owner'
  | 'agent'
  | 'builder'
  | 'tenant';

export interface PropertyMediaItem {
  id: string;
  url: string;
  filename: string;
  originalFilename?: string;
  fileSize: number;
  mimeType: string;
  isPrimary?: boolean;
  uploadedAt: string;
}

export interface PropertyDocumentItem {
  id: string;
  documentType: 'title_deed' | 'sale_deed' | 'jamabandi' | 'property_tax_receipt' | 'tax_receipt' | 'power_of_attorney' | 'lease_agreement' | 'authority_letter' | 'other' | string;
  filename: string;
  originalFilename?: string;
  fileSize: number;
  mimeType: string;
  documentHash: string; // SHA-256 integrity hash
  sha256Hash?: string;
  uploadedAt: string;
  status: 'pending_review' | 'verified' | 'rejected';
  accessRole: 'owner_and_verifier_only';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface StatusHistoryEntry {
  id: string;
  fromStatus: ListingSubmissionStatus;
  toStatus: ListingSubmissionStatus;
  changedBy: string;
  changedAt: string;
  reason?: string;
  comments?: string;
}

export interface ReviewerQueueSummary {
  totalPending: number;
  underReview: number;
  needsInfo: number;
  resubmitted: number;
  suspended: number;
  totalReports: number;
  pendingReports: number;
  items: Property[];
  reports: FraudReport[];
}

export interface ListingDraft {
  id: string;
  userId: string;
  currentStep: number;
  data: Partial<Property> & Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  state: TargetState;
  city: string;
  locality: string;
  pincode: string;
  addressDetails?: string;
  propertyType: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  areaSqFt?: number;
  floorNumber?: number;
  totalFloors?: number;
  rentPerMonth: number;
  securityDeposit: number;
  maintenanceCharges?: number;
  leaseTerms?: string;
  furnishing: FurnishingStatus;
  tenantPreference: TenantPreference;
  amenities: string[];
  photos: string[];
  mediaItems?: PropertyMediaItem[];
  documents?: PropertyDocumentItem[];
  verificationStatus: VerificationStatus;
  submissionStatus?: ListingSubmissionStatus;
  statusHistory?: StatusHistoryEntry[];
  correctionNotes?: string;
  correctionRequestedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  withdrawnAt?: string;
  declaredAuthority?: DeclaredAuthority;
  verificationRecord?: VerificationRecord;
  ownerId: string;
  ownerMaskedContact?: string;
  availableFrom: string;
  availabilityStatus?: 'available' | 'under_maintenance' | 'occupied';
  availabilityConfirmedAt?: string;
  isAvailabilityConfirmed?: boolean;
  isAvailable?: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  updatedAt: string;
  dataSource: 'owner_submission' | 'authorized_registry' | 'licensed_agent';
  // Provenance & Real-World Integration Contracts (Directives 4, 5 & 6)
  provider?: string;
  providerListingId?: string;
  sourceUrl?: string;
  sourcePublishedAt?: string;
  sourceModifiedAt?: string;
  lastRetrievedAt?: string;
  lastSourceConfirmedAt?: string;
  availabilityConfirmationStatus?: 'confirmed' | 'reported_by_source' | 'unconfirmed' | 'withdrawn';
  provenance?: PropertyProvenance;
}

export interface PropertyProvenance {
  provider: string; // e.g. 'griha_saathi_direct', 'data_gov_in', 'state_rera_registry', 'partner_syndication'
  providerName: string;
  providerListingId: string;
  sourceUrl: string;
  sourcePublishedAt?: string;
  sourceModifiedAt?: string;
  lastRetrievedAt: string;
  lastSourceConfirmedAt?: string;
  availabilityConfirmationStatus: 'confirmed' | 'reported_by_source' | 'unconfirmed' | 'withdrawn';
  isFresh: boolean;
  verificationBreakdown: {
    hasTitleDeedCheck: boolean;
    hasPhysicalInspection: boolean;
    hasIdentityVerification: boolean;
    notes?: string;
  };
}

export type RegionalCoverageStatus = 
  | 'connected'
  | 'connected_no_listings'
  | 'awaiting_credentials'
  | 'temporarily_unavailable'
  | 'unsupported';

export interface RegionalStatusReport {
  region: TargetState;
  status: RegionalCoverageStatus;
  statusLabel: string;
  connectedProviders: string[];
  activeListingCount: number;
  lastCheckedAt: string;
  freshnessWindowDays: number;
  limitations: string;
  availablePropertyTypes: string[];
  documentationRef?: string;
}

export interface RegionalCoverageMatrix {
  timestamp: string;
  totalRegions: number;
  connectedRegionsCount: number;
  totalGenuineListings: number;
  zeroSyntheticPolicyEnforced: boolean;
  regions: Record<TargetState, RegionalStatusReport>;
  disclaimer: string;
}

export interface OwnerListingSummary {
  total: number;
  drafts: number;
  submitted: number;
  underReview: number;
  correctionRequested: number;
  approved: number;
  rejectedOrExpired: number;
  withdrawn: number;
  suspended: number;
  listings: Property[];
  draftsList: ListingDraft[];
}

export interface SavedPropertyRecord {
  id: string;
  userId: string;
  propertyId: string;
  savedAt: string;
  property?: Property;
}

export type PropertySortOption = 
  | 'verified_first' 
  | 'rent_asc' 
  | 'rent_desc' 
  | 'newest';

export interface PropertySearchParams {
  state?: string;
  city?: string;
  locality?: string;
  propertyType?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnishing?: string;
  tenantPreference?: string;
  amenities?: string[];
  availableFrom?: string;
  dataSource?: string;
  verificationStatus?: string;
  onlyVerified?: boolean;
  sortBy?: PropertySortOption;
  page?: number;
  limit?: number;
}

export interface PropertySearchResult {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  properties: Property[];
  metadata: {
    appliedFilters: Record<string, any>;
    stalePolicyDays: number;
    targetStates: TargetState[];
    realDataOnly: boolean;
    providerConnectedCount: number;
    providerUnconfiguredCount: number;
  };
}

export type UserRole = 
  | 'tenant' 
  | 'owner' 
  | 'agent' 
  | 'builder' 
  | 'property_manager' 
  | 'verifier' 
  | 'field_verifier'
  | 'admin';

export interface NotificationPreferences {
  emailAlerts: boolean;
  smsAlerts: boolean;
  propertyInquiries: boolean;
  securityAlerts: boolean;
  savedSearchAlerts?: boolean;
}

export interface SecurityAuditItem {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface SessionInfo {
  tokenPreview: string;
  isCurrent: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface UserProfile {
  id: string;
  identifier: string; // Masked on frontend
  phone?: string;     // Masked phone if available
  email?: string;     // Masked email if available
  role: UserRole;     // Backward-compatible alias for activeRole
  activeRole: UserRole;
  roles: UserRole[];  // Multi-roles held by this account
  fullName?: string;  // User-provided only
  avatarUrl?: string;
  preferredLanguage?: SupportedLanguage;
  notificationPreferences?: NotificationPreferences;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isIdentityVerified: boolean;
  isDeactivated?: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  pinChangedAt?: string;
}

export interface SavedSearchFilters {
  state?: TargetState | 'all';
  city?: string;
  locality?: string;
  propertyType?: PropertyType | 'all';
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  furnishing?: FurnishingStatus | 'any';
  onlyVerified?: boolean;
}

export interface SavedSearchRecord {
  id: string;
  userId: string;
  name: string;
  filters: SavedSearchFilters;
  alertFrequency: 'instant' | 'daily' | 'weekly' | 'none';
  lastAlertSentAt?: string;
  notifiedPropertyIds?: string[];
  matchedCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerPerformanceAnalytics {
  totalListings: number;
  activeApprovedListings: number;
  expiredOrStaleListings: number;
  draftListings: number;
  underReviewListings: number;
  totalGenuineViews: number;
  totalInquiries: number;
  totalVisitRequests: number;
  confirmedVisitsCount: number;
  verificationStatusBreakdown: {
    authoritative_verified: number;
    physically_inspected: number;
    document_verified: number;
    pending_review: number;
    rejected: number;
    suspended: number;
    unverified: number;
  };
  metricsDisclaimer: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  token?: string;
}

export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'blocked';

export interface ConnectionRequest {
  id: string;
  propertyId: string;
  senderId: string;
  tenantId: string; // Requester
  recipientId: string;
  ownerId: string; // Target listing owner / representative
  status: ConnectionStatus;
  tenantNote?: string;
  declinedReason?: string;
  cancelledReason?: string;
  blockedBy?: string;
  createdAt: string;
  updatedAt: string;
  propertyPreview?: {
    id: string;
    title: string;
    locality: string;
    city: string;
    state: string;
    rentPerMonth: number;
    photoUrl?: string;
    isAvailable: boolean;
  };
  senderProfile?: {
    id: string;
    fullName?: string;
    identifier: string;
    role: UserRole;
    isPhoneVerified: boolean;
  };
  recipientProfile?: {
    id: string;
    fullName?: string;
    identifier: string;
    role: UserRole;
    isPhoneVerified: boolean;
  };
  lastMessage?: ConversationMessage;
  unreadCount?: number;
}

export interface ConversationMessage {
  id: string;
  connectionId: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;
  isRead?: boolean;
  readAt?: string;
  isReported?: boolean;
  reportReason?: string;
}

export type PropertyVisitStatus = 'pending' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled';

export interface VisitStatusHistoryEntry {
  fromStatus: PropertyVisitStatus;
  toStatus: PropertyVisitStatus;
  changedBy: string;
  changedAt: string;
  note?: string;
}

export interface PropertyVisit {
  id: string;
  connectionId: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  visitDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:00 AM - 11:00 AM"
  notes?: string;
  status: PropertyVisitStatus;
  proposedAlternativeSlot?: {
    visitDate: string;
    timeSlot: string;
    note?: string;
  };
  cancellationReason?: string;
  cancelledBy?: string;
  statusHistory: VisitStatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  propertyPreview?: {
    id: string;
    title: string;
    locality: string;
    city: string;
    state: string;
    rentPerMonth: number;
    photoUrl?: string;
    isAvailable: boolean;
  };
  tenantProfile?: {
    id: string;
    fullName?: string;
    identifier: string;
    role: UserRole;
  };
  ownerProfile?: {
    id: string;
    fullName?: string;
    identifier: string;
    role: UserRole;
  };
}

export interface BlockedUserRecord {
  id: string;
  userId: string;
  blockedUserId: string;
  reason?: string;
  createdAt: string;
}

export interface ProviderIntegrationStatus {
  id: string;
  name: string;
  category: 'sms_email' | 'land_registry' | 'identity_digilocker' | 'rera' | 'cersai';
  targetRegions: TargetState[];
  configured: boolean;
  statusMessage: string;
  requiredCredentials: string[];
  documentationRef: string;
}

export type SaathiAiIntent = 
  | 'property_search'
  | 'property_comparison'
  | 'renting_guidance'
  | 'buying_guidance'
  | 'verification_info'
  | 'fraud_safety'
  | 'platform_help'
  | 'missing_info_followup'
  | 'general_query';

export interface SaathiSearchFilters {
  state?: TargetState | 'all';
  city?: string;
  locality?: string;
  propertyType?: PropertyType | 'all';
  transactionType?: 'rent' | 'buy' | 'any';
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnishing?: FurnishingStatus | 'any';
  amenities?: string[];
  onlyVerified?: boolean;
}

export interface SaathiPropertyCard {
  id: string;
  title: string;
  propertyType: string;
  transactionType: 'rent' | 'buy';
  city: string;
  locality: string;
  state: TargetState;
  rentPerMonth: number;
  securityDeposit?: number;
  bedrooms: number;
  bathrooms?: number;
  areaSqFt?: number;
  furnishing: string;
  verificationStatus: string;
  isFresh: boolean;
  availableFrom?: string;
  primaryPhotoUrl?: string;
  matchRationale: string;
  objectiveFacts: string[];
  ownerMaskedContact?: string;
}

export interface PropertyComparisonItem {
  propertyId: string;
  title: string;
  rentOrPrice: string;
  propertyType: string;
  area: string;
  bedrooms: string;
  bathrooms: string;
  furnishing: string;
  amenities: string[];
  location: string;
  availability: string;
  verificationStatus: string;
  lastUpdated: string;
}

export type SaathiActionType = 
  | 'view_details'
  | 'apply_search_filters'
  | 'save_property'
  | 'request_connection'
  | 'schedule_visit'
  | 'compare_properties';

export interface SaathiActionSuggestion {
  id: string;
  type: SaathiActionType;
  label: string;
  description?: string;
  payload: Record<string, any>;
  requiresConfirmation: boolean;
}

export interface SaathiProviderStatus {
  provider: 'gemini' | 'deterministic_rules';
  configured: boolean;
  apiKeyPresent: boolean;
  modelName?: string;
  statusMessage: string;
  notice: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  intent?: SaathiAiIntent;
  suggestedFilters?: SaathiSearchFilters;
  properties?: SaathiPropertyCard[];
  comparisonTable?: PropertyComparisonItem[];
  actions?: SaathiActionSuggestion[];
  followUpQuestion?: string;
  guidanceTopic?: string;
  disclaimerNote?: string;
  providerInfo?: SaathiProviderStatus;
  relatedEntities?: {
    verifiedPropertyCount: number;
    legalReference?: string;
  };
}

export type SupportedLanguage = 'en' | 'hi' | 'hi-en';

// ==============================================================================
// HOME DNA STUDIO DOMAIN TYPES
// ==============================================================================

export interface HomeDnaPreferences {
  /** Relative flexibility on price/rent (0-100%). Default: 45%. Does not change maximum budget. */
  budgetFlexibility: number;
  /** Importance of living space and carpet area (0-100%). Default: 65%. */
  livingSpacePriority: number;
  /** Importance of chosen locality anchor vs surrounding areas (0-100%). Default: 80%. */
  locationPriority: number;
}

export interface HomeDnaRequirements {
  /** Transaction intent: Rent or Buy */
  intent: 'rent' | 'buy';
  /** Target region jurisdiction */
  state: TargetState | 'all';
  /** Optional preferred locality or neighborhood */
  locality?: string;
  /** Configuration or property type */
  propertyType: PropertyType | 'all';
  /** User-stated maximum budget ceiling in INR */
  maxBudget?: number;
  /** Minimum bedroom requirement */
  minBedrooms?: number;
  /** Minimum carpet area requirement in sq.ft */
  minAreaSqFt?: number;
  /** Furnishing preference */
  furnishing?: FurnishingStatus | 'any';
}

export type HomeDnaRatingLabel = 
  | 'Exceptional Match' 
  | 'Strong Priority Fit' 
  | 'Balanced Match' 
  | 'Alternative Option';

export interface HomeDnaDimensionScores {
  budgetFit: number;   // 0 - 100
  spaceFit: number;    // 0 - 100
  locationFit: number; // 0 - 100
}

export interface HomeDnaMatchResult {
  property: Property;
  matchScore: number;  // 0 - 100
  ratingLabel: HomeDnaRatingLabel;
  dimensionScores: HomeDnaDimensionScores;
  normalizedWeights: {
    budgetWeight: number;
    spaceWeight: number;
    locationWeight: number;
  };
  evidenceReasons: string[];
  tradeOffs: string[];
  isHardConstraintViolated: boolean;
  hardConstraintNotes: string[];
}

export interface HomeDnaSummaryDescriptor {
  budgetDescriptor: string;
  spaceDescriptor: string;
  locationDescriptor: string;
  tradeoffInsight: string;
}

