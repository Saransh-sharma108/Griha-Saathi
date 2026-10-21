/**
 * Griha Saathi - Property Verification & Trust Service
 * Phase 6 Implementation
 * Strict Data Integrity: Zero synthetic scores, zero fabricated approvals,
 * and transparent, granular verification badges reflecting actual backend state.
 */

import {
  Property,
  UserProfile,
  VerificationBadge,
  VerificationChecklist,
  VerificationChecklistItem,
  RiskIndicator,
  DuplicateListingWarning,
  PropertyDocumentItem,
} from '../../shared/types.js';

export class VerificationService {
  /**
   * Evaluates the complete, transparent verification checklist for a listing.
   * Compares submitter account status, uploaded documents, consistency, and duplicate indicators.
   */
  public static computeVerificationChecklist(
    property: Property,
    ownerUser?: UserProfile | null,
    allProperties: Property[] = []
  ): VerificationChecklist {
    const items: VerificationChecklistItem[] = [];
    const riskFlags = this.detectRiskFlags(property);
    const duplicateWarnings = this.detectDuplicateListings(property, allProperties);

    // 1. Submitter Identity & Authority
    const isContactVerified = Boolean(ownerUser?.isPhoneVerified || ownerUser?.isEmailVerified);
    const declaredAuth = property.declaredAuthority || 'sole_owner';
    const hasAuthEvidence = (property.documents || []).some(
      (d: PropertyDocumentItem) =>
        d.status === 'verified' &&
        (d.documentType === 'title_deed' ||
          d.documentType === 'sale_deed' ||
          d.documentType === 'jamabandi' ||
          d.documentType === 'power_of_attorney' ||
          d.documentType === 'authority_letter' ||
          d.documentType === 'sublease_agreement')
    );

    items.push({
      id: 'chk_submitter_identity',
      category: 'identity_authority',
      title: 'Submitter Contact Verification',
      description: isContactVerified
        ? `Submitter contact identifier (${ownerUser?.identifier || 'Registered user'}) verified via OTP challenge.`
        : 'Submitter contact verification pending.',
      status: isContactVerified ? 'passed' : 'needs_info',
      checkedAt: ownerUser?.createdAt || property.createdAt,
      notes: isContactVerified ? 'Verified account identifier.' : 'Contact must be verified before approval.',
    });

    items.push({
      id: 'chk_submitter_authority',
      category: 'identity_authority',
      title: 'Authority to Advertise Listing',
      description: `Declared authority: ${declaredAuth.replace(/_/g, ' ').toUpperCase()}. ${
        hasAuthEvidence ? 'Supporting authorization document has been reviewed and verified.' : 'Authorization document pending verification.'
      }`,
      status: hasAuthEvidence ? 'passed' : property.documents && property.documents.length > 0 ? 'pending' : 'needs_info',
      checkedAt: property.updatedAt,
      notes: hasAuthEvidence ? 'Verified authorization proof.' : 'Submitter must provide verified documentation of authority.',
    });

    // 2. Property Documents
    const totalDocs = property.documents ? property.documents.length : 0;
    const verifiedDocs = property.documents ? property.documents.filter((d: PropertyDocumentItem) => d.status === 'verified').length : 0;
    const rejectedDocs = property.documents ? property.documents.filter((d: PropertyDocumentItem) => d.status === 'rejected').length : 0;

    items.push({
      id: 'chk_documents_review',
      category: 'property_documents',
      title: 'Property Ownership / Authorization Documents',
      description:
        totalDocs === 0
          ? 'No ownership or authorization documents submitted yet.'
          : `${verifiedDocs} of ${totalDocs} submitted document(s) verified by platform reviewers.${
              rejectedDocs > 0 ? ` (${rejectedDocs} document(s) rejected).` : ''
            }`,
      status: verifiedDocs > 0 ? 'passed' : totalDocs > 0 ? (rejectedDocs > 0 ? 'failed' : 'pending') : 'needs_info',
      checkedAt: property.updatedAt,
      notes: totalDocs > 0 ? 'Documents inspected for validity.' : 'Mandatory ownership documents required.',
    });

    // 3. Listing Consistency
    const hasConsistencyErrors = riskFlags.some((r) => r.severity === 'high');
    items.push({
      id: 'chk_listing_consistency',
      category: 'listing_consistency',
      title: 'Listing Specifications & Pricing Sanity',
      description: hasConsistencyErrors
        ? `Inconsistencies detected: ${riskFlags.map((r) => r.message).join('; ')}`
        : 'Property details, rent, and location format are consistent with regional norms.',
      status: hasConsistencyErrors ? 'failed' : riskFlags.length > 0 ? 'needs_info' : 'passed',
      checkedAt: property.updatedAt,
    });

    // 4. Duplicate Screening
    const hasDuplicateCollision = duplicateWarnings.length > 0;
    items.push({
      id: 'chk_duplicate_screening',
      category: 'listing_consistency',
      title: 'Duplicate & Reused Media Screening',
      description: hasDuplicateCollision
        ? `Potential collision detected with ${duplicateWarnings.length} other listing(s).`
        : 'No duplicate property or photo collision detected.',
      status: hasDuplicateCollision ? 'needs_info' : 'passed',
      checkedAt: property.updatedAt,
      notes: hasDuplicateCollision ? 'Review duplicate warnings before approving.' : undefined,
    });

    // 5. 60-Day Availability Status
    const confirmedTime = Date.parse(property.availabilityConfirmedAt || '');
    const isAvailabilityRecent = !isNaN(confirmedTime) && (Date.now() - confirmedTime) / (1000 * 60 * 60 * 24) <= 60;

    items.push({
      id: 'chk_availability_freshness',
      category: 'availability_status',
      title: '60-Day Availability Reconfirmation',
      description: isAvailabilityRecent
        ? `Availability confirmed within active window (${new Date(property.availabilityConfirmedAt!).toLocaleDateString()}).`
        : 'Availability confirmation expired or overdue. Listing requires reconfirmation by owner.',
      status: isAvailabilityRecent ? 'passed' : 'needs_info',
      checkedAt: property.availabilityConfirmedAt,
    });

    // 6. Physical Inspection
    const isPhysicallyInspected = property.verificationStatus === 'physically_inspected';
    items.push({
      id: 'chk_physical_inspection',
      category: 'physical_inspection',
      title: 'Physical On-Site Inspection',
      description: isPhysicallyInspected
        ? 'Physical on-site inspection conducted and certified by an authorized field inspector.'
        : 'Physical on-site inspection has not been performed for this property.',
      status: isPhysicallyInspected ? 'passed' : 'not_applicable',
      checkedAt: property.verificationRecord?.verifiedAt,
    });

    return {
      submitterIdentityVerified: isContactVerified,
      authorityDeclared: declaredAuth,
      authorityEvidenceReviewed: hasAuthEvidence,
      documentsReviewedCount: verifiedDocs,
      totalDocumentsCount: totalDocs,
      consistencyChecksPassed: !hasConsistencyErrors,
      riskFlags,
      duplicateWarnings,
      availabilityConfirmedRecently: isAvailabilityRecent,
      physicalInspectionPerformed: isPhysicallyInspected,
      items,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Derives truthful, specific verification badges strictly from actual backend records.
   * Never displays a generic or misleading "100% verified" badge.
   */
  public static deriveVerificationBadges(
    property: Property,
    checklist: VerificationChecklist
  ): VerificationBadge[] {
    const badges: VerificationBadge[] = [];

    // 1. Suspension Check
    if (property.submissionStatus === 'suspended') {
      badges.push({
        id: 'badge_suspended',
        type: 'suspended',
        label: 'Listing Suspended',
        description: 'Listing temporarily suspended pending verification review or policy compliance check.',
        checkedAt: property.updatedAt,
        limitations: 'Unavailable for inquiries or viewing.',
        isPositive: false,
      });
      return badges;
    }

    // 2. Contact Verified Badge
    if (checklist.submitterIdentityVerified) {
      badges.push({
        id: 'badge_contact_verified',
        type: 'contact_verified',
        label: 'Contact Verified',
        description: 'Submitter phone or email has been authenticated via OTP challenge.',
        checkedAt: property.createdAt,
        limitations: 'Verifies account access only; does not establish legal property ownership.',
        isPositive: true,
      });
    }

    // 3. Authorization Documents Reviewed Badge
    if (checklist.documentsReviewedCount > 0) {
      badges.push({
        id: 'badge_docs_reviewed',
        type: 'documents_reviewed',
        label: 'Documents Reviewed',
        description: `${checklist.documentsReviewedCount} ownership or authority document(s) reviewed by platform staff.`,
        checkedAt: property.updatedAt,
        limitations: 'Administrative review of submitted copies; does not constitute a title guarantee under the Transfer of Property Act 1882.',
        isPositive: true,
      });
    }

    // 4. Details Reviewed Badge
    if (
      property.submissionStatus === 'approved' &&
      checklist.consistencyChecksPassed
    ) {
      badges.push({
        id: 'badge_details_reviewed',
        type: 'details_reviewed',
        label: 'Property Details Reviewed',
        description: 'Specifications, pricing, and regional guidelines verified by authorized reviewers.',
        checkedAt: property.approvedAt || property.updatedAt,
        limitations: 'Based on disclosures, document cross-referencing, and state registry guidelines.',
        isPositive: true,
      });
    }

    // 5. Physical Inspection Completed Badge (ONLY if actually performed!)
    if (checklist.physicalInspectionPerformed) {
      badges.push({
        id: 'badge_physical_inspection',
        type: 'physical_inspection_completed',
        label: 'Physical Inspection Completed',
        description: 'On-site physical inspection performed and certified by an authorized field verifier.',
        checkedAt: property.verificationRecord?.verifiedAt,
        limitations: 'Reflects condition observed on the inspection date; does not guarantee future maintenance.',
        isPositive: true,
      });
    }

    // 6. Availability Recently Confirmed Badge
    if (checklist.availabilityConfirmedRecently) {
      badges.push({
        id: 'badge_availability_confirmed',
        type: 'availability_confirmed',
        label: 'Availability Confirmed',
        description: 'Owner confirmed availability within the standard 60-day window.',
        checkedAt: property.availabilityConfirmedAt,
        limitations: 'Subject to prior lease execution between owner and prospective tenants.',
        isPositive: true,
      });
    }

    // 7. Additional Information Required / Verification Pending (if not yet approved)
    if (
      property.submissionStatus === 'correction_requested' ||
      property.submissionStatus === 'additional_information_required'
    ) {
      badges.push({
        id: 'badge_additional_info',
        type: 'additional_info_required',
        label: 'Additional Info Required',
        description: 'Platform reviewers requested clarifications or updated documents from the submitter.',
        checkedAt: property.correctionRequestedAt,
        limitations: 'Listing is pending corrections before review decision.',
        isPositive: false,
      });
    } else if (
      property.submissionStatus === 'submitted' ||
      property.submissionStatus === 'resubmitted' ||
      property.submissionStatus === 'under_review' ||
      property.submissionStatus === 'pending_verification'
    ) {
      badges.push({
        id: 'badge_verification_pending',
        type: 'verification_pending',
        label: 'Verification Pending',
        description: 'Listing has been submitted and is currently queued in the verification workspace.',
        checkedAt: property.submittedAt,
        limitations: 'Not yet verified or published to general public search.',
        isPositive: false,
      });
    }

    return badges;
  }

  /**
   * Automated risk indicator detection (Pricing, specs, and geographic bounds).
   */
  public static detectRiskFlags(property: Property): RiskIndicator[] {
    const flags: RiskIndicator[] = [];

    // Rent sanity
    if (property.rentPerMonth <= 0) {
      flags.push({
        code: 'RENT_ZERO_OR_NEGATIVE',
        severity: 'high',
        message: 'Monthly rent must be a positive amount.',
        field: 'rentPerMonth',
      });
    } else if (property.rentPerMonth < 1000) {
      flags.push({
        code: 'RENT_SUSPICIOUSLY_LOW',
        severity: 'medium',
        message: `Monthly rent of ₹${property.rentPerMonth} is unusually low for rental accommodations.`,
        field: 'rentPerMonth',
      });
    } else if (property.rentPerMonth > 2000000) {
      flags.push({
        code: 'RENT_EXTREMELY_HIGH',
        severity: 'medium',
        message: `Monthly rent of ₹${property.rentPerMonth} exceeds standard residential bounds.`,
        field: 'rentPerMonth',
      });
    }

    // Security deposit sanity
    if (property.securityDeposit < 0) {
      flags.push({
        code: 'DEPOSIT_NEGATIVE',
        severity: 'high',
        message: 'Security deposit cannot be negative.',
        field: 'securityDeposit',
      });
    } else if (property.securityDeposit > property.rentPerMonth * 12) {
      flags.push({
        code: 'DEPOSIT_DISPROPORTIONATE',
        severity: 'medium',
        message: 'Security deposit exceeds 12 months of rent; verify local tenancy law limits.',
        field: 'securityDeposit',
      });
    }

    // Area sanity
    if (property.areaSqFt !== undefined && property.areaSqFt <= 0) {
      flags.push({
        code: 'AREA_INVALID',
        severity: 'high',
        message: 'Carpet area must be greater than zero.',
        field: 'areaSqFt',
      });
    }

    // PIN code sanity (6-digit Indian PIN)
    if (!/^\d{6}$/.test(property.pincode)) {
      flags.push({
        code: 'PINCODE_INVALID_FORMAT',
        severity: 'high',
        message: 'Invalid Indian PIN code format (must be 6 digits).',
        field: 'pincode',
      });
    }

    // Photos sanity
    if (!property.photos || property.photos.length === 0) {
      flags.push({
        code: 'NO_PHOTOS_SUBMITTED',
        severity: 'medium',
        message: 'Listing does not contain any genuine property photographs.',
        field: 'photos',
      });
    }

    return flags;
  }

  /**
   * Cross-listing duplicate screening.
   * Compares location, room specs, rent proximity, and photo collisions.
   */
  public static detectDuplicateListings(
    target: Property,
    allProperties: Property[]
  ): DuplicateListingWarning[] {
    const warnings: DuplicateListingWarning[] = [];

    for (const other of allProperties) {
      // Skip self
      if (other.id === target.id) continue;
      // Skip same owner (different listings by same owner are handled separately)
      if (other.ownerId === target.ownerId) continue;

      const reasons: string[] = [];
      let similarityScore = 0;

      // 1. Same locality and city
      const sameLocality =
        other.locality.trim().toLowerCase() === target.locality.trim().toLowerCase() &&
        other.city.trim().toLowerCase() === target.city.trim().toLowerCase() &&
        other.state === target.state;

      if (sameLocality) {
        similarityScore += 35;
        reasons.push('Identical state, city, and locality');
      }

      // 2. Same property type and bedrooms
      if (other.propertyType === target.propertyType && other.bedrooms === target.bedrooms) {
        similarityScore += 25;
        reasons.push(`Matching unit type (${target.propertyType}) and ${target.bedrooms || 0} BHK`);
      }

      // 3. Rent proximity within 5%
      if (target.rentPerMonth > 0 && other.rentPerMonth > 0) {
        const rentDiffPercent = Math.abs(target.rentPerMonth - other.rentPerMonth) / target.rentPerMonth;
        if (rentDiffPercent <= 0.05) {
          similarityScore += 25;
          reasons.push(`Rent proximity within 5% (₹${other.rentPerMonth} vs ₹${target.rentPerMonth})`);
        }
      }

      // 4. Photo filename/URL collision
      if (target.photos && other.photos) {
        const matchingPhotos = target.photos.filter((p: string) => other.photos.includes(p));
        if (matchingPhotos.length > 0) {
          similarityScore += 40;
          reasons.push(`${matchingPhotos.length} matching photo URL(s) detected across different owners`);
        }
      }

      if (similarityScore >= 60) {
        warnings.push({
          matchedPropertyId: other.id,
          matchedTitle: other.title,
          similarityScore: Math.min(100, similarityScore),
          reasons,
        });
      }
    }

    return warnings;
  }
}

export const computeVerificationChecklist = VerificationService.computeVerificationChecklist.bind(VerificationService);
export const deriveVerificationBadges = VerificationService.deriveVerificationBadges.bind(VerificationService);
export const detectRiskFlags = VerificationService.detectRiskFlags.bind(VerificationService);
export const detectDuplicateListings = VerificationService.detectDuplicateListings.bind(VerificationService);

