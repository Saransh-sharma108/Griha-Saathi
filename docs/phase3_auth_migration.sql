-- ==============================================================================
-- GRIHA SAATHI — PHASE 3 DATABASE MIGRATION SCRIPT (PostgreSQL)
-- Secure Authentication, Multi-Role Accounts, User Profiles & Security Sessions
-- ==============================================================================

BEGIN;

-- 1. Extend user_role ENUM to include 'builder' and 'property_manager'
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'builder';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'property_manager';

-- 2. Add Profile and Contact Columns to users table
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE,
    ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
    ADD COLUMN IF NOT EXISTS active_role user_role NOT NULL DEFAULT 'tenant',
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
    ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{"email_alerts": true, "sms_alerts": true, "property_inquiries": true, "security_alerts": true}'::jsonb,
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- 3. Create Multi-Role Junction Table (user_roles)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);

-- Backfill existing single roles into user_roles
INSERT INTO user_roles (user_id, role)
SELECT id, role FROM users
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Extend user_credentials with pin_changed_at timestamp
ALTER TABLE user_credentials
    ADD COLUMN IF NOT EXISTS pin_changed_at TIMESTAMP WITH TIME ZONE;

-- 5. Create user_sessions Table (HttpOnly Cookie & Session Lifecycle)
CREATE TABLE IF NOT EXISTS user_sessions (
    token VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON user_sessions(expires_at);

-- 6. Extend otp_challenges Table (Rate Limiting, Cooldown & Types)
ALTER TABLE otp_challenges
    ADD COLUMN IF NOT EXISTS challenge_type VARCHAR(50) NOT NULL DEFAULT 'registration',
    ADD COLUMN IF NOT EXISTS last_requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS request_count_in_window INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMP WITH TIME ZONE;

-- 7. Add index to audit_logs for user queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);

COMMIT;
