# 🏡 Griha Saathi (गृह साथी)
### Trustworthy, Cadastral-Verified Rental Housing Discovery Platform

Griha Saathi is an evidence-based rental property discovery and verification platform engineered for Northern India (Delhi, Haryana, Punjab, Himachal Pradesh, and Jammu & Kashmir). The platform enforces a strict **Zero-Synthetic Data Policy**, integrating direct owner and licensed broker submissions with state land records and field inspection verification.

---

## 🌟 Key Capabilities

- **Cadastral & Land Revenue Verification:** Cross-referenced against state revenue registries (Haryana Jamabandi, Punjab PLRS Fard Kendra, Delhi DORIS/DDA, Himachal Pradesh Himbhoomi, and J&K Aapki Zameen Aapki Nigrani).
- **Model Tenancy Act (MTA) 2021 Compliance:** Enforces statutory residential security deposit caps (maximum 2 months rent).
- **DPDP Act 2023 Privacy Compliance:** Automatic masking of personal contact details and private document isolation.
- **Saathi AI Tenant & Property Assistant:** Intelligent conversational guidance, lease agreement advisory, and side-by-side verified comparison engine.
- **Home DNA Lifestyle Matching:** Multi-dimensional compatibility matching between tenant preferences and verified housing attributes.
- **Dark Forest Green Aesthetic:** High-contrast, accessibility-focused visual design with Comic Sans MS typography.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Vanilla CSS Design System, Lucide Icons
- **Backend:** Node.js, Express, TypeScript, In-Memory Multi-Store with JSON Persistence
- **Security:** Helmet, Cookie-Parser, CORS protection, Role-Based Access Control (RBAC), Anti-IDOR Document Download Gateways
- **Testing:** Comprehensive 10-Phase Automated Test Suite (100% Passing)

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
Start both backend (port 5000) and frontend (port 3000) concurrently:
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

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

Griha Saathi strictly prohibits the creation, insertion, or presentation of synthetic, fake, or mock property listings in production discovery. Every property card is backed by verifiable state land revenue records or verified owner identity.
