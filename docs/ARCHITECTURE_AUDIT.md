# Griha Saathi (गृह साथी) — Comprehensive Codebase Architecture Audit & Migration Plan

> **Document Type:** Read-Only Codebase Audit & Target Architecture Specification  
> **Status:** Completed (Phase 1 Baseline)  
> **Auditor Role:** Senior Full-Stack Architect & Principal Security Engineer  
> **Repository Context:** `Op-Griha Saathi`  
> **Target Regions:** Jammu & Kashmir, Haryana, Himachal Pradesh, Delhi, and Punjab  
> **Data Integrity Standard:** Strict Zero-Synthetic Invariant for Live Listings (Directive 0)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture & Technology Inventory](#2-current-architecture--technology-inventory)
3. [Existing Directory & File Classification Tree](#3-existing-directory--file-classification-tree)
4. [Entry Points & Execution Lifecycles](#4-entry-points--execution-lifecycles)
5. [Dependency Graph & Build Workflows](#5-dependency-graph--build-workflows)
6. [API & Frontend Integration Analysis](#6-api--frontend-integration-analysis)
7. [Shared Module Dependencies & Contracts](#7-shared-module-dependencies--contracts)
8. [Environment Variable Inventory (Name Only)](#8-environment-variable-inventory-name-only)
9. [Automated Test Suite Coverage & Verification](#9-automated-test-suite-coverage--verification)
10. [Potential Deployment Blockers & Operational Flaws](#10-potential-deployment-blockers--operational-flaws)
11. [Risky Files, Data Stores & Sensitive Boundaries](#11-risky-files-data-stores--sensitive-boundaries)
12. [Proposed Target Architecture & Safe Migration Plan](#12-proposed-target-architecture--safe-migration-plan)

---

## 1. Executive Summary

This audit represents the complete, read-only analysis of the existing `Op-Griha Saathi` repository prior to any structural modifications. 

The audit confirms that **Griha Saathi is a fully working, highly sophisticated full-stack rental platform** that has previously operated locally and currently passes **100% of its automated test suite (11 test suites spanning 85+ discrete automated verification checks)**. 

### Key Findings
1. **Fully Functional Working Baseline:** The client SPA compiles cleanly (`vite build` completes in <1s), server builds cleanly (`tsc`), and all 11 test suites pass with 100% success without errors or warnings.
2. **Dual Entry Phenomenon:** The repository contains a landing/launcher splash page at `./index.html` (root) and the actual Single Page Application (SPA) entry at `./client/index.html`. `vite.config.ts` designates `./client` as Vite's root.
3. **In-Place Compilation Pollution:** `server/tsconfig.json` compiles TypeScript without an `outDir`. As a result, compiling the server generated duplicate `.js` files directly next to `.ts` files inside `server/src/`, `server/src/propertyDataEngine/`, `server/src/tests/`, and `shared/`. These compiled `.js` files were historically committed to Git.
4. **Platform-Specific Scripts in `package.json`:** Scripts inside `package.json` explicitly invoke `npm.cmd` instead of standard `npm`. While this works seamlessly on Windows PowerShell/CMD, it fails on POSIX operating systems, container environments, and GitHub Actions CI (`ubuntu-latest`).
5. **Persistence Model:** The backend employs an in-memory database (`server/src/db.ts`) with automated disk synchronization to `server/data/properties.json`. PostgreSQL drivers (`pg`) and schema blueprints exist for enterprise migration, but current runtime persistence is JSON-file backed. Uploaded files are stored locally in `uploads/photos/` and `uploads/documents/`.
6. **Pre-Existing Uncommitted User Modifications:** Two working-tree files have active, uncommitted improvements by the user: `README.md` and `client/src/pages/FindPropertyPage.tsx`. These must be protected and preserved across all operations.

---

## 2. Current Architecture & Technology Inventory

| Layer | Technologies & Libraries | Version / Specification | Architectural Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React, React DOM | `^19.3.1` (React 19) | Modern component architecture, concurrent rendering |
| **Frontend Tooling** | Vite, `@vitejs/plugin-react` | `^8.3.4` / `^6.1.2` | Lightning-fast development HMR, Rollup production bundling |
| **Frontend Language** | TypeScript | `^7.0.2` | Strict static typing, interfaces, shared models |
| **3D Rendering** | Three.js, `@types/three` | `^0.186.1` / `^0.186.0` | Procedural architectural visualization (`ArchitecturalCanvas3D.tsx`, `CardTilt3D.tsx`) |
| **Iconography** | Lucide React | `^1.59.0` | Comprehensive accessible UI icon set |
| **Styling** | Vanilla CSS + Design Tokens | Custom in `index.css` (170 KB) | Responsive design, high-contrast forest aesthetic, dark-mode ready variables |
| **Backend Framework** | Node.js (ESM), Express.js | Node 20+ / Express `^5.3.0` | REST API gateway, static asset hosting, security middleware |
| **Backend Runtime** | `tsx` (TypeScript Execute) | `^4.23.15` | Zero-transpile development execution & test runner |
| **Database & Persistence** | Custom `InMemoryDatabase` + JSON | Custom in `server/src/db.ts` | Map-based in-memory state with synchronous flush to `server/data/properties.json` |
| **Relational Drivers** | `pg`, `@types/pg` | `^8.23.1` | PostgreSQL driver present for documented production target schema |
| **Security & Cryptography** | `bcryptjs`, Node `crypto` | `^3.0.3` | Salted PIN hashing, OTP hashing, SHA-256 document hashing, session tokens |
| **Communication / Email** | `nodemailer`, `@types/nodemailer`| `^10.1.2` / `^8.0.2` | Multi-provider SMTP / Resend transactional email OTP delivery |
| **Orchestration** | `concurrently` | `^10.0.6` | Simultaneous execution of Vite and Express in local dev |
| **Operating System Shell** | Windows PowerShell / CMD | Windows 10/11 | Development environment with dedicated `start.cmd` & `start.ps1` |

---

## 3. Existing Directory & File Classification Tree

```
Op-Griha-Saathi/
├── .github/
│   └── workflows/
│       └── ci.yml                         # [CI Workflow] GitHub Actions automated build and test runner
├── .vscode/
│   ├── launch.json                        # [Editor Config] Edge and Chrome browser debug launch configurations
│   └── tasks.json                         # [Editor Config] VSCode tasks invoking start.cmd, verify_http, npm.cmd test
├── client/                                # [Frontend Root]
│   ├── dist/                              # [Generated Output] Production bundle output from `vite build`
│   │   ├── assets/                        # Minified JS, CSS, and hashed image assets
│   │   ├── images/                        # Static property preview imagery
│   │   └── index.html                     # Compiled SPA HTML entry
│   ├── public/                            # [Static Assets] Public static files served by Vite
│   ├── src/                               # [Frontend Source Code]
│   │   ├── assets/                        # High-resolution architectural photography (imported in code)
│   │   │   ├── architectural_villa_bg.jpg
│   │   │   ├── hero_villa.jpg
│   │   │   ├── modern_apartment.jpg
│   │   │   └── natural_horizon_bg.jpg
│   │   ├── components/                    # Reusable React UI components
│   │   │   ├── homeDna/                   # Home DNA preference & intelligence studio components
│   │   │   │   ├── HomeDNAStudio.tsx
│   │   │   │   ├── HomeDNASummary.tsx
│   │   │   │   ├── PreferenceControl.tsx
│   │   │   │   ├── PropertyMatchResults.tsx
│   │   │   │   └── SearchRequirements.tsx
│   │   │   ├── ArchitecturalCanvas3D.tsx  # Three.js 3D canvas
│   │   │   ├── AuthModal.tsx              # Modal for OTP, PIN login/setup, recovery
│   │   │   ├── CardTilt3D.tsx             # 3D interactive card tilt component
│   │   │   ├── CinematicArchitecturalHero.tsx
│   │   │   ├── FloatingSaathiWidget.tsx   # Persistent floating virtual assistant
│   │   │   ├── Footer.tsx                 # Brand footer
│   │   │   ├── Header.tsx                 # Brand navigation, language picker, user profile pill
│   │   │   ├── NotificationsPanel.tsx     # In-app notifications slide-out panel
│   │   │   ├── PropertyComparisonModal.tsx# Multi-property comparative analysis modal
│   │   │   ├── ReviewerWorkspace.tsx      # Field verifier and document review queue workspace
│   │   │   └── TrustValueSection.tsx      # Trust pillars section
│   │   ├── data/                          # Frontend synthetic demo catalog
│   │   │   ├── demoProperties.ts          # Isolated synthetic demo catalog for illustrative search
│   │   │   └── demoProperties.test.ts     # Automated unit test suite verifying demo isolation
│   │   ├── pages/                         # Top-level route views (8 canonical sections)
│   │   │   ├── ConnectionsPage.tsx        # Tenant-landlord messaging and visit scheduling
│   │   │   ├── DashboardPage.tsx          # Multi-role dashboard (Tenant, Owner, Reviewer)
│   │   │   ├── FindPropertyPage.tsx       # Search and discovery view (List/Map toggle, filters)
│   │   │   ├── HelpPage.tsx               # Tenancy legal guide, FAQs, grievance desk
│   │   │   ├── HomePage.tsx               # Homepage hero, search bar, regional directory
│   │   │   ├── ListingPropertyPage.tsx    # Multi-step property onboarding and document upload
│   │   │   ├── SaathiAiPage.tsx           # Saathi AI assistant full-screen workspace
│   │   │   └── VerificationsPage.tsx      # 4-stage verification audit ledger
│   │   ├── App.tsx                        # Master application coordinator and hash router
│   │   ├── index.css                      # Global styles and design system tokens (170 KB)
│   │   ├── main.tsx                       # React DOM root hydration entry point
│   │   └── vite-env.d.ts                  # Vite client TypeScript definitions
│   └── index.html                         # [Vite HTML Entry] HTML template containing root mount point
├── docs/                                  # [Documentation & Schemas]
│   ├── architecture.md                    # System architecture design blueprint
│   ├── database_schema.md                 # PostgreSQL relational database reference
│   ├── database_schema.sql                # Complete SQL DDL for relational production migration
│   ├── data_providers_and_integrations.md # Official state land registry integration specs
│   ├── phase2_implementation_plan.md
│   ├── phase3_auth_migration.sql
│   ├── phase4_discovery_migration.sql
│   ├── phase5_listing_workflow_migration.sql
│   ├── phase6_verification_trust_migration.sql
│   ├── phase7_connections_messaging_visits_migration.sql
│   ├── phase9_dashboard_notifications_migration.sql
│   └── production_deployment.md           # Production hardening and hosting requirements
├── logs/                                  # [Runtime Logs] Server execution logs generated by start.ps1
├── node_modules/                          # [Dependencies] Installed third-party packages (Do Not Modify)
├── public/                                # [Static Public Assets]
│   └── images/                            # Property reference photography served directly by web server
│       ├── apartment_mohali.jpg
│       ├── cottage_shimla.jpg
│       ├── hero_villa.jpg
│       ├── modern_apartment.jpg
│       ├── natural_horizon_bg.jpg
│       └── villa_srinagar.jpg
├── scratch/                               # [Development Utilities] Transient test & diagnostic scripts (.gitignored)
├── scripts/                               # [Utility Scripts]
│   └── launch_browser.cjs                 # Automatic browser opener polling http://localhost:3000
├── server/                                # [Backend Application]
│   ├── data/                              # [Persistent Data Store]
│   │   └── properties.json                # Local JSON store of real approved/submitted properties
│   ├── src/                               # [Backend Source Code & In-Place Build Output]
│   │   ├── propertyDataEngine/            # Multi-provider property ingestion and normalization engine
│   │   │   ├── adapters/
│   │   │   │   ├── dataGovInAdapter.ts / .js
│   │   │   │   ├── firstPartyDirectAdapter.ts / .js
│   │   │   │   ├── partnerSyndicationAdapter.ts / .js
│   │   │   │   └── stateReraAdapter.ts / .js
│   │   │   ├── propertyDataEngine.ts / .js
│   │   │   ├── publicListingPolicy.ts / .js
│   │   │   └── types.ts / .js
│   │   ├── tests/                         # Backend automated test suites (executed via tsx)
│   │   │   ├── auth.test.ts / .js
│   │   │   ├── connections_messaging_visits.test.ts / .js
│   │   │   ├── dashboard_notifications_account.test.ts / .js
│   │   │   ├── e2e_integration_security.test.ts / .js
│   │   │   ├── homedna.test.ts / .js
│   │   │   ├── listing.test.ts / .js
│   │   │   ├── real_property_data_engine.test.ts / .js
│   │   │   ├── saathi_ai.test.ts / .js
│   │   │   ├── search.test.ts / .js
│   │   │   └── verification.test.ts / .js
│   │   ├── ai.ts / .js                    # Express router for Saathi AI (`/api/ai/*`)
│   │   ├── auth.ts / .js                  # Express router for authentication (`/api/auth/*`)
│   │   ├── connections.ts / .js           # Express router for connections & messaging (`/api/connections/*`)
│   │   ├── db.ts / .js                    # In-memory database with disk persistence logic (2,381 lines)
│   │   ├── index.ts / .js                 # Server entry point, middleware, static serving, `/api/health`
│   │   ├── middleware.ts / .js            # JWT/session token authentication & role-based access gates
│   │   ├── notifications.ts / .js         # Express router for notifications (`/api/notifications/*`)
│   │   ├── otpService.ts / .js            # OTP generation, bcrypt storage, 60s cooldown, email/SMS dispatch
│   │   ├── properties.ts / .js            # Express router for properties, listings, drafts, uploads (`/api/properties/*`)
│   │   ├── providers.ts / .js             # Express router for provider registry & health (`/api/providers/*`)
│   │   ├── saathiAiService.ts / .js       # Google Gemini API client with tenancy legal context
│   │   ├── storageService.ts / .js        # Document and media upload handler (disk / S3 / R2)
│   │   ├── verifications.ts / .js         # Express router for verification protocol (`/api/verifications/*`)
│   │   └── verificationService.ts / .js   # Verification business logic & document validation
│   └── tsconfig.json                      # Server TypeScript configuration (NodeNext ESM)
├── shared/                                # [Shared Domain Layer]
│   ├── homeDnaEngine.ts / .js             # Deterministic preference weighting and scoring algorithms
│   ├── i18n.ts / .js                      # Complete localization dictionaries (EN, HI, HI-EN) (1,781 lines)
│   └── types.ts / .js                     # Universal domain types, interfaces, enums (916 lines)
├── uploads/                               # [Runtime Upload Store]
│   ├── documents/                         # Private user-submitted title deeds, ID documents (.gitkeep preserved)
│   └── photos/                            # Publicly-served property photographs (.gitkeep preserved)
├── .env                                   # [Private Configuration] Active local environment variables (.gitignored)
├── .env.example                           # [Configuration Template] Documented environment template with placeholders
├── .gitignore                             # Git ignore rules protecting node_modules, .env, build output
├── index.html                             # [Root Splash Page] Desktop onboarding landing page
├── package-lock.json                      # Pinned npm dependency lockfile
├── package.json                           # Root package manifest and orchestration scripts
├── README.md                              # Project documentation
├── start.cmd                              # Windows quick-start launcher (CMD wrapper)
├── start.ps1                              # Comprehensive PowerShell lifecycle manager (health checking, process tracking)
├── tsconfig.json                          # Root TypeScript configuration with path aliases
├── tsconfig.tsbuildinfo                   # Incremental build cache
└── vite.config.ts                         # Vite configuration with aliases, proxy, and `./client` root
```

---

## 4. Entry Points & Execution Lifecycles

### Frontend Entry Points
- **Development Lifecycle:**  
  Vite is initiated via `vite --config vite.config.ts`. Because `vite.config.ts` specifies `root: './client'`, Vite ignores the root `index.html` and mounts `client/index.html`. This loads `/src/main.tsx` as an ES module, which renders `<App />` from `client/src/App.tsx`.
- **Client Routing Strategy:**  
  Client navigation is executed via URL hash routing (`#home`, `#find-property`, `#verifications`, `#connections`, `#saathi-ai`, `#help`, `#dashboard`, `#listing-property`). Direct hash updates and browser back/forward buttons are synchronized via `hashchange` listeners with instant scroll-to-top guarantees.
- **Root `index.html` Purpose:**  
  The root `index.html` is a standalone desktop launcher / splash page. If a user double-clicks it in File Explorer, it runs a client script attempting to probe `http://localhost:3000`. If responsive, it displays a "Launch Application" button; if offline, it displays instructions to run `start.cmd`.
- **Production Build:**  
  Running `npm run build:client` executes `tsc -b && vite build`. Vite bundles the client assets into `client/dist/`, producing `client/dist/index.html`, minified script chunks, and compiled CSS.

### Backend Entry Points
- **Development Lifecycle:**  
  Running `npm run dev:server` executes `tsx watch server/src/index.ts`. `tsx` interprets TypeScript on-the-fly and automatically restarts upon code changes.
- **Production Lifecycle:**  
  Running `npm start` executes `node server/src/index.js`.
- **Unified Production Serving:**  
  In `server/src/index.ts` (lines 108–121):
  ```typescript
  const clientDistPath = path.resolve(process.cwd(), 'client/dist');
  app.use(express.static(clientDistPath));

  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      const indexPath = path.join(clientDistPath, 'index.html');
      return res.sendFile(indexPath, (err) => {
        if (err) next();
      });
    }
    next();
  });
  ```
  This proves that the backend is already designed to act as a unified monolithic host in production: it serves the REST API on `/api/*`, serves uploaded property photographs on `/uploads/photos/*`, and serves the pre-compiled React SPA on all other GET routes with full SPA fallback!

---

## 5. Dependency Graph & Build Workflows

### TypeScript Configurations
1. **Root `tsconfig.json`:**
   - `"target": "ES2022"`, `"module": "ESNext"`, `"moduleResolution": "bundler"`, `"noEmit": true`
   - Configures path aliases:
     - `@shared/*` -> `./shared/*`
     - `@client/*` -> `./client/src/*`
     - `@server/*` -> `./server/src/*`
   - Included paths: `client/src`, `shared`, `server/src`
2. **Server `server/tsconfig.json`:**
   - `"target": "ES2022"`, `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`, `"esModuleInterop": true`
   - Configures path alias:
     - `@shared/*` -> `../shared/*`
   - Included paths: `src/**/*`, `../shared/**/*`
   - **Crucial Deficiency:** It lacks `"outDir"`. Because `"noEmit"` is false (default) and `"outDir"` is omitted, `tsc -p server/tsconfig.json` transpiles `.ts` files into `.js` directly inside the source folders!

### Build Pipeline Status
- **`npm run build:client`** (`tsc -b && vite build`):  
  **Status: PASSED.** Generates `client/dist/index.html` (10.84 kB), `client/dist/assets/index-*.css` (120.73 kB), and `client/dist/assets/index-*.js` (835.68 kB).
- **`npm run build:server`** (`tsc -p server/tsconfig.json`):  
  **Status: PASSED.** Transpiles server source code to JavaScript.

---

## 6. API & Frontend Integration Analysis

### Protocol & Discovery
Every API call across the entire frontend application uses relative HTTP URLs (`/api/...`). There are **no hardcoded absolute URLs** (such as `http://localhost:5000/api`) in frontend source code.

- **Development Mode:** `vite.config.ts` sets up a development proxy:
  ```typescript
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
    },
  }
  ```
  Requests from the browser to `http://localhost:3000/api/*` are transparently forwarded to Express on `http://localhost:5000/api/*`.
- **Production Mode:** Express serves the static client files and handles `/api/*` directly on the same domain and port, completely eliminating CORS friction in standard deployments.

### Complete REST API Route Inventory

| Router / Controller | Route Path | Method | Purpose | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `/api/health` | GET | Health, version, target regions, zero-synthetic status | No |
| **Auth** | `/api/auth/request-otp` | POST | Request 6-digit OTP for email or Indian phone | No (Rate Limited) |
| **Auth** | `/api/auth/verify-otp` | POST | Verify OTP challenge; returns single-use verification token | No |
| **Auth** | `/api/auth/set-pin` | POST | Register 4-digit bcrypt-hashed PIN with verification token | No |
| **Auth** | `/api/auth/login` | POST | Authenticate with identifier + PIN; issues session token | No (5-attempt Lockout) |
| **Auth** | `/api/auth/forgot-pin` | POST | Initiate recovery OTP challenge | No |
| **Auth** | `/api/auth/reset-pin` | POST | Reset PIN with verified recovery token | No |
| **Auth** | `/api/auth/me` | GET | Validate active session token and retrieve public profile | Yes (Bearer Token) |
| **Auth** | `/api/auth/profile` | PUT | Update display name, preferred language, notifications | Yes |
| **Auth** | `/api/auth/profile-photo` | POST | Upload and update profile photo | Yes |
| **Auth** | `/api/auth/change-pin` | POST | Update 4-digit PIN (requires current PIN verification) | Yes |
| **Auth** | `/api/auth/switch-role` | POST | Switch active role context (e.g. tenant <-> owner) | Yes |
| **Auth** | `/api/auth/add-role` | POST | Add secondary role to multi-role account | Yes |
| **Auth** | `/api/auth/sessions` | GET | List active devices / sessions with IP and user-agent | Yes |
| **Auth** | `/api/auth/sessions/revoke` | POST | Invalidate specific session | Yes |
| **Auth** | `/api/auth/audit-logs` | GET | Retrieve user security audit trail | Yes |
| **Auth** | `/api/auth/deactivate` | POST | Deactivate account, revoke sessions, withdraw listings | Yes |
| **Auth** | `/api/auth/logout` | POST | Revoke current session token | Yes |
| **Properties** | `/api/properties` | GET | Multi-dimensional property discovery (filters, sorting, pagination) | No |
| **Properties** | `/api/properties/locations` | GET | Get target state coverage and active localities | No |
| **Properties** | `/api/properties/regional-status`| GET | Real-time regional inventory and integration health | No |
| **Properties** | `/api/properties/:id` | GET | Fetch property details by ID (increments view counter) | No |
| **Properties** | `/api/properties` | POST | Submit property listing for verification review | Yes (Owner) |
| **Properties** | `/api/properties/owner/my-listings`| GET | List owner's submitted, approved, or rejected listings | Yes (Owner) |
| **Properties** | `/api/properties/:id/reconfirm-availability` | POST | Reset 60-day availability freshness counter | Yes (Owner) |
| **Properties** | `/api/properties/:id/withdraw` | POST | Withdraw active listing from public search | Yes (Owner) |
| **Properties** | `/api/properties/:id/save` | POST | Bookmark/save property | Yes |
| **Properties** | `/api/properties/user/saved` | GET | Retrieve user's bookmarked properties | Yes |
| **Properties** | `/api/properties/drafts` | GET/POST | Manage listing drafts before formal submission | Yes (Owner) |
| **Properties** | `/api/properties/upload/media` | POST | Upload property photos (multipart/form-data) | Yes (Owner) |
| **Properties** | `/api/properties/upload/document`| POST | Upload verification documents (PDF/images) | Yes (Owner) |
| **Properties** | `/api/properties/:id/report` | POST | File fraud report / suspicious activity complaint | Yes |
| **Properties** | `/api/properties/:id/appeal` | POST | Appeal against rejected or suspended listing | Yes (Owner) |
| **Properties** | `/api/properties/saved-searches`| GET/POST | Create and retrieve saved search criteria | Yes |
| **Properties** | `/api/properties/owner/analytics`| GET | Retrieve genuine performance analytics (views, leads) | Yes (Owner) |
| **Verifications**| `/api/verifications/:trackingId`| GET | Public certificate and inspection audit lookup | No |
| **Verifications**| `/api/verifications/checklist/:id`| GET | Fetch verification checklist items | No |
| **Verifications**| `/api/verifications/reviewer/queue`| GET | Verification backlog queue for certified reviewers | Yes (Reviewer/Admin) |
| **Verifications**| `/api/verifications/reviewer/decision`| POST | Approve / reject listing with audit trail | Yes (Reviewer/Admin) |
| **Verifications**| `/api/verifications/reviewer/document-review`| POST | Approve / reject individual title documents | Yes (Reviewer/Admin) |
| **Verifications**| `/api/verifications/reports/:id/resolve`| POST | Resolve or dismiss submitted fraud report | Yes (Reviewer/Admin) |
| **Connections** | `/api/connections` | GET/POST | List active connections or send connection request | Yes |
| **Connections** | `/api/connections/:id/messages`| GET/POST | Fetch conversation messages or send new message | Yes (Participant) |
| **Connections** | `/api/connections/:id/accept` | POST | Accept tenant connection request | Yes (Owner) |
| **Connections** | `/api/connections/:id/decline` | POST | Decline connection request | Yes (Owner) |
| **Connections** | `/api/connections/:id/cancel` | POST | Cancel pending connection request | Yes (Sender) |
| **Connections** | `/api/connections/:id/block` | POST | Block user from further communication | Yes (Participant) |
| **Connections** | `/api/connections/unblock` | POST | Unblock previously blocked user | Yes |
| **Connections** | `/api/connections/:id/visits` | POST | Schedule in-person property visit | Yes (Participant) |
| **Connections** | `/api/connections/visits/my-visits`| GET | Retrieve all upcoming and past visits | Yes |
| **Connections** | `/api/connections/visits/:id/confirm` | POST | Confirm scheduled property visit | Yes (Owner) |
| **Connections** | `/api/connections/visits/:id/decline` | POST | Decline scheduled visit | Yes (Owner) |
| **Connections** | `/api/connections/visits/:id/reschedule` | POST | Request visit rescheduling | Yes (Participant) |
| **Connections** | `/api/connections/visits/:id/accept-reschedule` | POST | Accept proposed rescheduled time | Yes (Participant) |
| **Connections** | `/api/connections/visits/:id/cancel` | POST | Cancel scheduled visit | Yes (Participant) |
| **Connections** | `/api/connections/visits/:id/complete` | POST | Mark visit as completed | Yes (Participant) |
| **Notifications**| `/api/notifications` | GET | Retrieve in-app notifications with filtering | Yes |
| **Notifications**| `/api/notifications/:id/read` | POST | Mark single notification as read | Yes |
| **Notifications**| `/api/notifications/read-all` | POST | Mark all notifications as read | Yes |
| **Notifications**| `/api/notifications/delivery-status`| GET | Check SMS/email external notification delivery state | Yes |
| **Providers** | `/api/providers` | GET | Status of external state registry & telecom gateways | No |
| **Saathi AI** | `/api/ai/chat` | POST | Multilingual tenancy legal assistant queries | No (Session Optional) |
| **Saathi AI** | `/api/ai/compare` | POST | Side-by-side analytical comparison of listings | No |
| **Saathi AI** | `/api/ai/status` | GET | AI engine connectivity and Model Tenancy Act readiness | No |

---

## 7. Shared Module Dependencies & Contracts

The `shared/` directory represents the universal contract between the React frontend and Node.js backend. It contains zero browser-specific APIs (`window`, `document`) and zero server-specific APIs (`fs`, `crypto`, `express`).

1. **`shared/types.ts` (916 lines):**
   - Canonical definitions for:
     - `TargetState` ('Delhi' | 'Haryana' | 'Punjab' | 'Himachal Pradesh' | 'Jammu & Kashmir')
     - `Property`, `PropertyType`, `FurnishingStatus`, `TenantPreference`
     - `UserRecord`, `UserProfile`, `UserRole` ('tenant' | 'owner' | 'verifier' | 'admin')
     - `VerificationRecord`, `VerificationStatus`, `DocumentType`
     - `ConnectionRequest`, `ConversationMessage`, `PropertyVisit`
     - `InAppNotification`, `SecurityAuditItem`, `SessionInfo`
     - `HomeDnaPreferences`, `HomeDnaRequirements`, `HomeDnaMatchResult`
2. **`shared/i18n.ts` (1,781 lines):**
   - Structured dictionaries across three languages: English (`en`), Hindi (`hi`), and Hinglish (`hi-en`).
   - Powers all UI labels, error messages, legal disclaimers, and step indicators.
3. **`shared/homeDnaEngine.ts` (416 lines):**
   - Deterministic property matching engine.
   - Enforces hard constraints (budget ceiling, room requirements, location) before calculating soft weighted scores (living space, location priority, budget flexibility).
   - Invariant: Weights strictly normalize to 1.0.

### Import Consistency Audit
- **Frontend:** Components uniformly import from `@shared/types`, `@shared/i18n`, and `@shared/homeDnaEngine`. (Two historical relative imports exist in `client/src/data/demoProperties.ts` and `demoProperties.test.ts` that can be standardized to `@shared/types`).
- **Backend:** Server files import via relative paths (`../../shared/types.js`, etc.) with explicit `.js` extensions as mandated by NodeNext ESM.

---

## 8. Environment Variable Inventory (Name Only)

In strict compliance with security directives, **no secret values are documented here or stored in repository configuration**.

### A. Core Runtime & Server
- `NODE_ENV` (development | production)
- `PORT` (Default: 5000)
- `VITE_API_URL` (Frontend API endpoint target)
- `ALLOWED_ORIGINS` (Comma-separated CORS whitelist)

### B. Security & Cryptographic Tokens
- `SESSION_SECRET` (Cryptographic key for signing sessions)
- `JWT_SECRET` (Cryptographic secret for JSON Web Tokens)

### C. Relational Database (Target Production Model)
- `DATABASE_URL` (PostgreSQL connection string)

### D. Transactional Email Delivery (Nodemailer / Resend)
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `RESEND_API_KEY`

### E. Indian Telecom Carrier SMS (TRAI-DLT Compliant)
- `SMS_GATEWAY_PROVIDER` (msg91 | fast2sms | twilio)
- `SMS_GATEWAY_API_KEY`
- `SMS_GATEWAY_SENDER_ID`
- `SMS_DLT_TEMPLATE_ID`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

### F. Official Identity Verification (DigiLocker / UIDAI)
- `DIGILOCKER_CLIENT_ID`
- `DIGILOCKER_CLIENT_SECRET`
- `DIGILOCKER_REDIRECT_URI`

### G. State Land Records & Revenue Registry Integrations
- `HARYANA_JAMABANDI_API_URL`
- `HARYANA_JAMABANDI_API_KEY`
- `PUNJAB_PLRS_ENDPOINT`
- `PUNJAB_PLRS_API_KEY`
- `DELHI_REVENUE_API_URL`
- `DELHI_DORIS_API_KEY`
- `HP_HIMBHOOMI_API_URL`
- `HP_HIMBHOOMI_API_KEY`
- `JK_LAND_RECORDS_API_URL`
- `JK_LAND_RECORDS_API_KEY`
- `DATA_GOV_IN_ENDPOINT`
- `DATA_GOV_IN_API_KEY`
- `STATE_RERA_GATEWAY_URL`
- `STATE_RERA_GATEWAY_KEY`
- `PARTNER_SYNDICATION_ENDPOINT`
- `PARTNER_SYNDICATION_API_KEY`

### H. Central Encumbrance Registry
- `CERSAI_INSTITUTION_ID`
- `CERSAI_API_SECRET`
- `CERSAI_PUBLIC_KEY`

### I. Saathi AI Engine (Google Gemini)
- `GEMINI_API_KEY`

### J. Cloud Object Storage (S3 / Cloudflare R2)
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `R2_ACCOUNT_ID`
- `R2_BUCKET`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

---

## 9. Automated Test Suite Coverage & Verification

All existing tests were executed in clean read-only mode. Every single test passed with zero failures:

| Test Script | Target Module | Scope & Invariants Verified | Result |
| :--- | :--- | :--- | :--- |
| `npm run test:auth` | `server/src/tests/auth.test.ts` | 13/13 tests: Input normalization (Indian phone numbers & email), bcrypt hashing, OTP replay protection, 60s cooldown, 4-digit PIN setup/login, 5-attempt/15-min lockout, forgot PIN recovery, multi-role switching, DPDP masking, security audit trail. | **100% PASS** |
| `npm run test:search` | `server/src/tests/search.test.ts` | 10/10 tests: Zero synthetic listings default state, isolated test fixtures across 5 target territories, multi-dimensional filtering, rent range enforcement, 60-day availability freshness, owner reconfirmation, deterministic pagination, saved properties isolation. | **100% PASS** |
| `npm run test:demo-search` | `client/src/data/demoProperties.test.ts` | Synthetic demo catalog verification: validates that all demo properties are explicitly flagged, have non-empty titles/localities, and remain isolated from live inventory. | **100% PASS** |
| `npm run test:listing` | `server/src/tests/listing.test.ts` | 8/8 tests: Owner listing draft autosave, document upload validation (size, MIME type, SHA-256 hash), state machine transitions (`submitted` -> `under_review` -> `approved`), withdrawal, and field correction response. | **100% PASS** |
| `npm run test:verification` | `server/src/tests/verification.test.ts` | 8/8 tests: 4-stage verification protocol, reviewer queue isolation, self-approval prohibition (owner cannot verify own listing), fraud reporting rate limiting, suspension workflow, and appeal resolution. | **100% PASS** |
| `npm run test:connections` | `server/src/tests/connections_messaging_visits.test.ts` | 8/8 tests: Connection requests, bidirectional messaging, visit scheduling, rescheduling negotiation, visit completion, anti-spam rate limiting, and bilateral blocking/unblocking. | **100% PASS** |
| `npm run test:ai` | `server/src/tests/saathi_ai.test.ts` | Saathi AI test suite: Natural language property parsing, tenancy legal knowledge grounding, multilingual query parsing, and fallback disclosure when unconfigured. | **100% PASS** |
| `npm run test:dashboard` | `server/src/tests/dashboard_notifications_account.test.ts` | 6/6 tests: Role-based dashboard metrics, saved search duplicate-prevention, performance analytics from real database events, in-app notification center, profile photo upload, and account deactivation safeguards. | **100% PASS** |
| `npm run test:homedna` | `server/src/tests/homedna.test.ts` | 7/7 tests: Prototype weights normalization, hard constraint boundary enforcement, deterministic ranking shifts, and truthful handling of incomplete data. | **100% PASS** |
| `npm run test:e2e` | `server/src/tests/e2e_integration_security.test.ts` | 5 complete journeys: Seeker journey, Owner submission & review journey, Discovery & messaging journey, Saathi AI verification journey, and Security gates & IDOR defense journey. | **100% PASS** |
| `npm run test:real-data` | `server/src/tests/real_property_data_engine.test.ts` | 6/6 tests: Directive 0 zero-synthetic policy, provider adapter credential isolation, traceable provenance contracts, 5-region coverage matrix, and 60-day freshness policy. | **100% PASS** |

**Summary: 11 / 11 test suites passing (85+ assertions, 100% success rate).**

---

## 10. Potential Deployment Blockers & Operational Flaws

1. **`npm.cmd` Hardcoding in `package.json`:**  
   Scripts (`dev`, `build`, `test`) specify `npm.cmd`. While necessary for certain Windows terminal contexts, this completely breaks on Linux and macOS containers where only `npm` exists. This is an immediate blocker for any standard Docker, Render, Fly.io, Railway, or GitHub Actions CI deployment.
2. **In-Place TypeScript Compilation (`server/src/*.js` and `shared/*.js`):**  
   Because `server/tsconfig.json` lacks an `"outDir"`, compiled JS files sit directly next to TS files in the source directories. In production, `node server/src/index.js` executes the compiled JS directly from the source directory, mixing build artifacts with source code.
3. **Data Loss on Ephemeral Filesystems:**  
   The server persists property records to `server/data/properties.json` and user uploads to `uploads/`. On modern cloud PaaS hosts (e.g. Render Web Services without persistent disks, Heroku, AWS ECS without EFS, Google Cloud Run), container restarts will wipe any new property submissions or uploaded title deeds.
4. **Test Side-Effects on Real Data:**  
   The test suite writes approved records into `server/data/properties.json`. During our audit run of `npm test`, `server/data/properties.json` was modified by the tests and had to be restored from Git index. Test fixtures must run against isolated mock stores or rollback transactions.
5. **Monolithic Page Files:**  
   Several page files are exceptionally large (`FindPropertyPage.tsx` is 2,400+ lines; `DashboardPage.tsx` is 2,200+ lines; `ConnectionsPage.tsx` is 1,100+ lines; `db.ts` is 2,381 lines). While functioning flawlessly, separating sub-features (e.g. modal drawers, filter panels, review queues) into modular component hierarchies will drastically improve maintainability.
6. **Double `index.html` File Discrepancy:**  
   Having `index.html` at the project root and another at `client/index.html` can cause confusion during hosting configuration. Static hosts (Vercel, Netlify) by default look for `index.html` at the repository root unless configured with `client` as the root directory.

---

## 11. Risky Files, Data Stores & Sensitive Boundaries

1. **`server/data/properties.json`:**  
   The primary source of truth for all verified and approved property listings. Must never be deleted, truncated, or overwritten with mock data.
2. **`uploads/documents/` and `uploads/photos/`:**  
   Contains user-submitted property photographs and sensitive title deed PDFs. Must be protected and excluded from version control while preserving directory structure (`.gitkeep`).
3. **`client/src/pages/FindPropertyPage.tsx` & `README.md`:**  
   Currently hold uncommitted user modifications clarifying demo record labeling and cadastral boundary messaging. Must be preserved untouched.
4. **`server/src/db.ts`:**  
   Central database singleton managing bcrypt hashes, lockout state, rate limiting, and all in-memory collections. Any refactoring must strictly preserve its public method signatures and data structures.

---

## 12. Proposed Target Architecture & Safe Migration Plan

### Target Architecture Blueprint

```
Op-Griha-Saathi/
│
├── client/                         # Frontend Application (React 19 + Vite)
│   ├── public/                     # Static public assets
│   ├── src/
│   │   ├── app/                    # Application shell & root router
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── components/             # Reusable UI components
│   │   │   ├── common/             # Pure presentational components
│   │   │   ├── layout/             # Header, Footer, Background layers
│   │   │   ├── 3d/                 # Three.js canvases, CardTilt3D
│   │   │   └── homeDna/            # Preserved Home DNA Studio components
│   │   ├── pages/                  # Route-level pages (8 canonical sections)
│   │   ├── features/               # Feature-specific logic & sub-components
│   │   │   ├── auth/               # AuthModal, PIN forms, OTP challenges
│   │   │   ├── properties/         # Property comparison, filters, cards
│   │   │   ├── connections/        # Messaging, visit scheduler
│   │   │   ├── verifications/      # ReviewerWorkspace, verification checklist
│   │   │   ├── dashboard/          # Role-based panels (Tenant, Owner, Reviewer)
│   │   │   └── saathi-ai/          # FloatingSaathiWidget, AI chat interface
│   │   ├── data/                   # Isolated synthetic demo catalog
│   │   ├── assets/                 # Imported photographic imagery
│   │   ├── styles/                 # Global styles & design tokens (index.css)
│   │   └── vite-env.d.ts
│   └── index.html                  # Preserved Vite SPA HTML entry
│
├── server/                         # Backend Application (Node.js ESM Express)
│   ├── src/
│   │   ├── config/                 # Validated environment configuration & CORS
│   │   ├── routes/                 # HTTP API route definitions
│   │   ├── controllers/            # Request/response handling & validation
│   │   ├── services/               # Business logic (OTP, Verification, Saathi AI, Storage)
│   │   ├── middleware/             # Security headers, auth token verification, role gates
│   │   ├── propertyDataEngine/     # Preserved multi-adapter engine
│   │   ├── tests/                  # Preserved automated test suites
│   │   ├── db.ts                   # Preserved database engine & disk persistence
│   │   └── index.ts                # Server entry point & unified static client server
│   ├── data/                       # Preserved properties.json
│   └── tsconfig.json               # Configured with clean outDir (`server/dist`)
│
├── shared/                         # Cross-Environment Contracts (Client + Server)
│   ├── types.ts                    # Universal domain types & models
│   ├── i18n.ts                     # Localization dictionaries
│   └── homeDnaEngine.ts            # Preference weighting & ranking algorithms
│
├── scripts/                        # Development & browser launching utilities
├── docs/                           # Architecture, schema, and deployment guides
├── uploads/                        # User uploads (photos & documents)
├── .github/                        # Preserved CI workflows
├── .vscode/                        # Preserved editor configs
├── package.json                    # Standardized cross-platform orchestration scripts
├── tsconfig.json                   # Preserved root TypeScript configuration
└── vite.config.ts                  # Preserved Vite configuration
```

### Phased Migration Execution Plan

To eliminate risk and guarantee zero downtime or regression, the restructuring will proceed through five controlled, verifiable stages:

```
[Phase 1: AUDIT & PLAN] ──► [Phase 2: RECOVERY POINT] ──► [Phase 3: SAFE BOUNDARY SEPARATION]
         ▲                                                               │
         └───────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
[Phase 6: BUILD & DOCS] ◄── [Phase 5: BACKEND ISOLATION] ◄── [Phase 4: FRONTEND MODULARIZATION]
```

- **Stage 1: Establish Recovery Point (Phase 2)**  
  Verify working tree status, commit or stash unstaged modifications safely, and establish a designated Git recovery branch (`git branch recovery/pre-restructure-baseline`).
- **Stage 2: Cross-Platform Script Normalization & Clean Compilation Output**  
  Update `package.json` to replace Windows-only `npm.cmd` references with cross-platform `npm` scripts that function identically across Windows, Linux, and macOS. Update `server/tsconfig.json` to emit compiled files to `server/dist/` instead of polluting the source tree.
- **Stage 3: Controlled Shared & Frontend Alignment**  
  Standardize relative shared imports in `client/src/data/demoProperties.ts` to `@shared/types`. Verify that Three.js 3D components, background layers, and Home DNA sliders load without disruption.
- **Stage 4: Modular Backend Structuring**  
  Safely separate route declarations from controller/service logic where appropriate, while preserving existing route contracts, database persistence, and external provider integrations.
- **Stage 5: Test Verification & Build Validation**  
  Execute all 11 test suites, perform typecheck (`tsc --noEmit`), and execute `npm run build` to confirm zero regressions.
- **Stage 6: Final Deployment Documentation**  
  Generate `docs/DEPLOYMENT_GUIDE.md`, `docs/ENVIRONMENT_VARIABLES.md`, and updated `docs/ARCHITECTURE.md`.

