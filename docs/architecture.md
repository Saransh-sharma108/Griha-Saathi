# Griha Saathi — Architectural Blueprint & System Design (Phase 1)

**Griha Saathi** (गृह साथी) is an authoritative, trustworthy rental-property platform designed specifically for the rental ecosystem in Bharat, beginning with Northern India (**Jammu & Kashmir, Haryana, Himachal Pradesh, Delhi, and Punjab**).

---

## 1. System Architecture Overview

```
                      ┌───────────────────────────────────────────┐
                      │             CLIENT LAYER                  │
                      │  React 18 + TypeScript + Vanilla Design   │
                      │  System + Client-Side Routing + i18n      │
                      │  (English, Hindi, Hinglish)               │
                      └─────────────────────┬─────────────────────┘
                                            │ HTTPS / JSON API
                                            ▼
                      ┌───────────────────────────────────────────┐
                      │             GATEWAY / SERVER              │
                      │        Node.js + Express + TypeScript     │
                      │   - Rate Limiting & Lockout Guard         │
                      │   - Auth Controller (Bcrypt PINs / OTPs)  │
                      │   - Properties & Search Controller        │
                      │   - Verifications Controller              │
                      │   - Saathi AI Knowledge Engine            │
                      │   - Connections & Private Chat Guard      │
                      └──────────────┬──────────────┬─────────────┘
                                     │              │
                   ┌─────────────────┴────┐   ┌─────┴────────────────┐
                   ▼                      ▼   ▼                      ▼
        ┌───────────────────┐    ┌────────────────────────────────────────┐
        │  DATABASE LAYER   │    │      AUTHORITATIVE INTEGRATIONS        │
        │  PostgreSQL RDBMS │    │  - TRAI DLT Telecom SMS / SMTP         │
        │  Relational Store │    │  - DigiLocker / UIDAI Identity         │
        │  Isolated Auth    │    │  - State Land Registries (Jamabandi,   │
        │  Audit Logs       │    │    PLRS, DORIS, Himbhoomi, J&K LR)     │
        │  Zero-Synthetic   │    │  - CERSAI Asset Registry               │
        └───────────────────┘    └────────────────────────────────────────┘
```

---

## 2. Strict Data Integrity Model

Traditional rental portals suffer from synthetic listings, phantom properties, fake landlord profiles, and fabricated reviews created to give an impression of activity. 

Griha Saathi enforces **Strict Data Integrity**:
1. **Zero Synthetic / Seeded Listings**: If zero verified properties exist in a region, the platform renders an honest, transparent empty state explaining the onboarding and integration progress.
2. **Gated Public Discovery**: Submitted properties remain in `pending_review` until cross-checked against land registry records and inspected by certified field officers.
3. **No Fabricated Profiles**: User profiles show only real verified information or voluntary disclosures.
4. **Transparent Integrations**: If an external provider (e.g. SMS gateway or land registry) is not configured, the interface honestly discloses this state rather than simulating delivery.

---

## 3. Authentication Architecture & Security Flow

### Registration Flow
1. **Identifier Entry**: User inputs their Indian mobile number or email address.
2. **Real OTP Dispatch**: Server hashes a 6-digit random code (bcrypt) with a 5-minute TTL and dispatches it via a configured SMS/Email gateway.
3. **Server Validation**: The server compares the submitted OTP against the hashed challenge with a 3-attempt limit.
4. **Single-Use Token**: Upon success, a one-time verification token is issued.
5. **4-Digit PIN Creation**: User creates a 4-digit PIN. The server salts and hashes the PIN using bcrypt. The plain PIN is never transmitted back or stored in localStorage.

### Login Flow
1. **PIN Authentication**: User enters identifier and 4-digit PIN.
2. **Lockout Guard**: Server tracks failed attempts. 5 consecutive incorrect attempts trigger a 15-minute account lockout.
3. **Session Token**: Secure cryptographic session token returned upon successful verification.

---

## 4. Navigation & Page Structure

Navigation adheres to the mandatory 8-section sequence:
1. **Home**: High-trust headline, dual search tabs, 4 pillars of transparency, target state directory.
2. **Find Property**: Multi-faceted filter system (region, city, budget, type, furnishing), list/map view toggle, honest empty state.
3. **Verifications**: 4-stage verification protocol breakdown, public certificate/audit record lookup.
4. **Connections**: Direct tenant-landlord communication; authenticated session required; security warnings against premature token transfers.
5. **Saathi AI**: Rental assistant workspace in English, Hindi, and Hinglish; queries verified records and statutory tenancy law (Model Tenancy Act 2021).
6. **Help**: Knowledge base, tenancy FAQs, and official escalation desk.
7. **Dashboard**: Role-aware views (Tenant, Owner, Agent) with live integration status indicators.
8. **Listing Property**: Guided multi-step property submission for verification audit.

---

## 5. Regional Expansion Strategy

- **Phase 1 (Current)**: Foundation, architecture, premium UI, and target regions: Jammu & Kashmir, Haryana, Himachal Pradesh, Delhi, Punjab.
- **Phase 2**: Live government land registry adapters and DigiLocker SDK integration.
- **Phase 3**: Field inspector portal with mobile geo-tagging camera verification.
- **Phase 4**: Expansion across Western, Southern, Central, and Eastern Indian states.
