# Griha Saathi (गृह साथी) — Full-Stack Deployment Guide

> **Document Type:** Production Deployment Specification & Runbook  
> **Target Audience:** DevOps Engineers, Full-Stack Developers, Site Reliability Engineers

---

## 1. Deployment Topology Options

Griha Saathi is designed with architectural flexibility to support two primary production deployment patterns without altering application source code:

```
PATTERN A (Unified Host — Recommended for Simplicity)
Browser ──HTTPS──► [Express Server on Port 5000]
                   ├── GET /api/*          ──► REST Controllers & Services
                   ├── GET /uploads/photos ──► Property Photographs
                   └── GET /*              ──► Static Client SPA (client/dist)

PATTERN B (Two-Tier Decoupled — Recommended for Large Scale / Global CDN)
Browser ──HTTPS──► [CDN / Edge Static Host: Vercel / Netlify / Cloudflare Pages]
                   └── Static Assets & SPA (client/dist)
                   │
                   └── /api/* (Proxied or CORS) ──► [Node.js Backend: Render / AWS / Railway]
```

---

## 2. Option A: Unified Full-Stack Node.js Deployment (Single Service)

In this configuration, a single Node.js runtime process executes the Express server, which hosts both the API and the pre-built React application.

### Build & Execution Steps
1. **Install Dependencies:**
   ```bash
   npm ci
   ```
2. **Compile the Production Client:**
   ```bash
   npm run build:client
   ```
   *Output:* Bundles all minified assets into `client/dist/`.
3. **Compile the Backend Server:**
   ```bash
   npm run build:server
   ```
4. **Launch the Production Server:**
   ```bash
   npm start
   ```
   *Execution:* Runs `node server/src/index.js` on the port specified by `PORT` (default `5000`).

### Serving Mechanism
As implemented in `server/src/index.ts`:
- `/api/*` endpoints are handled directly with rate limiting, auth verification, and JSON responses.
- `/uploads/photos/*` are served statically with security headers (`X-Content-Type-Options: nosniff`).
- All other GET requests serve `client/dist/index.html` as the SPA fallback, allowing deep links like `https://grihasaathi.in/#find-property` to resolve immediately.

### Suitable Hosting Providers for Option A
- **Render.com:** Web Service (Node.js runtime, attach a 1GB Persistent Disk mounted to `/uploads` and `/server/data`).
- **Railway.app:** Node.js service with attached persistent volume.
- **Fly.io:** Node.js app with `fly volumes create`.
- **AWS ECS / App Runner:** Containerized deployment with Amazon EFS mounted for `/uploads`.
- **DigitalOcean App Platform:** Web Service with attached volume.

---

## 3. Option B: Decoupled Deployment (Static Frontend + API Backend)

If you choose to host the React frontend on a global CDN (e.g., Vercel, Netlify, Cloudflare Pages) and the backend on a managed Node.js PaaS (e.g., Render, Railway, AWS):

### 1. Frontend Configuration
- **Root Directory:** Set to `client` or configure the build command to run from root:
  - **Build Command:** `npm run build:client`
  - **Output Directory:** `client/dist`
- **Environment Variable:**  
  Set `VITE_API_URL` to the public URL of your backend (e.g. `https://api.grihasaathi.in`).
- **SPA Routing Configuration:**  
  Because Griha Saathi uses client-side hash routing (`#find-property`), static hosts serve `index.html` directly without requiring complex URL rewrite rules.

### 2. Backend Configuration
- **Build Command:** `npm run build:server`
- **Start Command:** `npm start`
- **CORS Whitelist:**  
  Set `ALLOWED_ORIGINS` to include your frontend domain:
  ```env
  ALLOWED_ORIGINS=https://grihasaathi.in,https://www.grihasaathi.in
  ```

---

## 4. Containerized Deployment (Docker)

For reproducible, cloud-agnostic container deployments, use the following production-grade `Dockerfile`:

```dockerfile
# Multi-stage production build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci

# Copy full source tree
COPY . .

# Build frontend and compile backend
RUN npm run build:client
RUN npm run build:server

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled bundles and runtime files
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/src ./server/src
COPY --from=builder /app/server/data ./server/data
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/uploads ./uploads
COPY --from=builder /app/public ./public

# Ensure upload and data directories exist
RUN mkdir -p uploads/photos uploads/documents server/data

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "server/src/index.js"]
```

---

## 5. Persistence & Data Protection in Production

### 1. Ephemeral Filesystem Warning
Standard container instances discard local filesystem changes when redeployed or restarted. In Griha Saathi:
- Approved properties are stored in `server/data/properties.json`.
- Uploaded title deeds and inspection documents are stored in `uploads/documents/`.
- Uploaded property photography is stored in `uploads/photos/`.

### 2. Production Persistence Solutions
1. **Persistent Disk Volumes:**
   Mount a persistent disk to `/app/uploads` and `/app/server/data`. This is the fastest, lowest-complexity path to production with zero code changes.
2. **Relational Database Migration:**
   Deploy a managed PostgreSQL database (e.g., AWS RDS, Supabase, Neon) and execute the SQL migration script located in `docs/database_schema.sql`. Set `DATABASE_URL` in your environment.
3. **Cloud Object Storage (S3 / Cloudflare R2):**
   Configure AWS S3 or Cloudflare R2 credentials (see `docs/ENVIRONMENT_VARIABLES.md`). `server/src/storageService.ts` is architected to offload files to object storage when configured.

---

## 6. Pre-Flight Deployment Checklist

- [ ] **Run Static Typecheck:** `npm run typecheck` (verifies zero path and type errors).
- [ ] **Run Full Test Suite:** `npm test` (confirms all 11 test suites pass with 100% success).
- [ ] **Run Client Build:** `npm run build:client` (confirms `client/dist` generates cleanly).
- [ ] **Configure Environment Variables:** Populate `NODE_ENV=production`, `PORT`, `ALLOWED_ORIGINS`, `SESSION_SECRET`, `JWT_SECRET`.
- [ ] **Secure Storage & Uploads:** Verify that `uploads/documents/` is protected from public URL access (enforced by Express router).
- [ ] **Configure HTTPS & SSL:** Guarantee SSL termination (Let's Encrypt / Cloudflare) to ensure cookies and authorization headers are encrypted in transit.
- [ ] **Health Endpoint Verification:** Probe `https://<your-domain>/api/health` to confirm server status and target regions.

