-- ==============================================================================
-- GRIHA SAATHI — PHASE 4 DISCOVERY & SEARCH MIGRATION
-- Applies: Schema upgrades for real-time discovery, 60-day freshness, and saved properties
-- Target Territories: Delhi, Haryana, Punjab, Himachal Pradesh, Jammu & Kashmir
-- ==============================================================================

-- 1. Extend properties table with search, sizing, coordinates, and freshness columns
ALTER TABLE properties 
    ADD COLUMN IF NOT EXISTS bedrooms INT,
    ADD COLUMN IF NOT EXISTS bathrooms INT,
    ADD COLUMN IF NOT EXISTS area_sq_ft NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS maintenance_charges NUMERIC(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS availability_status VARCHAR(50) NOT NULL DEFAULT 'available',
    ADD COLUMN IF NOT EXISTS availability_confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS geo_latitude NUMERIC(10, 7),
    ADD COLUMN IF NOT EXISTS geo_longitude NUMERIC(10, 7),
    ADD COLUMN IF NOT EXISTS data_source VARCHAR(50) NOT NULL DEFAULT 'owner_submission';

-- 2. Create indexes for high-concurrency search filtering
CREATE INDEX IF NOT EXISTS idx_properties_locality ON properties(locality);
CREATE INDEX IF NOT EXISTS idx_properties_rent ON properties(rent_per_month);
CREATE INDEX IF NOT EXISTS idx_properties_freshness ON properties(availability_confirmed_at);
CREATE INDEX IF NOT EXISTS idx_properties_type_rooms ON properties(property_type, bedrooms);

-- 3. Create saved_properties table for authenticated user bookmarks
CREATE TABLE IF NOT EXISTS saved_properties (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_saved_property UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_properties_user ON saved_properties(user_id, saved_at DESC);

-- 4. Verification Check
COMMENT ON TABLE saved_properties IS 'Stores authenticated user saved/bookmarked properties with strict user isolation.';
COMMENT ON COLUMN properties.availability_confirmed_at IS 'Timestamp of last availability confirmation. Subject to 60-day freshness rule.';
