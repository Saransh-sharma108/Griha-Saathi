# GRIHA SAATHI — PRODUCTION DEPLOYMENT & OPERATIONS GUIDE

This document provides definitive, step-by-step instructions for deploying and operating the **Griha Saathi** platform in production environments.

---

## 1. System Architecture

- **Frontend**: Single-Page Application (React 19 + TypeScript), styled with vanilla CSS, bundled using Vite.
- **Backend API**: Node.js (v20+ LTS) with Express 5, TypeScript compilation via `tsc` or runtime execution via `tsx`.
- **Database**:
  - Development & Standalone: High-performance typed in-memory engine with strict transaction isolation.
  - Production Relational: PostgreSQL 15+ using migrations located in `docs/*.sql`.
- **Media & File Storage**: Local secured filesystem (`uploads/photos` and protected `uploads/documents`) with pluggable AWS S3 / Cloudflare R2 object storage drivers.
- **AI Engine**: Saathi AI assistant powered by Google Gemini API (`gemini-1.5-flash`) with deterministic rule fallback and zero-synthetic retrieval.

---

## 2. Environment Configuration

Copy `.env.example` to `.env` and configure real provider secrets:

```bash
cp .env.example .env
```

### Essential Production Variables
```ini
# Environment
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://grihasaathi.in,https://www.grihasaathi.in

# Cryptographic Secrets (Generate using `openssl rand -hex 32`)
SESSION_SECRET=YOUR_32_CHAR_RANDOM_SESSION_SECRET
JWT_SECRET=YOUR_32_CHAR_RANDOM_JWT_SECRET

# Real SMS Provider (Twilio or Indian DLT Telecom Carrier)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
TWILIO_PHONE_NUMBER=+1234567890

# Real Email Delivery (SMTP or Resend)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.zzzzzzzzzzzzzzzzzzzz
EMAIL_FROM="Griha Saathi <no-reply@grihasaathi.in>"

# AI Assistant
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Relational Database (Optional when running in-memory)
DATABASE_URL=postgresql://griha_prod_user:SecurePassword123@db-host:5432/griha_saathi_db?sslmode=require
```

---

## 3. Production Build Process

Run the full dual-target production build:

```bash
npm.cmd run build
# OR on Linux / macOS:
npm run build
```

This compiles:
1. `build:client`: Type-checks with `tsc -b` and builds minified assets to `client/dist/`.
2. `build:server`: Compiles backend TypeScript to common/ES JavaScript in `server/src/`.

---

## 4. Production Deployment Options

### Option A: Linux VPS / Cloud VM (Ubuntu / Debian + Systemd + Nginx)

1. **Install Node.js 20+ LTS & Nginx**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx
   ```

2. **Clone & Build**:
   ```bash
   git clone https://github.com/your-org/griha-saathi.git /var/www/griha-saathi
   cd /var/www/griha-saathi
   npm ci
   npm run build
   ```

3. **Systemd Service (`/etc/systemd/system/griha-saathi.service`)**:
   ```ini
   [Unit]
   Description=Griha Saathi Production API & Platform
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/var/www/griha-saathi
   Environment=NODE_ENV=production
   ExecStart=/usr/bin/npm start
   Restart=always
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```

4. **Nginx Reverse Proxy Configuration**:
   ```nginx
   server {
       server_name grihasaathi.in www.grihasaathi.in;

       # Serve static frontend assets
       location / {
           root /var/www/griha-saathi/client/dist;
           try_files $uri $uri/ /index.html;
       }

       # Proxy API requests to backend
       location /api/ {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # Serve uploaded photos
       location /uploads/photos/ {
           alias /var/www/griha-saathi/uploads/photos/;
           expires 30d;
           add_header Cache-Control "public, no-transform";
       }
   }
   ```

5. **SSL Certificate**:
   ```bash
   sudo certbot --nginx -d grihasaathi.in -d www.grihasaathi.in
   ```

---

### Option B: Docker Container Deployment

Create a `Dockerfile` in the root:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig*.json vite.config.ts ./
COPY client/package*.json ./client/
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/src ./server/src
COPY --from=builder /app/shared ./shared
EXPOSE 5000
CMD ["npm", "start"]
```

---

## 5. Security & Reliability Checklist

- [x] **No Secrets in Source Control**: Verified `.env` is git-ignored and `.env.example` contains only template placeholders.
- [x] **IDOR Protection**: Private verification documents are strictly accessible only to the property owner or authorized verifiers.
- [x] **Session Hardening**: Cookies set with `httpOnly: true`, `secure: true` (in production), and `sameSite: strict`.
- [x] **Brute-Force & Lockout**: 5 failed PIN attempts lock the account for 15 minutes; IP-level rate limiting enforced.
- [x] **Deactivation Enforcement**: Deactivated accounts cannot sign in, and active sessions are revoked immediately.
- [x] **Security Headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and `X-XSS-Protection` enabled.
- [x] **Error Sanitization**: Express error-handling middleware conceals internal stack traces from clients.
- [x] **Zero Synthetic Data Invariant**: Only authentic listings, verified properties, genuine inquiries, and real visit records are served.

---

## 6. Health & Diagnostics Endpoints

- **Health Check**: `GET /api/health`
  Returns status, regional coverage, and data integrity policies.
- **Provider Status**: `GET /api/providers/status`
  Audits live connectivity for SMS, Email, DigiLocker, and Land Registries.
- **Saathi AI Status**: `GET /api/saathi-ai/status`
  Reports Gemini API connectivity or deterministic rule engine mode.
- **Notification Channels**: `GET /api/notifications/delivery-status`
  Reports in-app, SMS, and email delivery channel readiness.
