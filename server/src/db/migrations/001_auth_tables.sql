-- ==============================================================================
-- GRIHA SAATHI — PRODUCTION DATABASE MIGRATION: AUTHENTICATION & USERS
-- Engine: PostgreSQL 14+
-- ==============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(64) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(32),
  normalized_mobile_number VARCHAR(32) UNIQUE,
  mobile_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_address VARCHAR(255),
  normalized_email_address VARCHAR(255) UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  pin_hash VARCHAR(255) NOT NULL,
  account_purposes TEXT[] NOT NULL DEFAULT '{"tenant"}',
  account_status VARCHAR(32) NOT NULL DEFAULT 'active',
  failed_pin_attempts INT NOT NULL DEFAULT 0,
  lockout_until BIGINT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning-fast identifier lookups
CREATE INDEX IF NOT EXISTS idx_users_normalized_mobile ON users(normalized_mobile_number);
CREATE INDEX IF NOT EXISTS idx_users_normalized_email ON users(normalized_email_address);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

-- 2. OTP Challenges Table
CREATE TABLE IF NOT EXISTS otp_challenges (
  challenge_id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(user_id) ON DELETE SET NULL,
  destination VARCHAR(255) NOT NULL,
  delivery_channel VARCHAR(32) NOT NULL, -- 'sms' or 'email'
  otp_hash VARCHAR(255) NOT NULL,
  expires_at BIGINT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  last_requested_at BIGINT NOT NULL,
  window_started_at BIGINT NOT NULL,
  request_count_in_window INT NOT NULL DEFAULT 1,
  verified_at BIGINT DEFAULT NULL,
  verification_token VARCHAR(128) DEFAULT NULL,
  verification_token_expires_at BIGINT DEFAULT NULL,
  delivery_status VARCHAR(32) NOT NULL DEFAULT 'otp_generated',
  provider_name VARCHAR(64),
  provider_reference_id VARCHAR(128),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_destination ON otp_challenges(destination);
CREATE INDEX IF NOT EXISTS idx_otp_verification_token ON otp_challenges(verification_token);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_challenges(expires_at);

-- 3. User Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  token VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  ip_address VARCHAR(64),
  user_agent TEXT,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 4. Security Audit Trail Table
CREATE TABLE IF NOT EXISTS security_audit_events (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  action VARCHAR(128) NOT NULL,
  ip_address VARCHAR(64),
  user_agent TEXT,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON security_audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON security_audit_events(timestamp);

