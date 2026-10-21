-- ==============================================================================
-- GRIHA SAATHI — PHASE 5 PROPERTY LISTING & WORKFLOW MIGRATION
-- Applies: Multi-state listing workflow, backend drafts, genuine media, and private document storage
-- Target Territories: Delhi, Haryana, Punjab, Himachal Pradesh, Jammu & Kashmir
-- ==============================================================================

-- 1. Submission Status Enum & Authority Enum
DO $$ BEGIN
    CREATE TYPE listing_submission_status AS ENUM (
        'draft',
        'submitted',
        'pending_verification',
        'under_review',
        'correction_requested',
        'resubmitted',
        'approved',
        'rejected',
        'expired',
        'withdrawn'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE declared_submitter_authority AS ENUM (
        'sole_owner',
        'authorized_co_owner',
        'licensed_broker',
        'builder_representative',
        'property_manager',
        'authorized_sublessor'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Extend properties table with submission and workflow fields
ALTER TABLE properties 
    ADD COLUMN IF NOT EXISTS submission_status VARCHAR(50) NOT NULL DEFAULT 'submitted',
    ADD COLUMN IF NOT EXISTS declared_authority VARCHAR(50),
    ADD COLUMN IF NOT EXISTS sublessor_declaration BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS address_details TEXT,
    ADD COLUMN IF NOT EXISTS floor_number INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_floors INT,
    ADD COLUMN IF NOT EXISTS lease_terms TEXT,
    ADD COLUMN IF NOT EXISTS correction_notes TEXT,
    ADD COLUMN IF NOT EXISTS correction_requested_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMP WITH TIME ZONE;

-- 3. Create listing_drafts table for authenticated user wizard persistence
CREATE TABLE IF NOT EXISTS listing_drafts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_step INT NOT NULL DEFAULT 1,
    draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_drafts_user ON listing_drafts(user_id, updated_at DESC);

-- 4. Create property_media table for genuine photographs (Public access)
CREATE TABLE IF NOT EXISTS property_media (
    id VARCHAR(64) PRIMARY KEY,
    property_id VARCHAR(64) REFERENCES properties(id) ON DELETE CASCADE,
    url VARCHAR(512) NOT NULL,
    filename VARCHAR(256) NOT NULL,
    original_filename VARCHAR(256) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(64) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_media_property ON property_media(property_id);

-- 5. Create property_documents table for ownership evidence (Strict DPDP Private Access)
CREATE TABLE IF NOT EXISTS property_documents (
    id VARCHAR(64) PRIMARY KEY,
    property_id VARCHAR(64) REFERENCES properties(id) ON DELETE CASCADE,
    document_type VARCHAR(64) NOT NULL,
    filename VARCHAR(256) NOT NULL,
    original_filename VARCHAR(256) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(64) NOT NULL,
    sha256_hash CHAR(64) NOT NULL,
    access_role VARCHAR(64) NOT NULL DEFAULT 'owner_and_verifier_only',
    status VARCHAR(32) NOT NULL DEFAULT 'pending_review',
    rejection_reason TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_documents_property ON property_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_hash ON property_documents(sha256_hash);

-- 6. Create listing_status_history table for immutable verification audit trail
CREATE TABLE IF NOT EXISTS listing_status_history (
    id VARCHAR(64) PRIMARY KEY,
    property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    from_status VARCHAR(50) NOT NULL,
    to_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(64) NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reason TEXT,
    comments TEXT
);

CREATE INDEX IF NOT EXISTS idx_status_history_property ON listing_status_history(property_id, changed_at ASC);

-- 7. Verification & Workflow Status Indexes
CREATE INDEX IF NOT EXISTS idx_properties_submission_status ON properties(submission_status);
CREATE INDEX IF NOT EXISTS idx_properties_owner_status ON properties(owner_id, submission_status);

-- 8. Table & Column Documentation Comments
COMMENT ON TABLE listing_drafts IS 'Server-side persisted property listing wizard drafts with strict user isolation.';
COMMENT ON TABLE property_documents IS 'Confidential land-registry and ownership evidence documents. Strictly restricted from public access per DPDP Act 2023.';
COMMENT ON TABLE listing_status_history IS 'Tamper-evident chronological audit log of all listing submission, review, correction, and approval transitions.';
COMMENT ON COLUMN properties.submission_status IS 'Multi-state workflow status (draft, submitted, pending_verification, under_review, correction_requested, resubmitted, approved, rejected, expired, withdrawn).';
