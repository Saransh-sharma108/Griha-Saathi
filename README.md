# 🏡 Griha Saathi (गृह साथी)
### Trustworthy, Cadastral-Verified Rental Housing Discovery Platform

Griha Saathi is a rental-search and verification platform for Northern India (Delhi, Haryana, Punjab, Himachal Pradesh, and Jammu & Kashmir). Find Property opens an explicitly labeled local synthetic demo catalog; it is isolated from approved first-party submissions and is never represented as live rental inventory.

---

## 🌟 Key Capabilities

- **Cadastral & Land Revenue Verification:** Cross-referenced against state revenue registries (Haryana Jamabandi, Punjab PLRS Fard Kendra, Delhi DORIS/DDA, Himachal Pradesh Himbhoomi, and J&K Aapki Zameen Aapki Nigrani).
- **Model Tenancy Act (MTA) 2021 Compliance:** Enforces statutory residential security deposit caps (maximum 2 months rent).
- **DPDP Act 2023 Privacy Compliance:** Automatic masking of personal contact details and private document isolation.
- **Saathi AI Tenant & Property Assistant:** Intelligent conversational guidance, lease agreement advisory, and side-by-side verified comparison engine.
- **Home DNA Lifestyle Matching:** Multi-dimensional compatibility matching between tenant preferences and verified housing attributes.
- **Dark Forest Green Aesthetic:** High-contrast, accessibility-focused visual design with Manrope & Inter premium brand typography.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Vanilla CSS Design System, Lucide Icons
- **Backend:** Node.js, Express, TypeScript, In-Memory Multi-Store with JSON Persistence
- **Security:** Helmet, Cookie-Parser, CORS protection, Role-Based Access Control (RBAC), Anti-IDOR Document Download Gateways
- **Testing:** Automated unit and integration test suites

### Property Search Data Sources
Find Property defaults to a deterministic local catalog of 240 fictional records across the five supported regions. Every demo card and detail view is labeled as not real; demo prices, features, locations, and availability are illustrative. Demo records have no real contact, verification, saved-listing, report, or connection actions.

The separate **Approved listings** mode queries approved first-party owner and broker submissions in the local JSON-backed registry. No external rental marketplace or government rental-listing API is connected. The provider adapters shown in the integration documentation remain inactive until an authorized rental feed and a tested response mapping are available. Region selectors describe supported search locations, not confirmed live inventory coverage.

---

## 🚀 Quick Start & Local Development

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- Git (v2.40.0 or higher)

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Saransh-sharma108/griha-saathi.git
cd griha-saathi
npm install
```

### 2. Environment Configuration
Copy the provided template to create your local `.env`:
```bash
cp .env.example .env
```
*(Configure local development ports, session secrets, and provider credentials as needed).*

### 3. Running Locally
On Windows, start the frontend and backend independently of the IDE:
```bat
start.cmd
```
The launcher waits for the Vite frontend and Express `/api/health` endpoint before opening:
```
http://localhost:3000
```
It can be run from any current directory. Use these commands from the project folder to inspect or stop the managed development server:
```bat
start.cmd status
start.cmd stop
```
The launcher writes timestamped output and error logs under `logs\`. It reuses a healthy server, reports port conflicts without terminating the conflicting process, and does not install dependencies automatically. If dependencies are missing, run `npm.cmd install` once before starting. Closing the IDE or launcher does not stop the independent process; Windows shutdown, sign-out, or sleep may still stop or interrupt it.

### 4. Running Verification Test Suites
Execute the full automated platform test suite (Authentication, Discovery, Land Records, AI, Home DNA, E2E):
```bash
npm test
```

### 5. Production Build
Compile client and server bundles:
```bash
npm run build
```

---

## 📁 Project Architecture

```
Op-Griha Saathi/
├── client/                     # Vite + React single-page frontend
│   ├── src/                    # Components, pages, hooks, state
│   └── index.html              # HTML entry point
├── server/                     # Express TypeScript backend
│   ├── data/                   # Persistent verified property registry (properties.json)
│   ├── src/                    # API routers, DB engine, middleware, verification services
│   └── tsconfig.json           # Server TypeScript configuration
├── shared/                     # Shared TypeScript types & multi-language i18n
├── docs/                       # Architectural documentation & statutory guidelines
├── public/                     # Static web assets
├── uploads/                    # Local storage directories (.gitkeep preserved)
├── .env.example                # Safe environment configuration template
├── .gitignore                  # Security-hardened version control filter
└── package.json                # Project dependencies and operational scripts
```

---

## 📜 Statutory Disclaimers & Integrity Policy

Synthetic records are permitted only in the separate search demonstration experience and are explicitly marked as fictional. They are never inserted into the first-party property registry or described as verified, available rentals. Approved first-party records are subject to publication and verification-evidence gates; external data sources remain disconnected until authorized integrations are implemented.
