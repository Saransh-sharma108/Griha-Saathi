-- ==============================================================================
-- GRIHA SAATHI — PHASE 9 MIGRATION: DASHBOARD, NOTIFICATIONS & SAVED SEARCHES
-- ==============================================================================

-- 1. Alter Users Table: Add Deactivation Flag and Preferences
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_deactivated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT,
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Saved Searches Table
CREATE TABLE IF NOT EXISTS saved_searches (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    filters JSONB NOT NULL,
    alert_frequency VARCHAR(20) NOT NULL DEFAULT 'instant' 
        CHECK (alert_frequency IN ('instant', 'daily', 'weekly', 'none')),
    notified_property_ids TEXT[] DEFAULT '{}',
    last_alert_sent_at TIMESTAMPTZ,
    matched_count_snapshot INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_frequency ON saved_searches(alert_frequency);

-- 3. Property Views Tracking (Authentic Database Analytics)
CREATE TABLE IF NOT EXISTS property_views (
    id BIGSERIAL PRIMARY KEY,
    property_id VARCHAR(36) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    viewer_user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_views_property_id ON property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON property_views(viewed_at);

-- 4. Extend Notifications Table for Deep Links
ALTER TABLE in_app_notifications
ADD COLUMN IF NOT EXISTS related_search_id VARCHAR(36) REFERENCES saved_searches(id) ON DELETE SET NULL;
