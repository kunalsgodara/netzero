# NetZeroWorks — Market Fit Analysis & Requirements
## Based on: CarbonChain CBAM Guide + Current Codebase Audit

---

## THE REAL PROBLEM STATEMENT

CBAM (EU Carbon Border Adjustment Mechanism) is now a **financial liability regulation** (not just reporting) as of January 1, 2026. Any company importing steel, cement, aluminium, fertilisers, electricity or hydrogen into the EU must:

1. Collect **installation-level verified emissions data** from every non-EU supplier
2. Calculate CBAM cost using a precise formula (emissions intensity × benchmark × phase-in rate × EUA price − carbon price paid abroad)
3. Purchase and surrender **CBAM certificates** quarterly/annually
4. File annual declarations via the **EU CBAM Registry** by 30 Sep 2027
5. Penalties: **€100/tCO₂e** for non-compliance — plus exclusion from importing

**The core pain:** Suppliers don't have verified data. Companies are forced to use punitive "default values" (set conservatively high by the EU), massively inflating their cost exposure. A 10,000t steel shipment using defaults can cost **€1.7M vs €450K** with actual verified data.

**Competitor:** CarbonChain — enterprise tool, backed by Y Combinator + Voyager VC, used by Gunvor, ThyssenKrupp, Volvo, ING. They charge enterprise pricing. Gap in market = **affordable, guided CBAM compliance for SMEs and mid-market importers**.

---

## CRITICAL GAPS IN CURRENT NETZEROWORKS

The current app tracks emissions and has basic CBAM import records. That is **not enough**. Here is what is missing:

| Area | Current State | What Market Needs |
|------|-------------|-------------------|
| Supplier management | None | Supplier portal, outreach, data collection |
| CN code handling | Basic category dropdown | Full CN code lookup, validation, scope determination |
| Verified vs default data | No distinction | Verified actual vs default value flagging everywhere |
| CBAM cost formula | Partial (emission_factor × quantity) | Full formula: intensity × benchmark × phase-in × EUA − carbon paid abroad |
| Certificate management | None | Certificate purchase, holding %, surrender tracking |
| Installation-level data | Company level only | Per-installation emissions (CBAM is installation-specific) |
| Precursor tracking | None | Complex goods (steel/aluminium) need upstream precursor emissions |
| Verification readiness | None | Pre-verification audit trail, methodology review |
| Benchmark comparison | None | Own intensity vs EU benchmark vs default value |
| Importer vs Producer roles | No distinction | Two separate workflows (declarant vs installation) |
| CBAM Registry | None | Declaration submission tracking aligned to EU Registry |
| Carbon price paid abroad | None | Deduction calculator for overseas carbon pricing |
| EU ETS price | Basic fetch | Real-time quarterly/weekly price, scenario modelling |
| UK CBAM | Not mentioned | UK CBAM 2027 — same data, different rules |
| Authorised Declarant | None | Application support, deadline tracker (31 Mar 2026) |

---

## FUNCTIONAL REQUIREMENTS

### FR-1: CBAM Scope Assessment
- User answers: what do I import? From where? Which CN codes?
- System tells them: are you in scope? What's your liability category?
- CN code lookup table with search (72XX=steel, 76XX=aluminium, 2523=cement, etc.)
- Flag if they will be pulled in by the 2026+ expansion (downstream steel/aluminium)

### FR-2: Supplier Management Module
- Add suppliers (name, country, installation ID, CN codes, contact)
- Send data requests to suppliers (email templates built-in)
- Track submission status: Requested → Received → Verified → Approved / Failed
- Flag suppliers who haven't responded (default value risk alert)
- Supplier catalogue: search known installations by name/CN code

### FR-3: Installation-Level Emissions
- Each CBAM import linked to a specific installation (not just a supplier company)
- Per installation: emissions intensity (tCO₂e/t), production route, benchmark
- Simple goods vs complex goods distinction
- For complex goods: precursor emissions input (upstream materials)
- Verified vs unverified flag on all data

### FR-4: Accurate CBAM Cost Calculator
Full formula implementation:
```
CBAM Cost = (Emissions Intensity − Benchmark) × Phase-in Rate × Quantity × (EUA Price − Carbon Price Paid Abroad)
```
- EUA price: live quarterly fetch (already exists — extend it)
- Phase-in rate: EU free allowance schedule (2026: 97.5%, declining yearly)
- Benchmark: installation-specific or EU default by CN code + country + production route
- Carbon price paid abroad: user inputs with documentation
- Output: cost in EUR, per shipment and annual total

### FR-5: Default vs Actual Value Comparison
- Show every import: "Using default values" vs "Using verified actual data"
- Show cost difference: "You could save €X by getting verified data from this supplier"
- Risk dashboard: % of imports relying on defaults = financial risk score

### FR-6: Certificate Management
- Track certificate holdings vs obligation (must hold ≥50% per quarter)
- Surrender deadlines: 30 September 2027 for 2026 data
- Alert when holdings fall below threshold
- Certificate cost projections based on EUA price scenarios

### FR-7: Verification Readiness Workflow
- Checklist for each installation: methodology defined? → data collected? → audit trail complete? → pre-verification done?
- Upload and store supporting documents
- Flag: "Not verification-ready — default values will apply"
- Timeline: On-site audit required for first verification (2026 data)

### FR-8: Compliance Deadline Tracker
- 31 Mar 2026: Authorised Declarant application deadline
- 30 Sep 2027: First annual CBAM declaration due
- Quarterly: certificate holding obligations
- Weekly (from 2027): EUA price averaging
- Dashboard widget showing days to next deadline + readiness status

### FR-9: Importer Workflow (Step-by-Step Guide)
6-step guided workflow built in-app:
1. Confirm CN codes in scope
2. Apply for Authorised Declarant status (checklist + link to EU Registry)
3. Contact suppliers and collect data (FR-2)
4. Calculate CBAM cost exposure (FR-4)
5. Prepare annual declaration
6. Purchase and surrender certificates (FR-6)

### FR-10: Producer Workflow
Separate onboarding for non-EU producers:
- Calculate their own installation-level emissions intensity
- Generate a "CBAM data package" to share with EU customers
- Track which customers have received their data
- Benchmark against peers (competitiveness tool)

### FR-11: Sector-Specific Guidance (In-App)
- Steel: BF-BOF vs Scrap-EAF vs DRI-EAF production routes, default ranges by country
- Aluminium: Primary vs secondary, direct vs indirect emissions
- Fertiliser: Gas vs coal feedstock, N₂O controls
- Cement: Clinker ratio, calcination process emissions
- Each sector: example cost scenarios, typical default ranges

### FR-12: Scenario Modelling (Enhance Existing)
- Model: "what if EUA price goes to €100/t?"
- Model: "what if I switch supplier from CN to TR?"
- Model: "what if I get 70% of my suppliers verified?"
- Show €/t and total annual cost impact

### FR-13: Audit Trail & Reporting
- Immutable log of every data entry, change, and calculation
- CBAM declaration export aligned to EU Registry template
- PDF: CBAM Declaration, SECR (existing), Executive Summary (existing)
- CSV export of all import data with full formula breakdown

### FR-14: UK CBAM Module (2027)
- Same data, different rules and registry
- Flag imports that will face BOTH EU and UK CBAM
- Timeline tracker for UK CBAM (expected 1 Jan 2027)

---

## NON-FUNCTIONAL REQUIREMENTS

### NFR-1: Security
- ISO 27001 certification target (CarbonChain has it — key trust signal)
- All data encrypted at rest and in transit (AES-256, TLS 1.3)
- Role-based access control (admin, analyst, viewer, supplier)
- Audit log of all access and changes (immutable)
- GDPR compliance — EU data residency option

### NFR-2: Data Accuracy & Traceability
- Every calculation must be fully traceable (input → formula → output)
- Version control on emission factors and benchmarks
- When EU updates default values — flag all affected records
- No black-box calculations — user can see the exact formula used

### NFR-3: Performance
- Dashboard loads in < 2 seconds with up to 10,000 import records
- Bulk CSV import of 1,000+ shipment records
- Real-time EUA price fetch with 15-minute cache
- PDF generation < 10 seconds

### NFR-4: Multi-Tenant & Multi-Entity
- One account can manage multiple organisations (importer + producer entity)
- Supplier portal: suppliers log in with limited access to submit their own data
- Team collaboration: invite colleagues with role-based permissions

### NFR-5: API-First Architecture
- All features accessible via REST API (already FastAPI — good)
- Webhooks for supplier data submissions
- Future: ERP integrations (SAP, Oracle for procurement teams)

### NFR-6: Reliability
- 99.9% uptime SLA target
- Daily data backups
- No data loss on declaration submissions

---

## MARKET POSITIONING — WHO IS YOUR CUSTOMER

**NOT:** Gunvor, ThyssenKrupp, Volvo → that's CarbonChain's territory

**YES:**
- UK/EU SMEs importing steel, aluminium, cement who have 5–50 suppliers
- Mid-market manufacturers who buy metal components from Asia/Turkey/India
- Trading houses with moderate import volumes (not commodity giants)
- Non-EU producers (steel mills, aluminium smelters) in Turkey, India, Egypt who need to package their emissions data for EU customers

**Why they'll choose you over CarbonChain:**
1. Affordable — CarbonChain is enterprise-priced (likely £20k+/year)
2. Self-serve — guided workflow, no sales call needed
3. Faster onboarding — not months of implementation
4. UK CBAM ready — CarbonChain is EU-focused

---

## WHAT TO BUILD NEXT (Priority Order)

### Phase 1 — Make Current Tool Honest & Accurate (2–3 weeks)
1. Fix CBAM cost formula — add phase-in rate, proper benchmark, carbon price deduction
2. Add "verified vs default" flag to every import record
3. Add CN code field (proper 8-digit code, not just category)
4. Add installation name field separate from supplier company
5. Add cost-savings alert: "switch to verified data = save €X"
6. Fix declaration status: pending → submitted → verified → surrendered

### Phase 2 — Supplier Management (3–4 weeks)
1. Supplier entity model (separate from import records)
2. Data request tracking: sent → received → verified
3. Email outreach templates (built-in)
4. Supplier risk score: % on defaults = financial risk rating
5. Supplier catalogue / public lookup (basic)

### Phase 3 — Compliance Workflow (2–3 weeks)
1. Authorised Declarant application checklist + deadline tracker
2. Certificate management module
3. Step-by-step importer guided workflow
4. Verification readiness checklist per installation

### Phase 4 — Intelligence Layer (2–3 weeks)
1. Scenario modeller with EUA price sensitivity
2. Supplier comparison (€/tonne cost difference)
3. Sector-specific guidance pages (steel, aluminium, cement, fertiliser)
4. UK CBAM tracker

### Phase 5 — Trust & Enterprise Readiness (ongoing)
1. Full audit trail
2. GDPR controls
3. Team collaboration / roles
4. ISO 27001 path
5. API access for ERP integrations

---

## DATA MODEL CHANGES REQUIRED

### CBAMImport — add these fields:
| Field | Type | Purpose |
|-------|------|---------|
| `cn_code` | string | Proper 8-digit EU CN code |
| `installation_name` | string | Specific installation (not company) |
| `installation_id` | string | EU Registry installation ID |
| `production_route` | enum | BF-BOF / EAF-scrap / DRI-EAF / primary-electrolytic / etc. |
| `emissions_intensity_tco2_per_t` | float | Actual verified intensity |
| `emissions_intensity_verified` | bool | Is data third-party verified? |
| `benchmark_tco2_per_t` | float | Installation or EU default benchmark |
| `phase_in_rate` | float | EU free allowance phase-out rate |
| `carbon_price_abroad_eur` | float | Deduction for carbon already paid |
| `cbam_certificates_required` | float | Certificates to purchase |
| `cbam_certificates_held` | float | Certificates already bought |
| `uses_default_values` | bool | Is this using punitive defaults? |
| `potential_saving_eur` | float | Saving if verified data obtained |

### New Model: Supplier
| Field | Type | Purpose |
|-------|------|---------|
| `id`, `user_id` | UUID | Identity |
| `name` | string | Company name |
| `country` | string | Country of origin |
| `installation_id` | string | EU Registry ID |
| `contact_email` | string | Data request contact |
| `cn_codes` | string | Comma-separated CN codes |
| `data_request_status` | enum | not_sent / sent / received / verified / failed |
| `last_request_date` | date | When last data request sent |
| `verified_data_available` | bool | Has verified data been received? |
| `emissions_intensity` | float | Their reported intensity |
| `production_route` | string | Their production method |

### New Model: CBAMCertificate
| Field | Type | Purpose |
|-------|------|---------|
| `id`, `user_id` | UUID | Identity |
| `quarter` | string | Q1/Q2/Q3/Q4 |
| `year` | int | Reporting year |
| `certificates_required` | float | Obligation |
| `certificates_held` | float | Currently purchased |
| `purchase_price_eur` | float | Price paid |
| `surrender_deadline` | date | 30 Sep 2027 for 2026 |
| `status` | enum | open / partial / complete |

### Organization — add:
| Field | Type | Purpose |
|-------|------|---------|
| `cbam_declarant_status` | enum | not_applied / applied / approved |
| `declarant_application_date` | date | When applied |
| `role` | enum | importer / producer / trader / both |
| `eori_number` | string | EU customs identifier |

---

## LANDING PAGE ADDITIONS
- "Are you in scope?" CN code calculator (instant scope check)
- "Your estimated CBAM exposure: €X" — hooks visitor to sign up
- Trust signals: GDPR compliant, EU CBAM Registry aligned, ISO 27001 (target)
- Transparent pricing tiers (not enterprise-gated like CarbonChain)
- Live EUA carbon price ticker
