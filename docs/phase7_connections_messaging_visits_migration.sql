-- ==============================================================================
-- GRIHA SAATHI — PHASE 7 DATABASE MIGRATION SCRIPT (PostgreSQL)
-- Module: Connections, Secure In-App Messaging & Property Visit Scheduling
-- Target Jurisdictions: Jammu & Kashmir, Haryana, Himachal Pradesh, Delhi, Punjab
-- Complies with: Digital Personal Data Protection Act 2023, Transfer of Property Act 1882
-- ==============================================================================

-- 1. Create Connection Status Enum
CREATE TYPE connection_status AS ENUM (
    'pending',
    'accepted',
    'declined',
    'cancelled',
    'blocked'
);

-- 2. Create Property Visit Status Enum
CREATE TYPE property_visit_status AS ENUM (
    'pending',
    'confirmed',
    'rescheduled',
    'completed',
    'cancelled'
);

-- 3. Connections Table
-- Manages verified contact relationships between tenants, owners, and agents.
-- Prevents unsolicited outreach without explicit mutual authorization.
CREATE TABLE IF NOT EXISTS connection_requests (
    id VARCHAR(64) PRIMARY KEY,
    sender_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id VARCHAR(64) REFERENCES properties(id) ON DELETE SET NULL,
    status connection_status NOT NULL DEFAULT 'pending',
    initial_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_no_self_connection CHECK (sender_id <> recipient_id)
);

-- Index connections by participant and state for fast listing
CREATE INDEX IF NOT EXISTS idx_connections_sender ON connection_requests(sender_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_recipient ON connection_requests(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_property ON connection_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_connections_updated ON connection_requests(updated_at DESC);

-- 4. Secure In-App Messages Table
-- Stores end-to-end authorized conversations between connected parties.
CREATE TABLE IF NOT EXISTS conversation_messages (
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

-- Indexes for rapid conversation loading and unread count aggregation
CREATE INDEX IF NOT EXISTS idx_messages_connection_created ON conversation_messages(connection_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON conversation_messages(connection_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_messages_sender ON conversation_messages(sender_id);

-- 5. Property Visit Scheduling Table
-- Coordinates physical property visits with conflict prevention and historical audit trails.
CREATE TABLE IF NOT EXISTS property_visits (
    id VARCHAR(64) PRIMARY KEY,
    connection_id VARCHAR(64) NOT NULL REFERENCES connection_requests(id) ON DELETE CASCADE,
    property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    visitor_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status property_visit_status NOT NULL DEFAULT 'pending',
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

-- Unique index to prevent duplicate active visits for the same visitor and property
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_visit 
    ON property_visits(visitor_id, property_id) 
    WHERE status IN ('pending', 'confirmed', 'rescheduled');

-- Index for checking slot booking conflicts for a property
CREATE INDEX IF NOT EXISTS idx_property_visit_conflicts 
    ON property_visits(property_id, preferred_date, time_slot) 
    WHERE status = 'confirmed';

-- Index visits by user for dashboard tabs
CREATE INDEX IF NOT EXISTS idx_visits_visitor ON property_visits(visitor_id, status, preferred_date);
CREATE INDEX IF NOT EXISTS idx_visits_owner ON property_visits(owner_id, status, preferred_date);
CREATE INDEX IF NOT EXISTS idx_visits_connection ON property_visits(connection_id);

-- 6. Blocked Users Table
-- Supports user safety, harassment prevention, and privacy enforcement.
CREATE TABLE IF NOT EXISTS blocked_users (
    id VARCHAR(64) PRIMARY KEY,
    blocker_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_no_self_block CHECK (blocker_id <> blocked_id),
    CONSTRAINT uq_blocker_blocked UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_blocked ON blocked_users(blocked_id);

-- 7. Notification Extensions for Connections & Visits
ALTER TABLE in_app_notifications 
    ADD COLUMN IF NOT EXISTS related_connection_id VARCHAR(64) REFERENCES connection_requests(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS related_visit_id VARCHAR(64) REFERENCES property_visits(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_connection ON in_app_notifications(related_connection_id);
CREATE INDEX IF NOT EXISTS idx_notifications_visit ON in_app_notifications(related_visit_id);
