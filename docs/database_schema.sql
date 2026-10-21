-- ==============================================================================
-- GRIHA SAATHI — PRODUCTION RELATIONAL DATABASE SCHEMA (PostgreSQL)
-- Target Regions: Delhi, Haryana, Punjab, Himachal Pradesh, Jammu & Kashmir
-- Designed for Bharat-scale expansion, audit trails, and DPDP Act compliance.
-- ==============================================================================

-- 1. Custom Types & Enumerations
CREATE TYPE user_role AS ENUM (
    'tenant', 
    'owner', 
    'agent', 
    'builder', 
    'property_manager', 
    'verifier',
    'field_verifier', 
    'admin'
);
CREATE TYPE target_state AS ENUM ('Delhi', 'Haryana', 'Punjab', 'Himachal Pradesh', 'Jammu & Kashmir');
CREATE TYPE property_type AS ENUM ('1bhk', '2bhk', '3bhk', 'independent_house', 'studio', 'pg_coliving');
CREATE TYPE furnishing_status AS ENUM ('unfurnished', 'semi_furnished', 'fully_furnished');
CREATE TYPE tenant_preference AS ENUM ('family', 'bachelors', 'working_professionals', 'students', 'any');
CREATE TYPE verification_status AS ENUM (
    'unverified',
    'pending_review',
    'document_verified',
    'physically_inspected',
    'authoritative_verified',
    'rejected'
);
CREATE TYPE verification_stage_type AS ENUM (
    'land_registry',
    'physical_inspection',
    'owner_identity',
    'police_intimation'
);
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
CREATE TYPE listing_submission_status AS ENUM (
    'draft',
    'submitted',
    'pending_verification',
    'under_review',
    'correction_requested',
    'additional_information_required',
    'resubmitted',
    'approved',
    'rejected',
    'expired',
    'withdrawn',
    'suspended'
);
CREATE TYPE declared_submitter_authority AS ENUM (
    'sole_owner',
    'authorized_co_owner',
    'licensed_broker',
    'builder_representative',
    'property_manager',
    'authorized_sublessor'
);

-- 2. Users Table (Core Identity & Profile Preferences)
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL UNIQUE, -- Primary login phone or email
    phone VARCHAR(20) UNIQUE,                -- Verified Indian mobile (+91)
    email VARCHAR(255) UNIQUE,               -- Verified email address
    active_role user_role NOT NULL DEFAULT 'tenant',
    role user_role NOT NULL DEFAULT 'tenant', -- Backward-compatible alias
    full_name VARCHAR(255),                  -- Only populated if voluntarily provided by user
    avatar_url TEXT,                         -- Profile photo URL or base64 avatar
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en', -- 'en', 'hi', 'hi-en'
    notification_preferences JSONB NOT NULL DEFAULT '{"email_alerts": true, "sms_alerts": true, "property_inquiries": true, "security_alerts": true}'::jsonb,
    is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Multi-Role Account Assignments (One account holding multiple roles)
CREATE TABLE user_roles (
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- 4. User Authentication Material (Isolated from public queries)
CREATE TABLE user_credentials (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    pin_hash VARCHAR(255) NOT NULL, -- Bcrypt / Argon2 hashed 4-digit PIN
    failed_pin_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    pin_changed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. User Sessions (HttpOnly Cookie & Device Token Tracking)
CREATE TABLE user_sessions (
    token VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);

-- 6. OTP Challenges (Ephemeral with TTL & Replay Protection)
CREATE TABLE otp_challenges (
    id VARCHAR(64) PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    challenge_type VARCHAR(50) NOT NULL DEFAULT 'registration', -- 'registration', 'recovery', 'contact_update'
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts_remaining INT NOT NULL DEFAULT 3,
    last_requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    request_count_in_window INT NOT NULL DEFAULT 1,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_identifier ON otp_challenges(identifier);

-- 5. Properties Table (Core Listings Entity)
CREATE TABLE properties (
    id VARCHAR(64) PRIMARY KEY,
    owner_id VARCHAR(64) NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    state target_state NOT NULL,
    city VARCHAR(100) NOT NULL,
    locality VARCHAR(255) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    property_type property_type NOT NULL,
    bedrooms INT,
    bathrooms INT,
    area_sq_ft NUMERIC(10, 2),
    rent_per_month NUMERIC(12, 2) NOT NULL CHECK (rent_per_month > 0),
    security_deposit NUMERIC(12, 2) NOT NULL CHECK (security_deposit >= 0),
    maintenance_charges NUMERIC(10, 2) NOT NULL DEFAULT 0,
    furnishing furnishing_status NOT NULL DEFAULT 'semi_furnished',
    tenant_preference tenant_preference NOT NULL DEFAULT 'any',
    amenities TEXT[] DEFAULT '{}',
    available_from DATE NOT NULL,
    availability_status VARCHAR(50) NOT NULL DEFAULT 'available',
    availability_confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    geo_latitude NUMERIC(10, 7),
    geo_longitude NUMERIC(10, 7),
    verification_status verification_status NOT NULL DEFAULT 'pending_review',
    submission_status listing_submission_status NOT NULL DEFAULT 'submitted',
    declared_authority declared_submitter_authority,
    sublessor_declaration BOOLEAN NOT NULL DEFAULT FALSE,
    address_details TEXT,
    floor_number INT DEFAULT 0,
    total_floors INT,
    lease_terms TEXT,
    correction_notes TEXT,
    correction_requested_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    data_source VARCHAR(50) NOT NULL DEFAULT 'owner_submission',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_properties_location ON properties(state, city, locality, pincode);
CREATE INDEX idx_properties_rent ON properties(rent_per_month);
CREATE INDEX idx_properties_verified ON properties(verification_status) WHERE verification_status = 'authoritative_verified';
CREATE INDEX idx_properties_submission_status ON properties(submission_status);
CREATE INDEX idx_properties_owner_status ON properties(owner_id, submission_status);
CREATE INDEX idx_properties_freshness ON properties(availability_confirmed_at);

-- 5a. Saved Properties Table (User Bookmarks with Strict Isolation)
CREATE TABLE saved_properties (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

CREATE INDEX idx_saved_properties_user ON saved_properties(user_id, saved_at DESC);

-- 5b. Listing Drafts Table (Authenticated Multi-Step Wizard Persistence)
CREATE TABLE listing_drafts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_step INT NOT NULL DEFAULT 1,
    draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listing_drafts_user ON listing_drafts(user_id, updated_at DESC);

-- 6. Property Media (Genuine Photographs & Visual Evidence)
CREATE TABLE property_media (
    id VARCHAR(64) PRIMARY KEY,
    property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    url VARCHAR(512) NOT NULL,
    filename VARCHAR(256) NOT NULL,
    original_filename VARCHAR(256) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(64) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_inspector_certified BOOLEAN NOT NULL DEFAULT FALSE,
    geo_latitude NUMERIC(10, 7),
    geo_longitude NUMERIC(10, 7),
    captured_at TIMESTAMP WITH TIME ZONE,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_property_media_property ON property_media(property_id);

-- 6a. Property Documents (Confidential Ownership Evidence - DPDP Act 2023 Compliant)
CREATE TABLE property_documents (
    id VARCHAR(64) PRIMARY KEY,
    property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
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

CREATE INDEX idx_property_documents_property ON property_documents(property_id);
CREATE INDEX idx_property_documents_hash ON property_documents(sha256_hash);

-- 6b. Listing Status History (Immutable Verification & Workflow Audit Log)
CREATE TABLE listing_status_history (
    id VARCHAR(64) PRIMARY KEY,
    property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    from_status VARCHAR(50) NOT NULL,
    to_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(64) NOT NULL REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reason TEXT,
    comments TEXT
);

CREATE INDEX idx_status_history_property ON listing_status_history(property_id, changed_at ASC);

-- 7. Verification Records & Audits (Tamper-Resistant Log)
CREATE TABLE verification_records (
    id VARCHAR(64) PRIMARY KEY,
    property_id VARCHAR(64) NOT NULL UNIQUE REFERENCES properties(id) ON DELETE CASCADE,
    status verification_status NOT NULL DEFAULT 'pending_review',
    disclaimer TEXT NOT NULL,
    inspector_id VARCHAR(64) REFERENCES users(id),
    registry_reference_num VARCHAR(255),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Verification Audit Stages
CREATE TABLE verification_stages (
    id VARCHAR(64) PRIMARY KEY,
    verification_record_id VARCHAR(64) NOT NULL REFERENCES verification_records(id) ON DELETE CASCADE,
    stage verification_stage_type NOT NULL,
    authority_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    details TEXT,
    evidence_document_hash VARCHAR(255),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 9. Connection Requests (Tenant-Owner Handshake)
CREATE TABLE connection_requests (
    id VARCHAR(64) PRIMARY KEY,
    property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id VARCHAR(64) NOT NULL REFERENCES users(id),
    owner_id VARCHAR(64) NOT NULL REFERENCES users(id),
    status connection_status NOT NULL DEFAULT 'pending',
    tenant_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 10. Conversation Messages (Encrypted at Rest)
CREATE TABLE messages (
    id VARCHAR(64) PRIMARY KEY,
    connection_id VARCHAR(64) NOT NULL REFERENCES connection_requests(id) ON DELETE CASCADE,
    sender_id VARCHAR(64) NOT NULL REFERENCES users(id),
    recipient_id VARCHAR(64) NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_connection ON messages(connection_id, created_at);

-- 11. Scheduled Physical Visits
CREATE TABLE property_visits (
    id VARCHAR(64) PRIMARY KEY,
    connection_id VARCHAR(64) NOT NULL REFERENCES connection_requests(id) ON DELETE CASCADE,
    scheduled_slot TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 12. System Audit Trail (DPDP Compliance & Security Logging)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id VARCHAR(64),
    action VARCHAR(100) NOT NULL,
    target_entity VARCHAR(100) NOT NULL,
    target_id VARCHAR(64),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 13. Fraud Reports & Moderation Queue (Phase 6)
-- Protects reporter identities in compliance with DPDP Act 2023.
CREATE TABLE fraud_reports (
    id VARCHAR(64) PRIMARY KEY,
    property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    reporter_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reporter_masked_contact VARCHAR(255),
    reason VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'under_investigation', 'action_taken', 'dismissed'
    moderator_notes TEXT,
    moderator_action VARCHAR(50) DEFAULT 'none',
    reviewed_by VARCHAR(64) REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fraud_reports_status ON fraud_reports(status, created_at DESC);
CREATE INDEX idx_fraud_reports_property ON fraud_reports(property_id, reporter_id, created_at DESC);

-- 14. Listing Appeals (Phase 6)
-- Allows legitimate owners to challenge adverse verification decisions or suspensions
CREATE TABLE listing_appeals (
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

CREATE INDEX idx_listing_appeals_property ON listing_appeals(property_id, created_at DESC);

-- 15. In-App Workflow, Verification, Connection & Visit Notifications (Phase 6 & 7)
CREATE TABLE in_app_notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'submission', 'review', 'approval', 'rejection', 'suspension', 'appeal', 'freshness', 'connection_request', 'connection_accepted', 'connection_declined', 'new_message', 'visit_requested', 'visit_confirmed', 'visit_declined', 'visit_rescheduled', 'visit_cancelled'
    related_property_id VARCHAR(64) REFERENCES properties(id) ON DELETE SET NULL,
    related_connection_id VARCHAR(64) REFERENCES connection_requests(id) ON DELETE SET NULL,
    related_visit_id VARCHAR(64) REFERENCES property_visits(id) ON DELETE SET NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON in_app_notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_connection ON in_app_notifications(related_connection_id);
CREATE INDEX idx_notifications_visit ON in_app_notifications(related_visit_id);

-- 16. Connections (Phase 7)
-- Manages verified relationships between tenants, owners, and agents.
CREATE TABLE connection_requests (
    id VARCHAR(64) PRIMARY KEY,
    sender_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id VARCHAR(64) REFERENCES properties(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'cancelled', 'blocked'
    initial_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_no_self_connection CHECK (sender_id <> recipient_id)
);

CREATE INDEX idx_connections_sender ON connection_requests(sender_id, status);
CREATE INDEX idx_connections_recipient ON connection_requests(recipient_id, status);
CREATE INDEX idx_connections_property ON connection_requests(property_id);
CREATE INDEX idx_connections_updated ON connection_requests(updated_at DESC);

-- 17. Conversation Messages (Phase 7)
-- Authenticated messaging between accepted connections.
CREATE TABLE conversation_messages (
    id VARCHAR(64) PRIMARY KEY,
    connection_id VARCHAR(64) NOT NULL REFERENCES connection_requests(id) ON DELETE CASCADE,
    sender_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content VARCHAR(2000) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    is_reported BOOLEAN NOT NULL DEFAULT FALSE,
    report_reason VARCHAR(100),
    reported_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_connection_created ON conversation_messages(connection_id, created_at ASC);
CREATE INDEX idx_messages_unread ON conversation_messages(connection_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_messages_sender ON conversation_messages(sender_id);

-- 18. Property Visits (Phase 7)
-- Physical inspection visits with conflict prevention and audit trail.
CREATE TABLE property_visits (
    id VARCHAR(64) PRIMARY KEY,
    connection_id VARCHAR(64) NOT NULL REFERENCES connection_requests(id) ON DELETE CASCADE,
    property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    visitor_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'rescheduled', 'completed', 'cancelled'
    preferred_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    proposed_alternative_date DATE,
    proposed_alternative_time_slot VARCHAR(50),
    reschedule_note TEXT,
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_by VARCHAR(64) REFERENCES users(id),
    status_history JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_no_self_visit CHECK (visitor_id <> owner_id)
);

CREATE UNIQUE INDEX idx_unique_active_visit 
    ON property_visits(visitor_id, property_id) 
    WHERE status IN ('pending', 'confirmed', 'rescheduled');

CREATE INDEX idx_property_visit_conflicts 
    ON property_visits(property_id, preferred_date, time_slot) 
    WHERE status = 'confirmed';

CREATE INDEX idx_visits_visitor ON property_visits(visitor_id, status, preferred_date);
CREATE INDEX idx_visits_owner ON property_visits(owner_id, status, preferred_date);
CREATE INDEX idx_visits_connection ON property_visits(connection_id);

-- 19. Blocked Users (Phase 7)
-- User protection, harassment prevention, and privacy enforcement.
CREATE TABLE blocked_users (
    id VARCHAR(64) PRIMARY KEY,
    blocker_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_no_self_block CHECK (blocker_id <> blocked_id),
    CONSTRAINT uq_blocker_blocked UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX idx_blocked_blocker ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_blocked ON blocked_users(blocked_id);


