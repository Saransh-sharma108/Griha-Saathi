# Griha Saathi — Phase 2 Architecture & Implementation Plan

## 1. Executive Summary & Objective
Implement a production-grade relational database and backend foundation for Griha Saathi covering Jammu & Kashmir, Haryana, Himachal Pradesh, Delhi, and Punjab.
**Core Invariant**: Strict zero-synthetic property data policy. Real database records and honest empty states only.

---

## 2. Workspace Audit Findings
- **Frontend**: React 19 + TypeScript + Vite 8. Custom Vanilla CSS design tokens (`--gs-forest-deep`, `--gs-forest-primary`, etc.).
- **Backend**: Express 5 on Node.js v24.20.0 with TypeScript (`tsx watch`).
- **Database Status**: Phase 1 used an in-memory `InMemoryDatabase` with Maps.
- **Provider Status**: All external APIs (telecom SMS, DigiLocker, Haryana Jamabandi, Punjab PLRS, Delhi DORIS, HP Himbhoomi, J&K Land Records, CERSAI) are currently unconfigured in `.env` awaiting production agreements/keys.
- **Node & Database Environment**: Node v24 features built-in `node:sqlite` (`DatabaseSync`) which provides a zero-setup, highly reliable relational ACID SQL engine on Windows, while `pg` enables PostgreSQL connection via `DATABASE_URL`.

---

## 3. Database Architecture & Schema
Dual-engine relational database design:
- If `DATABASE_URL` is configured and reachable, connects to PostgreSQL via `pg.Pool`.
- If `DATABASE_URL` is absent or unreachable in local development, automatically uses the built-in SQLite relational engine (`server/data/griha_saathi.db`) with foreign key enforcement and transactional safety.
- Complete SQL schema and migrations for:
  1. `users` (id, identifier, full_name, is_phone_verified, is_email_verified, is_identity_verified, preferred_language, status, timestamps)
  2. `user_roles` (id, user_id, role [tenant, owner, agent, builder, manager, verifier, admin], is_active, granted_at) — **One account supports multiple roles**.
  3. `user_credentials` (user_id, pin_hash, failed_pin_attempts, locked_until, updated_at)
  4. `otp_challenges` (id, identifier, otp_hash, expires_at, attempts_remaining, is_verified, verification_token, created_at)
  5. `user_sessions` (token, user_id, created_at, expires_at)
  6. `properties` (id, owner_id, title, description, state, city, locality, address, pincode, property_category, rental_deal_type, property_type, rent_per_month, maintenance_charges, security_deposit, bedrooms, bathrooms, carpet_area_sqft, furnishing, tenant_preference, amenities, available_from, availability_status, last_confirmed_at, verification_status, publication_status, data_source, external_provider_id, external_listing_id, created_at, updated_at)
  7. `property_media` (id, property_id, media_url, media_type, caption, is_primary, is_inspector_certified, geo_latitude, geo_longitude, captured_at, created_at)
  8. `verification_records` & `verification_stages` (formal audit trail)
  9. `listing_approval_history` (audit of status transitions)
  10. `saved_properties` & `saved_searches` (tenant bookmarks and query alerts)
  11. `connection_requests` & `messages` (handshake and messaging)
  12. `visit_requests` (physical property visit schedules and statuses)
  13. `data_providers` & `provider_sync_history` (synchronization ledger)
  14. `audit_logs` (security and compliance logging)

---

## 4. Real Property Data Research & Provider-Adapter Architecture
- **Landscape Reality in India**: No national MLS exists. RERA governs compliance/projects, not individual rental listings. Classified portals (MagicBricks, 99acres) prohibit scraping.
- **Legitimate Ingestion Strategy**:
  1. Authoritative primary source: Direct Owner & Licensed Broker submissions with Aadhaar/DigiLocker and land registry verification.
  2. Enterprise & Partner Feeds: PropertyWala Developer API, Propstack Institutional, Surepass KYC/Registry Verification, and Standard RESO/JSON Broker Feeds.
- **Provider Adapter Architecture**:
  - `BaseProviderAdapter` interface with fetch, normalize, deduplicate, sync, retry, and credential safety.
  - Adapters for PropertyWala, Propstack, Surepass, and Regional Land Records.
  - If unconfigured, honest disclosure with required credentials and zero simulated data.

---

## 5. Security, Search & Data Freshness
- 60-day availability reconfirmation rule. Stale listings flagged and filtered.
- Owner-only update/delete protection.
- Contact privacy masking on all public search endpoints.
- Rate limiting and audit logging on sensitive mutations.

---

## 6. Frontend Integration & Testing
- Connect Find Property, Home, Listing, Dashboard, Connections, and Verifications to real database endpoints.
- Preserve premium forest-green / warm-white / charcoal design.
- Comprehensive automated test suite validating migrations, role assignment, submissions, authorization barriers, and search freshness.
