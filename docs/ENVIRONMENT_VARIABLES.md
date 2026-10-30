# Griha Saathi (गृह साथी) — Environment Variables Specification

> **Notice:** Never commit actual API keys, database credentials, or secret signing keys to version control. Use `.env` locally (which is `.gitignore`d) and configure platform environment variables in production.

---

## 1. Core Server & Runtime Configuration

| Variable Name | Type | Default (Dev) | Production Requirement | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | String | `development` | **Required** (`production`) | Node environment indicator; toggles HSTS, stack traces, and caching. |
| `PORT` | Number | `5000` | Optional | Port on which the Express server listens. |
| `VITE_API_URL` | String | `http://localhost:5000` | Optional | Target API URL used by frontend build if running on a separate host. |
| `ALLOWED_ORIGINS` | Comma-separated | `http://localhost:3000,...` | **Required** in prod | Whitelist of allowed CORS origins for browser API access. |

---

## 2. Security & Session Secrets

| Variable Name | Type | Default (Dev) | Production Requirement | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `SESSION_SECRET` | String | None | **Required** (min 32 chars) | Cryptographic entropy for server session signatures. |
| `JWT_SECRET` | String | None | **Required** (min 32 chars) | Cryptographic key for signing and verifying authorization tokens. |

---

## 3. Relational Database (PostgreSQL)

| Variable Name | Type | Default (Dev) | Production Requirement | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | URI String | None | **Required** for RDBMS | PostgreSQL connection URI (`postgresql://user:pass@host:port/dbname?sslmode=require`). Documented target schema in `docs/database_schema.sql`. |

---

## 4. Email Delivery Configuration (Nodemailer / Resend)

| Variable Name | Type | Default (Dev) | Production Requirement | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `SMTP_HOST` | String | None | Optional (Option A) | SMTP server hostname (e.g., AWS SES, Google Workspace). |
| `SMTP_PORT` | Number | `587` | Optional | SMTP connection port (`587` for TLS, `465` for SSL). |
| `SMTP_SECURE` | Boolean | `false` | Optional | Set to `true` for SSL on port 465. |
| `SMTP_USER` | String | None | Optional | SMTP authentication username. |
| `SMTP_PASS` | String | None | Optional | SMTP authentication password. |
| `EMAIL_FROM` | String | None | Optional | Sender email header (e.g. `"Griha Saathi <noreply@grihasaathi.in>"`). |
| `RESEND_API_KEY` | String | None | Optional (Option B) | Resend HTTP API token if utilizing Resend instead of SMTP. |

---

## 5. Indian Telecom Carrier SMS Delivery (TRAI DLT Compliant)

| Variable Name | Type | Default (Dev) | Production Requirement | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `SMS_GATEWAY_PROVIDER` | String | `msg91` | Optional | Active SMS provider identifier (`msg91`, `fast2sms`, `twilio`). |
| `SMS_GATEWAY_API_KEY` | String | None | Optional | API token for MSG91 / Fast2SMS gateway. |
| `SMS_GATEWAY_SENDER_ID` | String | None | Optional | 6-character TRAI DLT approved Sender ID (e.g. `GRHSAT`). |
| `SMS_DLT_TEMPLATE_ID` | String | None | Optional | Registered 19-digit TRAI DLT Content Template ID for OTPs. |
| `TWILIO_ACCOUNT_SID` | String | None | Optional (Option B) | Twilio account SID. |
| `TWILIO_AUTH_TOKEN` | String | None | Optional | Twilio authentication token. |
| `TWILIO_PHONE_NUMBER` | String | None | Optional | Twilio sender phone number (+E.164 format). |

---

## 6. Official Identity Verification (DigiLocker / UIDAI)

| Variable Name | Type | Default (Dev) | Production Requirement | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `DIGILOCKER_CLIENT_ID` | String | None | Optional | Registered DigiLocker Requester Organization client ID. |
| `DIGILOCKER_CLIENT_SECRET`| String | None | Optional | DigiLocker OAuth client secret. |
| `DIGILOCKER_REDIRECT_URI` | URI String | None | Optional | OAuth callback URL matching the registered domain. |

---

## 7. State Land Registry & Revenue Authority Integrations

| Variable Name | Type | Default (Dev) | Production Requirement | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `HARYANA_JAMABANDI_API_URL` | URI String | None | Optional | Directorate of Land Records Haryana (Web-HALRIS) endpoint. |
| `HARYANA_JAMABANDI_API_KEY` | String | None | Optional | Haryana Jamabandi API access key. |
| `PUNJAB_PLRS_ENDPOINT` | URI String | None | Optional | Punjab Land Records Society (PLRS Fard Kendra) endpoint. |
| `PUNJAB_PLRS_API_KEY` | String | None | Optional | Punjab PLRS API key. |
| `DELHI_REVENUE_API_URL` | URI String | None | Optional | Delhi Online Registration Information System (DORIS) endpoint. |
| `DELHI_DORIS_API_KEY` | String | None | Optional | Delhi DORIS API key. |
| `HP_HIMBHOOMI_API_URL` | URI String | None | Optional | Himachal Pradesh Himbhoomi Land Records API endpoint. |
| `HP_HIMBHOOMI_API_KEY` | String | None | Optional | HP Himbhoomi API key. |
| `JK_LAND_RECORDS_API_URL` | URI String | None | Optional | Jammu & Kashmir Aapki Zameen Aapki Nigrani API endpoint. |
| `JK_LAND_RECORDS_API_KEY` | String | None | Optional | J&K Land Records API key. |
| `DATA_GOV_IN_ENDPOINT` | URI String | None | Optional | Open Government Data (data.gov.in) API endpoint. |
| `DATA_GOV_IN_API_KEY` | String | None | Optional | Data.gov.in API consumer key. |
| `STATE_RERA_GATEWAY_URL` | URI String | None | Optional | State RERA aggregator endpoint. |
| `STATE_RERA_GATEWAY_KEY` | String | None | Optional | State RERA access key. |
| `PARTNER_SYNDICATION_ENDPOINT` | URI String | None | Optional | Verified partner syndication feed endpoint. |
| `PARTNER_SYNDICATION_API_KEY` | String | None | Optional | Partner syndication authentication token. |

---

## 8. Central Encumbrance Registry (CERSAI)

| Variable Name | Type | Default (Dev) | Production Requirement | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `CERSAI_INSTITUTION_ID` | String | None | Optional | Institution code registered with CERSAI. |
| `CERSAI_API_SECRET` | String | None | Optional | Private API secret for equitable mortgage queries. |
| `CERSAI_PUBLIC_KEY` | String | None | Optional | Certificate public key for signing CERSAI requests. |

---

## 9. Saathi AI Intelligent Assistant (Google Gemini)

| Variable Name | Type | Default (Dev) | Production Requirement | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | String | None | Recommended | Google Gemini API key powering natural language queries, tenancy legal comprehension, and multilingual query extraction. |

---

## 10. Cloud Object Storage (AWS S3 / Cloudflare R2)

| Variable Name | Type | Default (Dev) | Production Requirement | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `AWS_REGION` | String | `ap-south-1` | Optional | AWS region for property media and document bucket. |
| `AWS_S3_BUCKET` | String | None | Optional (Option A) | Dedicated private bucket for uploaded property media. |
| `AWS_ACCESS_KEY_ID` | String | None | Optional | IAM user credentials with S3 read/write permissions. |
| `AWS_SECRET_ACCESS_KEY` | String | None | Optional | IAM secret access key. |
| `R2_ACCOUNT_ID` | String | None | Optional (Option B) | Cloudflare R2 account ID for zero-egress media storage. |
| `R2_BUCKET` | String | None | Optional | Dedicated R2 storage bucket. |
| `R2_ACCESS_KEY_ID` | String | None | Optional | R2 access key ID. |
| `R2_SECRET_ACCESS_KEY` | String | None | Optional | R2 secret access key. |

