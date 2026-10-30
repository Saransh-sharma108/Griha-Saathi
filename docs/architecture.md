# Griha Saathi (गृह साथी) — System Architecture Documentation

> **Platform:** Trustworthy Rental Housing Discovery & Verification Platform for Bharat  
> **Target Regions:** Jammu & Kashmir, Haryana, Himachal Pradesh, Delhi, and Punjab  
> **Core Law:** Strict Zero-Synthetic Invariant for Live Listings (Directive 0)  
> **Architecture Topology:** Unified Full-Stack Repository (Client SPA + Node.js ESM REST Gateway + Shared Contracts)

---

## 1. Architectural Topology Overview

Griha Saathi is organized into three strictly defined zones:

```
                            ┌──────────────────────────────────────────────┐
                            │                BROWSER / CLIENT              │
                            │   React 19 + TypeScript + Vanilla Tokens     │
                            │   Vite Bundler + Hash Routing + Three.js     │
                            │   Path: /client                              │
                            └───────────────────────┬──────────────────────┘
                                                    │
                                         HTTPS / JSON REST API
                                                    │
                                                    ▼
                            ┌──────────────────────────────────────────────┐
                            │            NODE.JS / EXPRESS SERVER          │
                            │   NodeNext ESM + Express 5 + Security Gates  │
                            │   Path: /server                              │
                            │   - Auth & Bcrypt PIN / OTP Engine           │
                            │   - Property Discovery & Gated Submissions   │
                            │   - 4-Stage Verifications Ledger             │
                            │   - Bidirectional Connections & Messaging    │
                            │   - Saathi AI Engine (Gemini Tenancy Law)    │
                            │   - In-App Notifications Center              │
                            └───────────────┬──────────────┬───────────────┘
                                            │              │
                   ┌────────────────────────┘              └────────────────────────┐
                   ▼                                                                ▼
      ┌───────────────────────────┐                                   ┌───────────────────────────┐
      │     SHARED CONTRACTS      │                                   │     PERSISTENT STORAGE    │
      │   Pure Domain Types       │                                   │   - Disk: properties.json │
      │   i18n (EN, HI, HI-EN)    │                                   │   - Uploads: /uploads/    │
      │   Home DNA Matcher Engine │                                   │   - Relational (Target):  │
      │   Path: /shared           │                                   │     PostgreSQL Schema     │
      └───────────────────────────┘                                   └───────────────────────────┘
```

### Zone 1: Frontend Application (`client/`)
- **Technology:** React 19 (`^19.3.1`), TypeScript (`^7.0.2`), Vite (`^8.3.4`), Three.js (`^0.186.1`), Lucide Icons (`^1.59.0`).
- **Entry Points:**
  - `client/index.html`: Vite HTML mount template.
  - `client/src/main.tsx`: React DOM client hydration entry point.
  - `client/src/App.tsx`: Master layout coordinator, stationary background mounter, authentication state manager, and hash routing controller.
- **Routing:** Robust client-side hash routing (`#home`, `#find-property`, `#verifications`, `#connections`, `#saathi-ai`, `#help`, `#dashboard`, `#listing-property`).
- **Styling & Theme:** Pure vanilla CSS in `client/src/index.css` (170 KB) utilizing custom properties (`--gs-forest-deep`, `--gs-sage-light`, `--gs-cream-sand`, etc.) with responsive breakpoints, WCAG 2.2 AA accessibility features (keyboard skip links), and zero runtime CSS overhead.
- **Visuals & 3D:** Three.js procedural architectural visualizations (`client/src/components/ArchitecturalCanvas3D.tsx`, `client/src/components/CardTilt3D.tsx`).
- **Feature Directories:** Preserved feature domains such as `client/src/components/homeDna/` and isolated synthetic demo catalogs (`client/src/data/demoProperties.ts`).

### Zone 2: Backend Application (`server/`)
- **Technology:** Node.js (ESM `"type": "module"`), Express 5 (`^5.3.0`), TypeScript (NodeNext resolution), `tsx` (development), bcryptjs (`^3.0.3`), nodemailer (`^10.1.2`).
- **Entry Point:** `server/src/index.ts` (development) and `server/src/index.js` (production).
- **Dual-Role Production Host:** Express serves both the `/api/*` REST endpoints, uploaded photos from `/uploads/photos/*`, and the compiled frontend build from `client/dist/` with an SPA catch-all fallback for non-API routes.
- **Core Modules:**
  - `server/src/auth.ts`: Multi-role identity, 4-digit PIN setup/login, 5-attempt/15-min lockout, OTP verification tokens, session lifecycle, DPDP masking.
  - `server/src/otpService.ts`: Bcrypt-hashed OTP generation, 5-minute TTL, 60s resend cooldown, SMS/email gateway dispatch abstractions.
  - `server/src/properties.ts`: Property queries, multi-dimensional filtering, 60-day availability freshness rules, draft autosave, fraud reporting, owner appeals, saved searches.
  - `server/src/propertyDataEngine/`: Multi-adapter ingestion engine (First-Party Submissions, Data.gov.in, State RERA, Partner Syndication) enforcing the Directive 0 Zero-Synthetic Invariant.
  - `server/src/verifications.ts` & `verificationService.ts`: 4-stage verification ledger, reviewer queue isolation, self-approval prevention.
  - `server/src/connections.ts`: Tenant-landlord connection requests, direct messaging, visit scheduling, rescheduling, cancellations, user blocking.
  - `server/src/ai.ts` & `saathiAiService.ts`: Saathi AI assistant grounded in the Model Tenancy Act 2021 and verified platform inventory.
  - `server/src/notifications.ts`: In-app notification center with read states and audit dispatch.
  - `server/src/storageService.ts`: Safe local file uploads (`uploads/photos` and `uploads/documents`) with MIME verification and SHA-256 integrity hashing.
  - `server/src/db.ts`: In-memory database with automatic serialization to `server/data/properties.json`.

### Zone 3: Shared Contracts & Utilities (`shared/`)
- **Quarantine Rule:** `shared/` contains zero browser-specific code and zero server-specific code. It is imported by both `client/` and `server/`.
- **Modules:**
  - `shared/types.ts` (916 lines): Domain models, role types, property schemas, verification records.
  - `shared/i18n.ts` (1,781 lines): Localization dictionaries in English (`en`), Hindi (`hi`), and Hinglish (`hi-en`).
  - `shared/homeDnaEngine.ts` (416 lines): Deterministic preference weighting and scoring algorithm with invariant `norm_budget + norm_space + norm_location = 1.0`.

---

## 2. Directory Structure Blueprint

```
Op-Griha-Saathi/
├── .github/workflows/ci.yml       # GitHub Actions CI build and test runner
├── .vscode/                       # VS Code launch and task configs
├── client/                        # Frontend Application
│   ├── dist/                      # Production client bundle (vite build)
│   ├── public/                    # Static client assets (images, icons)
│   ├── src/                       # Frontend source
│   │   ├── assets/                # High-res imported photography
│   │   ├── components/            # Reusable UI components
│   │   │   └── homeDna/           # Home DNA Studio feature components
│   │   ├── data/                  # Isolated synthetic demo catalog
│   │   ├── pages/                 # 8 canonical page sections
│   │   ├── App.tsx                # Application root & hash router
│   │   ├── index.css              # Global styles & design tokens
│   │   ├── main.tsx               # Client hydration entry
│   │   └── vite-env.d.ts
│   └── index.html                 # Vite SPA HTML entry
├── docs/                          # Architecture, deployment, and schema docs
├── logs/                          # Runtime logs (start.ps1)
├── public/                        # Public assets root
├── scripts/                       # Dev and browser utilities
├── server/                        # Backend Application
│   ├── data/                      # Persistent JSON storage (properties.json)
│   ├── src/                       # Backend source
│   │   ├── propertyDataEngine/    # Multi-adapter property engine
│   │   ├── tests/                 # 10 automated test suites
│   │   ├── ai.ts                  # Saathi AI router
│   │   ├── auth.ts                # Auth router
│   │   ├── connections.ts         # Connections router
│   │   ├── db.ts                  # In-memory database engine
│   │   ├── index.ts               # Server entry point
│   │   ├── middleware.ts          # Auth & security middleware
│   │   ├── notifications.ts       # Notifications router
│   │   ├── otpService.ts          # OTP service
│   │   ├── properties.ts          # Properties router
│   │   ├── providers.ts           # Providers router
│   │   ├── saathiAiService.ts     # Gemini AI service
│   │   ├── storageService.ts      # Storage service
│   │   ├── verifications.ts       # Verifications router
│   │   └── verificationService.ts # Verification service
│   └── tsconfig.json              # Server TypeScript config
├── shared/                        # Shared domain contracts
│   ├── homeDnaEngine.ts           # Home DNA Studio matching engine
│   ├── i18n.ts                    # Multilingual dictionaries
│   └── types.ts                   # Domain types & interfaces
├── uploads/                       # User upload storage
│   ├── documents/                 # Private PDF/document store
│   └── photos/                    # Public property photos
├── .env.example                   # Environment variable template
├── .gitignore                     # Git ignore rules
├── index.html                     # Desktop launcher / onboarding splash page
├── package.json                   # Root package manifest & scripts
├── package-lock.json              # Pinned npm dependencies
├── README.md                      # Project documentation
├── start.cmd                      # Windows CMD launcher
├── start.ps1                      # PowerShell server lifecycle manager
├── tsconfig.json                  # Root TypeScript configuration
└── vite.config.ts                 # Vite bundler & proxy configuration
```

---

## 3. Security Architecture & Boundary Enforcement

1. **Authentication Security:**
   - 4-digit PINs are hashed using `bcryptjs` with salt rounds. Plain PINs are never stored or logged.
   - OTPs are hashed using bcrypt upon dispatch; consumed OTPs are immediately invalidated (replay defense).
   - 5 consecutive failed PIN attempts trigger a mandatory 15-minute lockout.
   - 60-second cooldown strictly enforced between OTP resend attempts.
2. **Access Control (RBAC & IDOR Defense):**
   - Role gates (`tenant`, `owner`, `verifier`, `admin`) strictly enforced on all privileged routes.
   - Self-approval prohibition: A property owner cannot verify their own listing or resolve their own appeals.
   - Insecure Direct Object Reference (IDOR) defense ensures users can only access their own drafts, saved searches, private messages, and notifications.
3. **Data Protection & Privacy (DPDP Act 2023 Compliance):**
   - Primary identifiers (phone numbers and emails) are masked across all public endpoints (e.g. `98******10`, `a***v@example.com`).
   - Private title deeds in `uploads/documents/` are accessible only to the listing owner and certified verifiers.
   - Exact cadastral coordinates are withheld until physical on-site inspection is certified.
4. **Network & HTTP Security:**
   - Security headers enforced on all responses: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Strict-Transport-Security` in production.
   - Express server signature disabled (`app.disable('x-powered-by')`).
   - CORS origin allowlist configured via `ALLOWED_ORIGINS`.
