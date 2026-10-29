# Griha Saathi — Legitimate Data Providers, Authorized APIs & Integration Specifications

This document identifies the legitimate property-data providers, authorized government registries, identity verification gateways, and lawful integration options for the initial target regions: **Jammu & Kashmir, Haryana, Himachal Pradesh, Delhi, and Punjab**.

## Current property-search integration status

The Find Property page defaults to a deterministic local synthetic catalog in `client/src/data/demoProperties.ts` (240 fictional listings across the five supported regions). These records exist only in the client-side demonstration search, are visibly labeled as fictional, have no genuine availability or contacts, and are not written to the first-party property registry.

The separate Approved listings mode queries only approved first-party owner/broker submissions held in the application's in-memory registry and persisted to `server/data/properties.json`. This is a local JSON-backed store, not PostgreSQL or a live multi-user database. It is not a live third-party rental feed.

The data.gov.in, State RERA, and partner adapters in the codebase do not have an authorized rental-listing resource plus a working response mapper. They are reported as unsupported and are not queried, even if a credential is present. RERA project registrations and land-record portals do not themselves establish rental listing availability. The provider descriptions below are integration research and prerequisites, not evidence that access or coverage has been obtained.

First-party search can return only approved, eligible records. A claimed authoritative verification is excluded unless the stored verification record has verified land-registry, owner-identity, and physical-inspection stages. Demo records do not pass through or modify that registry. City/locality options in demo mode come from the deterministic catalog; first-party suggestions come only from currently eligible first-party records.

A request timestamp is distinct from source modification time and owner availability confirmation. First-party availability is treated as confirmed only when its recorded owner confirmation is no more than 60 days old and is not future-dated. Demo availability and dates are simulated and are never presented as current owner confirmation.

---

## 1. Telecom SMS & Email Gateways (Live OTP Delivery)

### Mandatory Regulatory Compliance
In India, commercial bulk and transactional SMS delivery is governed by **TRAI (Telecom Regulatory Authority of India)** under the **TCCCPR (Telecom Commercial Communications Customer Preference Regulations, 2018)**.

| Parameter | Requirement |
| :--- | :--- |
| **Registration Entity** | Principal Entity (PE) registration on any Telecom Service Provider (TSP) DLT portal (e.g. Airtel DLT, Jio DLT, Vodafone Idea DLT). |
| **Sender Header (Header ID)** | 6-character registered alphabetic header (e.g. `GRHSAT`). |
| **Content Template (Template ID)** | Registered transactional OTP template: `{#var#} is your Griha Saathi verification code. Valid for 5 minutes. Do not share with anyone. - Griha Saathi` |
| **Provider Choices** | MSG91, Gupshup, Twilio India, Exotel. |
| **Required Keys** | `SMS_GATEWAY_API_KEY`, `SMS_GATEWAY_SENDER_ID`, `SMS_DLT_TEMPLATE_ID`. |

---

## 2. DigiLocker & Aadhaar Identity Verification

### Purpose & Lawful Authority
To verify that the property owner and tenant are genuine citizens without storing unencrypted Aadhaar numbers or collecting physical copies that risk forgery.

| Component | Technical Details & Agreement Requirements |
| :--- | :--- |
| **Authority** | National Informatics Centre (NIC) & Ministry of Electronics and Information Technology (MeitY). |
| **Integration Route** | Registered as a **DigiLocker Requester Organization** or via licensed partner (e.g., Setu / Signzy / Karza). |
| **Permissions Required** | MoU with Digital India Corporation; Submission of data protection & DPDP Act compliance certificate. |
| **Workflow** | OAuth 2.0 PKCE redirect flow to DigiLocker consent screen. Upon consent, backend receives verifiable XML/JSON of Aadhaar profile and address. |
| **Required Keys** | `DIGILOCKER_CLIENT_ID`, `DIGILOCKER_CLIENT_SECRET`, `DIGILOCKER_REDIRECT_URI`. |

---

## 3. Haryana: Jamabandi / Web-HALRIS Land Records

### Authority & Scope
- **Department**: Department of Revenue and Disaster Management, Government of Haryana.
- **System**: Jamabandi & Web-HALRIS (Haryana Land Record Information System).
- **Coverage**: All 22 districts including Gurugram, Faridabad, Panchkula, Sonipat, Ambala, Karnal, Rohtak.

### Data Points Verified
- **Khasra / Khewat / Khatoni Numbers**: Legal land identification.
- **Ownership Nakal (RoR)**: Validates current legal title holder.
- **Inteqal (Mutation) Status**: Verifies that title transfer has been recorded in the revenue books.
- **Stay / Injunction Register**: Checks for civil court injunctions or government acquisition notices.

### Access Agreement & API Integration
- **Gateway**: Haryana State Electronics Development Corporation (HARTRON) API Gateway.
- **Agreement**: Departmental MoU for real-estate verification services; IP whitelisting; mutual TLS with client certificate.
- **Config Keys**: `HARYANA_JAMABANDI_API_URL`, `HARYANA_JAMABANDI_API_KEY`, `HARTRON_CLIENT_CERT`.

---

## 4. Punjab: Land Records Society (PLRS / Fard Kendra)

### Authority & Scope
- **Department**: Department of Revenue, Rehabilitation and Disaster Management, Government of Punjab.
- **System**: Punjab Land Records Society (PLRS) & Fard Kendra Portal.
- **Coverage**: All 23 districts including SAS Nagar (Mohali), Ludhiana, Amritsar, Jalandhar, Patiala, Bathinda.

### Data Points Verified
- **Jamabandi & Fard Nakal**: Authenticates ownership rights and agricultural/urban revenue records.
- **Mortgage & Encumbrance Register**: Identifies bank charges or hypothecations.

### Access Agreement & API Integration
- **Gateway**: Punjab Department of Governance Reforms (DGR) e-District API.
- **Agreement**: Institutional data sharing agreement under Punjab Right to Business / Housing norms.
- **Config Keys**: `PUNJAB_PLRS_ENDPOINT`, `PUNJAB_PLRS_API_KEY`, `PUNJAB_DGR_SIGNATURE`.

---

## 5. Delhi: DORIS & DDA Land Registry

### Authority & Scope
- **Departments**: Revenue Department (GNCTD) & Delhi Development Authority (DDA).
- **Systems**: Delhi Online Registration Information System (DORIS) & DDA Bhoomi Portal.
- **Coverage**: All 11 revenue districts (South Delhi, New Delhi, Dwarka, Rohini, East Delhi, etc.).

### Data Points Verified
- **Registered Sale Deed / Lease Deed Index**: Sub-Registrar Office (SRO) registration verification.
- **Property Mutation & Conversion Certificate**: Freehold/leasehold status with DDA.
- **Property Tax Receipt (MCD)**: Unique Property Identification Code (UPIC) verification.

### Access Agreement & API Integration
- **Gateway**: NIC Delhi API Portal.
- **Agreement**: Formal approval from Inspector General of Registration (IGR Delhi).
- **Config Keys**: `DELHI_REVENUE_API_URL`, `DELHI_DORIS_API_KEY`.

---

## 6. Himachal Pradesh: Himbhoomi (Land Records HP)

### Authority & Scope
- **Department**: Department of Revenue, Government of Himachal Pradesh.
- **System**: Himbhoomi (Web-HALRIS HP).
- **Coverage**: Shimla, Kangra (Dharamshala), Solan, Kullu, Mandi, etc.

### Data Points Verified
- **Jamabandi & Shajra Aks**: Verifies hilly terrain parcel ownership and boundary maps.
- **Section 118 Land Reform Compliance**: Validates statutory residential leasing permissions for non-agricultural property.

### Access Agreement & API Integration
- **Gateway**: HP State Data Center (HPSDC) / NIC Himachal.
- **Agreement**: Land Revenue Department clearance.
- **Config Keys**: `HP_HIMBHOOMI_API_URL`, `HP_HIMBHOOMI_API_KEY`.

---

## 7. Jammu & Kashmir: Aapki Zameen Aapki Nigrani

### Authority & Scope
- **Department**: Revenue Department, UT of Jammu & Kashmir.
- **System**: Aapki Zameen Aapki Nigrani (Land Records Information System).
- **Coverage**: Jammu, Srinagar, Udhampur, Anantnag, Baramulla, etc.

### Data Points Verified
- **Digitized Jamabandi & Girdawari**: Legal title cross-check under Digital India Land Records Modernization Programme (DILRMP).
- **Property Ownership Certificate**: Revenue department issuance.

### Access Agreement & API Integration
- **Gateway**: J&K e-Governance Agency (JaKeGA).
- **Agreement**: UT IT Department enterprise integration protocol.
- **Config Keys**: `JK_LAND_RECORDS_API_URL`, `JK_LAND_RECORDS_API_KEY`.

---

## 8. CERSAI (Asset Encumbrance Registry)

### Authority & Purpose
- **Authority**: Central Registry of Securitisation Asset Reconstruction and Security Interest of India.
- **Statutory Basis**: Established under the SARFAESI Act, 2002.
- **Security Check**: Checks whether the property has an active equitable mortgage or attachment order by banks or financial institutions. Prevents tenants from unknowingly renting mortgaged or defaulting properties.
- **Config Keys**: `CERSAI_INSTITUTION_ID`, `CERSAI_API_SECRET`, `CERSAI_PUBLIC_KEY`.

---

## 9. Data Integrity Enforcement & Gating Policy

1. **Missing Credential Handling**: If an API key is missing or unconfigured in `.env`, the system marks the provider status as `unconfigured` and provides clear disclosures.
2. **Never Fabricate Data**: The server will never emit dummy land record tokens, simulated deed numbers, or mock ownership confirmations.
3. **Audit Trail**: Every request to an external provider is logged in `audit_logs` with the requesting actor, timestamp, and verification hash.
