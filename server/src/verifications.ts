import { Router, Request, Response } from 'express';
import { db } from './db.js';
import { VerificationService } from './verificationService.js';
import { requireAuth, requireRole, AuthenticatedRequest } from './middleware.js';
import { ListingSubmissionStatus, UserRole, DuplicateListingWarning } from '../../shared/types.js';

export const verificationsRouter = Router();

/**
 * GET /api/verifications/overview
 * Overview of verification methodology and standards
 */
verificationsRouter.get('/overview', (req: Request, res: Response) => {
  return res.json({
    success: true,
    protocol: 'Griha Saathi 4-Stage Authoritative Property Verification (GS-APV-2026)',
    compliance: [
      'Model Tenancy Act 2021',
      'Real Estate (Regulation and Development) Act 2016 (RERA)',
      'Digital Personal Data Protection Act 2023 (DPDP)',
      'Central Electronic Registry (CERSAI) standards',
    ],
    mandatoryStages: [
      {
        id: 'stage_1',
        name: 'Land Registry & Mutation Cross-Check',
        coverage: ['Delhi Bhoomi/DDA', 'Haryana Jamabandi', 'Punjab PLRS', 'HP Himbhoomi', 'J&K Land Records'],
        outcome: 'Establishes incontrovertible proof that the listing owner holds legal title or authorized power of attorney.',
      },
      {
        id: 'stage_2',
        name: 'Physical On-Site Geo-Inspection',
        coverage: 'Target Districts in Delhi, Haryana, Punjab, Himachal Pradesh, J&K',
        outcome: 'Independent field inspector visits the unit, inspects structural integrity, verifies amenities, and captures geo-tagged photographs.',
      },
      {
        id: 'stage_3',
        name: 'DigiLocker / Aadhaar Legal Identity Match',
        coverage: 'Pan-India UIDAI / DigiLocker ecosystem',
        outcome: 'Cross-verifies government identity without storing unencrypted Aadhaar numbers or biometric credentials.',
      },
      {
        id: 'stage_4',
        name: 'Police Intimation & Registered Tenancy Contract',
        coverage: 'State Police Citizen Portals',
        outcome: 'Automates digital police tenant verification filing and prepares Model Tenancy Act-compliant lease agreements.',
      },
    ],
  });
});

/**
 * GET /api/verifications/checklist/:propertyId
 * Retrieve the full transparent verification checklist and granular badges for a property.
 * Redacts internal risk flags from unauthorized tenants.
 */
verificationsRouter.get('/checklist/:propertyId', (req: AuthenticatedRequest, res: Response) => {
  try {
    const propertyId = String(req.params.propertyId);
    const property = db.properties.get(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found.' });
    }

    const ownerUser = db.getUserById(property.ownerId);
    const allProperties = Array.from(db.properties.values());

    const checklist = VerificationService.computeVerificationChecklist(property, ownerUser, allProperties);
    const badges = VerificationService.deriveVerificationBadges(property, checklist);

    const isOwner = req.user && req.user.id === property.ownerId;
    const isVerifierOrAdmin =
      req.user &&
      (req.user.activeRole === 'admin' ||
        req.user.activeRole === 'verifier' ||
        (req.user.activeRole as string) === 'field_verifier');

    // Tenant privacy: redact internal risk flags and duplicate IDs unless owner or reviewer
    const safeChecklist = (isOwner || isVerifierOrAdmin)
      ? checklist
      : {
          ...checklist,
          riskFlags: [],
          duplicateWarnings: checklist.duplicateWarnings.map((w: DuplicateListingWarning) => ({
            matchedPropertyId: 'REDACTED',
            matchedTitle: 'Similar listing in locality',
            similarityScore: w.similarityScore,
            reasons: ['Listing collision flagged for administrative review.'],
          })),
        };

    return res.json({
      success: true,
      propertyId,
      checklist: safeChecklist,
      badges,
      statutoryDisclaimer:
        'Griha Saathi authoritative verifications confirm administrative document submissions and inspection logs. They do not constitute a legal title warranty under the Transfer of Property Act 1882 or replace tenant due diligence.',
    });
  } catch (error) {
    console.error('Error in GET /api/verifications/checklist/:propertyId:', error);
    return res.status(500).json({ success: false, error: 'Internal server error computing checklist.' });
  }
});

/**
 * GET /api/verifications/badges/:propertyId
 * Public endpoint to fetch truthful, granular verification badges for cards and modals.
 */
verificationsRouter.get('/badges/:propertyId', (req: Request, res: Response) => {
  try {
    const propertyId = String(req.params.propertyId);
    const property = db.properties.get(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found.' });
    }

    const ownerUser = db.getUserById(property.ownerId);
    const allProperties = Array.from(db.properties.values());

    const checklist = VerificationService.computeVerificationChecklist(property, ownerUser, allProperties);
    const badges = VerificationService.deriveVerificationBadges(property, checklist);

    return res.json({
      success: true,
      propertyId,
      badges,
    });
  } catch (error) {
    console.error('Error in GET /api/verifications/badges/:propertyId:', error);
    return res.status(500).json({ success: false, error: 'Internal server error retrieving badges.' });
  }
});

/**
 * GET /api/verifications/reviewer/queue
 * Protected: Queue of listings awaiting review, reports, and statistics.
 */
verificationsRouter.get(
  '/reviewer/queue',
  requireRole(['admin', 'verifier', 'field_verifier']),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const summary = db.getReviewerQueue(req.user!.activeRole);
      return res.json({
        success: true,
        summary,
      });
    } catch (error: any) {
      console.error('Error in GET /api/verifications/reviewer/queue:', error);
      return res.status(error?.message?.includes('Unauthorized') ? 403 : 500).json({
        success: false,
        error: error?.message || 'Failed to retrieve reviewer queue.',
      });
    }
  }
);

/**
 * POST /api/verifications/reviewer/decision
 * Protected: Reviewer decision on a property (approve, reject, request_info, suspend).
 * Strictly prevents self-approval.
 */
verificationsRouter.post(
  '/reviewer/decision',
  requireRole(['admin', 'verifier', 'field_verifier']),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const { propertyId, decision, reason, comments } = req.body;

      if (!propertyId || !decision) {
        return res.status(400).json({ success: false, error: 'Property ID and decision are required.' });
      }

      let targetStatus: ListingSubmissionStatus;
      if (decision === 'approve') targetStatus = 'approved';
      else if (decision === 'reject') targetStatus = 'rejected';
      else if (decision === 'request_info') targetStatus = 'additional_information_required';
      else if (decision === 'suspend') targetStatus = 'suspended';
      else {
        return res.status(400).json({
          success: false,
          error: 'Decision must be one of: "approve", "reject", "request_info", "suspend".',
        });
      }

      const updated = db.transitionListingStatus(
        propertyId,
        req.user!.id,
        req.user!.activeRole,
        targetStatus,
        reason,
        comments
      );

      db.logAuditEvent(
        req.user!.id,
        'REVIEWER_DECISION',
        `Property ${propertyId} transition to ${targetStatus}: ${reason || 'Decision recorded'}`,
        req.ip,
        req.get('user-agent')
      );

      return res.json({
        success: true,
        property: updated,
        message: `Property status updated to "${targetStatus}".`,
      });
    } catch (error: any) {
      console.error('Error in POST /api/verifications/reviewer/decision:', error);
      const isForbidden = error?.message?.includes('Self-approval') || error?.message?.includes('Unauthorized');
      return res.status(isForbidden ? 403 : 400).json({
        success: false,
        error: error?.message || 'Failed to apply review decision.',
      });
    }
  }
);

/**
 * POST /api/verifications/reviewer/document-review
 * Protected: Review an individual uploaded document (verified or rejected).
 */
verificationsRouter.post(
  '/reviewer/document-review',
  requireRole(['admin', 'verifier', 'field_verifier']),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const { propertyId, documentId, status, rejectionReason } = req.body;
      if (!propertyId || !documentId || !status) {
        return res.status(400).json({ success: false, error: 'propertyId, documentId, and status are required.' });
      }

      if (status !== 'verified' && status !== 'rejected') {
        return res.status(400).json({ success: false, error: 'Status must be "verified" or "rejected".' });
      }

      const updatedDoc = db.reviewPropertyDocument(
        propertyId,
        documentId,
        req.user!.id,
        req.user!.activeRole,
        status,
        rejectionReason
      );

      return res.json({
        success: true,
        document: updatedDoc,
        message: `Document status updated to "${status}".`,
      });
    } catch (error: any) {
      console.error('Error in POST /api/verifications/reviewer/document-review:', error);
      const isForbidden = error?.message?.includes('Self-approval') || error?.message?.includes('Unauthorized');
      return res.status(isForbidden ? 403 : 400).json({
        success: false,
        error: error?.message || 'Failed to review document.',
      });
    }
  }
);

/**
 * GET /api/verifications/reports
 * Protected: Retrieve all fraud reports for reviewer investigation.
 */
verificationsRouter.get(
  '/reports',
  requireRole(['admin', 'verifier', 'field_verifier']),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const { propertyId, status } = req.query;
      const reports = db.getFraudReports({
        propertyId: propertyId ? String(propertyId) : undefined,
        status: status ? (String(status) as any) : undefined,
      });

      return res.json({
        success: true,
        reports,
      });
    } catch (error) {
      console.error('Error in GET /api/verifications/reports:', error);
      return res.status(500).json({ success: false, error: 'Internal server error retrieving reports.' });
    }
  }
);

/**
 * POST /api/verifications/reports/:id/resolve
 * Protected: Resolve fraud report and take optional moderator action (e.g. suspend listing).
 */
verificationsRouter.post(
  '/reports/:id/resolve',
  requireRole(['admin', 'verifier', 'field_verifier']),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const reportId = String(req.params.id);
      const { action, notes } = req.body;

      const report = db.resolveFraudReport(
        reportId,
        req.user!.id,
        req.user!.activeRole,
        action,
        notes || 'Report investigated by moderation team.'
      );

      return res.json({
        success: true,
        report,
        message: `Fraud report marked "${report.status}".`,
      });
    } catch (error: any) {
      console.error('Error in POST /api/verifications/reports/:id/resolve:', error);
      return res.status(400).json({ success: false, error: error?.message || 'Failed to resolve report.' });
    }
  }
);

/**
 * POST /api/verifications/appeals/:id/resolve
 * Protected: Resolve an owner appeal for a rejected or suspended listing.
 */
verificationsRouter.post(
  '/appeals/:id/resolve',
  requireRole(['admin', 'verifier', 'field_verifier']),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const appealId = String(req.params.id);
      const { decision, notes } = req.body;

      if (decision !== 'accepted' && decision !== 'rejected') {
        return res.status(400).json({ success: false, error: 'Decision must be "accepted" or "rejected".' });
      }

      const appeal = db.resolveAppeal(
        appealId,
        req.user!.id,
        req.user!.activeRole,
        decision,
        notes || `Appeal decision: ${decision}`
      );

      return res.json({
        success: true,
        appeal,
        message: `Appeal resolved with decision "${decision}".`,
      });
    } catch (error: any) {
      console.error('Error in POST /api/verifications/appeals/:id/resolve:', error);
      const isForbidden = error?.message?.includes('Self-approval') || error?.message?.includes('Unauthorized');
      return res.status(isForbidden ? 403 : 400).json({
        success: false,
        error: error?.message || 'Failed to resolve appeal.',
      });
    }
  }
);

/**
 * GET /api/verifications/:id
 * Lookup audit record by property ID or reference token
 */
verificationsRouter.get('/:id', (req: Request, res: Response) => {
  const id = String(req.params.id).trim();
  let record = db.verificationRecords.get(id);
  let matchedProperty = db.properties.get(id);

  if (!record && matchedProperty && matchedProperty.verificationRecord) {
    record = matchedProperty.verificationRecord;
  }

  // Cross-reference by authority transaction ID or property ID (case-insensitive)
  if (!record) {
    for (const p of db.properties.values()) {
      if (p.id.toLowerCase() === id.toLowerCase() && p.verificationRecord) {
        record = p.verificationRecord;
        matchedProperty = p;
        break;
      }
      if (p.verificationRecord?.stages) {
        const stageMatch = p.verificationRecord.stages.some(
          (s) =>
            s.authorityName?.toLowerCase().includes(id.toLowerCase()) ||
            s.evidenceHash?.toLowerCase() === id.toLowerCase() ||
            s.stage?.toLowerCase() === id.toLowerCase()
        );
        if (stageMatch) {
          record = p.verificationRecord;
          matchedProperty = p;
          break;
        }
      }
    }
  }

  if (!record) {
    return res.status(404).json({
      success: false,
      error: `No verification record found for identifier "${id}".`,
      notice: 'In adherence to strict data integrity, Griha Saathi never invents or simulates verification results. Records exist only for properties that have entered the authentic audit pipeline.',
    });
  }

  return res.json({
    success: true,
    record,
    propertyTitle: matchedProperty?.title,
    propertyLocation: matchedProperty ? `${matchedProperty.locality}, ${matchedProperty.city}, ${matchedProperty.state}` : undefined,
  });
});
