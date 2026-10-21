-- ==============================================================================
-- GRIHA SAATHI — PHASE 6 DATABASE MIGRATION SCRIPT (PostgreSQL)
-- Module: Property Verification, Authoritative Review, Trust Badges, Fraud Prevention & Appeals
-- Target Jurisdictions: Jammu & Kashmir, Haryana, Himachal Pradesh, Delhi, Punjab
-- Complies with: Transfer of Property Act 1882, Digital Personal Data Protection Act 2023
-- ==============================================================================

-- 1. Extend Listing Submission Status Enum
-- Adds 'additional_information_required' and 'suspended'
ALTER TYPE listing_submission_status ADD VALUE IF NOT EXISTS 'additional_information_required';
ALTER TYPE listing_submission_status ADD VALUE IF NOT EXISTS 'suspended';

-- 2. Extend User Role Enum for Verification Staff
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'verifier';

-- 3. Create Fraud Reporting Enumerations
CREATE TYPE fraud_report_reason AS ENUM (
    'suspected_fake_listing',
    'misrepresented_rent_or_charges',
    'unauthorized_advertisement',
    'suspicious_payment_request',
    'misleading_photos_or_description',
    'duplicate_listing',
    'impersonation_fraud',
    'other'
);

CREATE TYPE fraud_report_status AS ENUM (
    'pending',
    'under_investigation',
    'action_taken',
    'dismissed'
);

CREATE TYPE in_app_notification_type AS ENUM (
    'submission',
    'review',
    'correction',
    'approval',
    'rejection',
    'suspension',
    'appeal',
    'freshness'
);

-- 4. Fraud Reports Table
-- Privacy protection: reporter_id is isolated and masked from owners and public search
CREATE TABLE IF NOT EXISTS fraud_reports (
    id VARCHAR(64) PRIMARY KEY,
    property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    reporter_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reporter_masked_contact VARCHAR(255),
    reason fraud_report_reason NOT NULL,
    description TEXT NOT NULL,
    status fraud_report_status NOT NULL DEFAULT 'pending',
    moderator_notes TEXT,
    moderator_action VARCHAR(50) DEFAULT 'none', -- 'none', 'warning_issued', 'listing_suspended', 'owner_banned'
    reviewed_by VARCHAR(64) REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for moderator queues and duplicate report prevention
CREATE INDEX IF NOT EXISTS idx_fraud_reports_status ON fraud_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_reports_property ON fraud_reports(property_id, reporter_id, created_at DESC);

-- 5. Listing Appeals Table
-- Allows owners to dispute rejection or suspension with structured rationale and documentation
CREATE TABLE IF NOT EXISTS listing_appeals (
    id VARCHAR(64) PRIMARY KEY,
    property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    supporting_document_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'under_review', 'accepted', 'rejected'
    reviewer_notes TEXT,
    reviewed_by VARCHAR(64) REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_appeals_property ON listing_appeals(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_appeals_status ON listing_appeals(status);

-- 6. In-App Workflow & Verification Notifications Table
CREATE TABLE IF NOT EXISTS in_app_notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type in_app_notification_type NOT NULL,
    related_property_id VARCHAR(64) REFERENCES properties(id) ON DELETE SET NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON in_app_notifications(user_id, is_read, created_at DESC);

-- 7. Document Review Metadata Tracking (Extends property_documents)
ALTER TABLE property_documents ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'pending_review';
ALTER TABLE property_documents ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE property_documents ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(64) REFERENCES users(id);
ALTER TABLE property_documents ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

-- 8. Audit Event for Phase 6 Migration Completion
INSERT INTO audit_logs (actor_id, action, target_entity, target_id)
VALUES ('system', 'phase6_verification_trust_migration_applied', 'schema', 'v6.0.0');
