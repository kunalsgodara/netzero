# NetZeroWorks — Master Plan (UK CBAM Focus)
## Full System Audit, Architecture, Roles, ER Diagram & Work Distribution

**STRATEGIC FOCUS:** This plan focuses on UK CBAM implementation first, with architecture designed to extend to EU CBAM in future phases. UK CBAM is underserved by competitors and has a simpler formula, making it ideal for MVP.

---

## SECTION 1: WHAT IS BUILT RIGHT NOW (Honest Audit)

### Backend (FastAPI + PostgreSQL + SQLAlchemy)

| Module | File | Status |
|--------|------|--------|
| User model | `models/user.py` | EXISTS — email, password (bcrypt), Google OAuth, UUID PK |
| Organization model | `models/organization.py` | EXISTS — linked to user, industry, reporting year, reduction target |
| EmissionActivity model | `models/emission.py` | EXISTS — scope 1/2/3, quantity, emission_factor, co2e_kg |
| EmissionFactor model | `models/emission.py` | EXISTS — DEFRA 2024 seeded factors |
| UK CBAM models | `models/uk_cbam.py` | EXISTS — uk_cbam_products, uk_ets_prices tables |
| UK CBAM Import model | `models/uk_cbam.py` | EXISTS — basic UK import tracking (needs UK-specific fields) |
| Report model | `models/report.py` | EXISTS — SECR, CBAM declaration, executive summary |
| Auth middleware | `middleware/auth.py` | EXISTS — JWT access + refresh tokens, TTL user cache |
| Auth controller | `controllers/auth_controller.py` | EXISTS — register, login, refresh, Google OAuth |
| Emissions controller | `controllers/emission_controller.py` | EXISTS |
| UK CBAM controllers | `controllers/products_controller.py`, `controllers/imports_controller.py`, `controllers/ets_price_controller.py` | EXISTS — UK CBAM product, import, and ETS price endpoints |
| Reports controller | `controllers/report_controller.py` | EXISTS |
| Organization controller | `controllers/organization_controller.py` | EXISTS |
| Integration controller | `controllers/integration_controller.py` | EXISTS — AI insights via Gemini (needs UK ETS price integration) |
| PDF generation | `services/report_pdf_service.py` | EXISTS |

### Frontend (React + Vite + Tailwind)

| Page | Status |
|------|--------|
| Landing page | EXISTS |
| Dashboard | EXISTS (needs UK CBAM metrics) |
| Emissions tracking | EXISTS |
| UK CBAM Manager | EXISTS (needs UK-specific fields and calculations) |
| Reports | EXISTS (needs UK CBAM declaration format) |
| AI Insights | EXISTS |
| Scenario Planner | EXISTS (needs UK CBAM scenarios) |
| Benchmarking | EXISTS |
| Onboarding | EXISTS |

### What is COMPLETELY MISSING (UK CBAM MVP)

| What | Why It Matters |
|------|---------------|
| UK CBAM liability formula | Current formula is wrong — needs: Embedded Emissions × UK ETS Price × (1 − Free Allocation Rate) |
| UK ETS price integration | Need live UK carbon price data (£/tCO₂e) |
| Free allocation rate tracking | UK uses declining free allocation (not phase-in like EU) |
| CN code (8-digit) proper field | CBAM regulation requires exact 8-digit codes not just categories |
| Installation-level emissions | CBAM is per-installation, not per-company |
| Verified vs default value flag | Can't quantify financial risk without this |
| UK CBAM declaration format | Need HMRC-compliant quarterly declaration format |
| Compliance deadline tracker | Jan 2027 UK CBAM start, quarterly deadlines — not tracked |
| Bulk CSV import | Required for 1000+ shipment importers |
| UK CBAM calculator page | Standalone calculator for quick liability estimates |
| Production route field | Different routes (BF-BOF, EAF, DRI) have different intensities |

### DEFERRED TO PHASE 2 (Not MVP)

| What | Why Deferred |
|------|--------------|
| Role-based access (Admin/Analyst/Supplier) | Single-user MVP is sufficient initially |
| Team/member invite system | Can share login for MVP |
| Supplier model + portal | Useful but not critical for initial UK CBAM tracking |
| Audit trail (immutable log) | Important for compliance but not blocking MVP |
| Multi-tenant (one account, multiple orgs) | Enterprise feature, not needed for MVP |
| GDPR controls / data residency | Required for scale but not MVP blocker |
| EU CBAM module | Future extension — UK CBAM first |

---

## SECTION 2: USER ROLES (PHASE 2 - DEFERRED)

**Note:** For UK CBAM MVP, we're starting with single-user accounts. Role-based access will be added in Phase 2 when extending to multi-user teams.

### Future Role Definitions (Phase 2)

Three roles will cover all real-world usage:
- **Admin** = account owner / company decision maker
- **Analyst** = finance or sustainability team member doing the data work
- **Supplier** = external producer submitting emissions data via portal

For MVP, all users have full access (Admin-equivalent).

### Authentication Flow (Simplified for MVP)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER ARRIVES AT APP                          │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
                ┌──────────────────────────┐
                │ Landing Page             │
                │ (public, no auth needed) │
                └──────────┬───────────────┘
                           │
                    ┌──────▼──────────┐
                    │ Login / Register │
                    │ (email+pass or  │
                    │  Google OAuth)  │
                    └──────┬──────────┘
                           │
                    ┌──────▼──────────────────────┐
                    │ JWT Access Token issued      │
                    │ Refresh Token issued (7 days)│
                    │ Token stored in localStorage │
                    └──────┬──────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Full Access │
                    │  (All users) │
                    └──────────────┘

Every API request:
  → Bearer token in header
  → Backend decodes JWT → gets user_id
  → Loads user from cache (60s TTL) or DB
  → If valid → proceed
  → If invalid → 401 Unauthorized
```

---

## SECTION 3: ER DIAGRAM (Entity-Relationship) — UK CBAM FOCUS

### Current State (What Exists)

```
┌─────────────────┐        ┌─────────────────────┐
│      USERS      │        │   ORGANIZATIONS      │
├─────────────────┤        ├─────────────────────┤
│ id (UUID) PK    │──┐     │ id (UUID) PK        │
│ email           │  │1    │ user_id (FK→users)  │
│ full_name       │  └────▶│ name                │
│ hashed_password │        │ industry            │
│ google_id       │        │ country             │
│ is_active       │        │ reporting_year      │
│ created_at      │        │ reduction_target_pct│
└─────────────────┘        │ base_year           │
        │                  │ revenue_gbp_m       │
        │                  │ onboarding_complete │
        │1                 └─────────────────────┘
        │
        ├──────────────────────────────────────────────────────────┐
        │                                                          │
        ▼many                                                      ▼many
┌────────────────────────┐              ┌──────────────────────────────┐
│   EMISSION_ACTIVITIES  │              │    UK_CBAM_IMPORTS           │
├────────────────────────┤              ├──────────────────────────────┤
│ id (UUID) PK           │              │ id (UUID) PK                 │
│ user_id (FK→users)     │              │ user_id (FK→users)           │
│ activity_name          │              │ organization_id (FK→orgs)    │
│ scope (1/2/3)          │              │ product_id (FK→products)     │
│ category               │              │ product_name                 │
│ source                 │              │ cn_code (8-digit)            │
│ quantity               │              │ category                     │
│ unit                   │              │ origin_country               │
│ emission_factor        │              │ quantity_tonnes              │
│ co2e_kg                │              │ emission_intensity           │
│ activity_date          │              │ embedded_emissions           │
│ reporting_period       │              │ uk_ets_price                 │
└────────────────────────┘              │ free_allocation_rate         │
                                        │ uk_cbam_liability            │
        ▼many                           │ import_date                  │
┌────────────────────────┐              │ quarter                      │
│      REPORTS           │              │ year                         │
├────────────────────────┤              │ declaration_status           │
│ id (UUID) PK           │              │ supplier_name                │
│ user_id (FK→users)     │              │ verified (bool)              │
│ title                  │              │ notes                        │
│ type (secr/uk_cbam)    │              └──────────────────────────────┘
│ period                 │
│ status                 │      ┌────────────────────────┐
│ total_emissions_tco2e  │      │   UK_CBAM_PRODUCTS     │
│ total_liability_gbp    │      ├────────────────────────┤
│ notes                  │      │ id (UUID) PK           │
│ start_date / end_date  │      │ cn_code                │
└────────────────────────┘      │ product_name           │
                                │ category               │
                                │ default_emission_factor│
                                │ unit                   │
                                │ notes                  │
                                └────────────────────────┘

                                ┌────────────────────────┐
                                │   UK_ETS_PRICES        │
                                ├────────────────────────┤
                                │ id (UUID) PK           │
                                │ date                   │
                                │ price_gbp_per_tonne    │
                                │ source                 │
                                │ notes                  │
                                └────────────────────────┘

                                ┌────────────────────────┐
                                │   EMISSION_FACTORS     │
                                ├────────────────────────┤
                                │ id (UUID) PK           │
                                │ scope                  │
                                │ category               │
                                │ source                 │
                                │ unit                   │
                                │ factor                 │
                                │ source_dataset         │
                                └────────────────────────┘
```

---

### Target State (What Needs to Be Added for UK CBAM MVP)

```
┌─────────────────────┐
│      USERS          │  (no changes needed for MVP)
├─────────────────────┤
│ id (UUID) PK        │
│ email               │
│ full_name           │
│ hashed_password     │
│ google_id           │
│ is_active           │
│ created_at          │
└─────────────────────┘

┌─────────────────────────────────────────┐
│          ORGANIZATIONS                  │  ← ADD UK-specific fields
├─────────────────────────────────────────┤
│ id (UUID) PK                            │
│ user_id (FK→users)                      │
│ name, industry, country, etc.  (exist)  │
│ org_type ← NEW                          │   importer | producer | trader | both
│ uk_cbam_registered ← NEW (bool)         │   registered with HMRC for UK CBAM?
│ uk_cbam_registration_date ← NEW         │
└─────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│           UK_CBAM_IMPORTS                        │  ← ADD missing fields
├──────────────────────────────────────────────────┤
│ id, user_id, product_name... (exist)             │
│ cn_code ← ENHANCE                                │   proper 8-digit CN code validation
│ installation_name ← NEW                          │   specific installation (not company)
│ installation_id ← NEW                            │   installation identifier
│ production_route ← NEW                           │   BF-BOF / EAF-scrap / DRI / etc.
│ emission_intensity ← ENHANCE                     │   rename from emission_factor
│ verified ← ENHANCE                               │   is data third-party verified?
│ uk_ets_price ← ENHANCE                           │   UK carbon price at import (£/tCO₂e)
│ free_allocation_rate ← NEW                       │   UK free allocation % (declining)
│ uk_cbam_liability ← ENHANCE                      │   calculated UK CBAM cost (£)
│ potential_saving_gbp ← NEW                       │   saving if verified data obtained
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────┐
│      COMPLIANCE_DEADLINES  ← NEW    │
├──────────────────────────────────────┤
│ id (UUID) PK                         │
│ user_id (FK→users)                   │
│ type (uk_cbam_declaration/           │
│       uk_cbam_registration)          │
│ due_date                             │
│ status (upcoming/at_risk/overdue/    │
│         complete)                    │
│ notes                                │
└──────────────────────────────────────┘
```

### DEFERRED TO PHASE 2 (Multi-user & Supplier Features)

```
┌──────────────────────┐
│   TEAM_MEMBERS       │   (Phase 2: multi-user teams)
├──────────────────────┤
│ id (UUID) PK         │
│ organization_id (FK) │
│ user_id (FK)         │
│ role                 │   admin | analyst
│ invited_by (FK user) │
│ invite_status        │   pending | accepted | revoked
│ created_at           │
└──────────────────────┘

┌──────────────────────────────────────┐
│         SUPPLIERS                    │   (Phase 2: supplier portal)
├──────────────────────────────────────┤
│ id (UUID) PK                         │
│ user_id (FK→users)                   │
│ organization_id (FK→orgs)            │
│ name                                 │
│ country                              │
│ installation_id                      │
│ contact_email                        │
│ cn_codes                             │
│ data_request_status                  │
│ verified_data_available (bool)       │
│ emissions_intensity                  │
│ production_route                     │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│         AUDIT_LOG                    │   (Phase 2: compliance)
├──────────────────────────────────────┤
│ id (UUID) PK                         │
│ user_id (FK→users)                   │
│ organization_id (FK→orgs)            │
│ action (create/update/delete/view)   │
│ entity_type (emission/cbam/report)   │
│ entity_id                            │
│ old_value (JSON)                     │
│ new_value (JSON)                     │
│ ip_address                           │
│ timestamp                            │
└──────────────────────────────────────┘
```

---

## SECTION 4: SYSTEM ARCHITECTURE (How It All Fits Together)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          PRODUCTION ARCHITECTURE                           │
└────────────────────────────────────────────────────────────────────────────┘

  USERS (Browser)                    EXTERNAL SERVICES
  ┌──────────────┐                   ┌─────────────────────┐
  │  React App   │                   │ Google OAuth API    │
  │  (Vite)      │                   │ Google Gemini AI    │
  │              │                   │ UK ETS Price API    │
  │  Pages:      │                   │ SendGrid (email)    │
  │  - Landing   │                   │ UK HMRC CBAM System │
  │  - Dashboard │                   └─────────────────────┘
  │  - Emissions │                           ▲
  │  - UK CBAM   │                           │
  │    Manager   │                   ┌───────┴───────────────────────┐
  │  - Reports   │                   │       FastAPI Backend         │
  │  - AI Insight│◄─────────────────▶│       (Python 3.10+)         │
  │  - Scenario  │   REST API        │                               │
  │  - Benchmark │   JSON + JWT      │  Controllers:                 │
  │  - UK CBAM   │                   │  - auth_controller            │
  │    Calculator│                   │  - emission_controller        │
  │  (NEW)       │                   │  - products_controller (UK)   │
  └──────────────┘                   │  - imports_controller (UK)    │
                                     │  - ets_price_controller (UK)  │
                                     │  - report_controller          │
                                     │  - organization_controller    │
                                     │  - dashboard_controller       │
                                     │                               │
                                     │  Middleware:                  │
                                     │  - JWT auth                   │
                                     │  - Rate limiting              │
                                     │                               │
                                     │  Services:                    │
                                     │  - auth_service               │
                                     │  - emission_service           │
                                     │  - products_service (UK)      │
                                     │  - imports_service (UK)       │
                                     │  - calculator (UK formula)    │ ← UK CBAM formula
                                     │  - ets_price_service (UK)     │ ← UK ETS price
                                     │  - report_service             │
                                     │  - report_pdf_service         │
                                     │  - report_aggregation_service │
                                     │  - integration_service        │ ← AI insights
                                     │  - organization_service       │
                                     └───────────┬───────────────────┘
                                                 │
                                     ┌───────────▼───────────────────┐
                                     │       PostgreSQL DB            │
                                     │                               │
                                     │  Tables:                      │
                                     │  - users                      │
                                     │  - organizations              │
                                     │  - emission_activities        │
                                     │  - emission_factors           │
                                     │  - uk_cbam_imports            │
                                     │  - uk_cbam_products           │
                                     │  - uk_ets_prices              │
                                     │  - reports                    │
                                     │  - compliance_deadlines (NEW) │
                                     │                               │
                                     │  Phase 2:                     │
                                     │  - team_members               │
                                     │  - suppliers                  │
                                     │  - audit_log                  │
                                     └───────────────────────────────┘
```

---

## SECTION 5: APPLICATION MINDMAP (Feature Tree) — UK CBAM FOCUS

```
NetZeroWorks (UK CBAM MVP)
│
├── 1. AUTH & IDENTITY
│   ├── Register (email/password) — EXISTS
│   ├── Login (email/password) — EXISTS
│   ├── Google OAuth — EXISTS
│   └── JWT access + refresh tokens — EXISTS
│
├── 2. ORGANIZATION SETUP
│   ├── Onboarding wizard — EXISTS
│   ├── Company profile — EXISTS
│   ├── [NEW] Org type: importer / producer / trader / both
│   └── [NEW] UK CBAM registration status
│
├── 3. EMISSIONS TRACKING
│   ├── Scope 1 / 2 / 3 logging — EXISTS
│   ├── DEFRA 2024 emission factors — EXISTS (seeded)
│   ├── Dashboard analytics — EXISTS
│   └── [NEW] Bulk CSV import
│
├── 4. UK CBAM MANAGER
│   ├── Basic import records — EXISTS
│   ├── UK CBAM default factors — EXISTS (seeded)
│   ├── [NEW] Proper 8-digit CN code field with validation
│   ├── [NEW] Installation-level data (name, ID, production route)
│   ├── [NEW] Verified vs default value flag
│   ├── [NEW] UK CBAM liability formula:
│   │   Embedded Emissions × UK ETS Price × (1 − Free Allocation Rate)
│   ├── [NEW] "You could save £X" alert per import
│   ├── [NEW] Bulk CSV import for shipments
│   └── [NEW] UK ETS price integration (live data)
│
├── 5. UK CBAM CALCULATOR [NEW]
│   ├── Standalone calculator page
│   ├── Inputs: Product, Quantity, Emissions Intensity, UK ETS Price, Free Allocation Rate
│   ├── Output: UK CBAM Liability (£)
│   ├── Formula breakdown visualization
│   └── Save as import record button
│
├── 6. COMPLIANCE DEADLINES [NEW]
│   ├── Jan 2027 — UK CBAM implementation start
│   ├── Quarterly — UK CBAM declaration deadlines
│   ├── Dashboard widget showing upcoming deadlines
│   └── Readiness score per deadline
│
├── 7. REPORTS
│   ├── SECR report — EXISTS
│   ├── UK CBAM declaration report — EXISTS (needs UK format)
│   ├── Executive summary PDF — EXISTS
│   ├── [NEW] UK CBAM declaration aligned to HMRC format
│   └── [NEW] CSV export with full formula breakdown
│
├── 8. AI & SCENARIO PLANNING
│   ├── AI insights via Gemini — EXISTS
│   ├── Scenario planner — EXISTS (basic)
│   ├── [NEW] UK ETS price sensitivity: "what if price = £100/t?"
│   ├── [NEW] Supplier switch: "what if I move from CN to TR?"
│   └── [NEW] Verification impact: "what if 70% suppliers verified?"
│
├── 9. BENCHMARKING
│   └── Industry benchmarks — EXISTS
│
└── 10. UK CBAM PRODUCTS REFERENCE [NEW]
    ├── Searchable table of UK CBAM products
    ├── Columns: CN Code, Product Name, Category, Default Emission Factor
    ├── Search by CN code or product name
    └── View product details modal
```

### PHASE 2 FEATURES (Deferred)

```
Phase 2: Multi-User & Supplier Features
│
├── 11. TEAM & ROLES
│   ├── Invite team members by email
│   ├── Assign role: admin / analyst
│   └── Revoke access
│
├── 12. SUPPLIER MANAGEMENT
│   ├── Supplier entity model
│   ├── Add/search suppliers by name, country, CN code
│   ├── Send data request email (built-in templates)
│   ├── Track status: not_sent → sent → received → verified → failed
│   ├── Supplier portal (separate login, limited access)
│   └── Risk score: % of imports on defaults = financial risk
│
└── 13. AUDIT & COMPLIANCE
    ├── Immutable audit log (every create/edit/delete)
    ├── GDPR data export/delete
    └── ISO 27001 documentation trail
```

---

## SECTION 6: THE UK CBAM FORMULA (Critical for Market Fit)

### What you have now (INCOMPLETE)
```python
# Current implementation (basic)
cbam_charge = emission_factor × quantity_tonnes
```
This is just emissions × factor. It's missing the UK-specific formula components.

### What you need (CORRECT per UK CBAM regulation)
```
UK CBAM Liability = Embedded Emissions × UK ETS Price × (1 − Free Allocation Rate)

Where:
  Embedded Emissions   = Quantity (tonnes) × Emissions Intensity (tCO₂e/tonne)
  UK ETS Price         = UK carbon price in £/tCO₂e (different from EU ETS)
  Free Allocation Rate = UK free allowance rate (declining from 2027-2034)
                        2027: 97.5%, 2028: 95%, 2029: 90%, ... declining to 0%
  
Note: UK CBAM is SIMPLER than EU CBAM:
  ✓ No benchmark deduction (unlike EU)
  ✓ No carbon price abroad deduction (unlike EU)
  ✓ Simpler phase-in mechanism (free allocation vs EU's complex phase-in)
```

### UK vs EU CBAM Formula Comparison

| Aspect | UK CBAM | EU CBAM |
|--------|---------|---------|
| **Formula** | Embedded Emissions × UK ETS Price × (1 − Free Allocation) | (Intensity − Benchmark) × Phase-in × Quantity × (EUA − Carbon Abroad) |
| **Complexity** | SIMPLER (3 components) | COMPLEX (5 components) |
| **Benchmark** | NO benchmark deduction | YES (reduces liability) |
| **Carbon Price** | UK ETS (£) | EU ETS (€) |
| **Phase-in** | Free allocation rate | Phase-in rate |
| **Carbon Abroad** | NO deduction | YES (deductible) |
| **Currency** | GBP (£) | EUR (€) |

### Financial Impact Example (UK CBAM)

| Scenario | Calculation | Cost |
|----------|------------|------|
| 10,000t steel, default intensity (2.5 tCO₂/t), UK ETS £60 | (10,000 × 2.5) × £60 × (1 − 0.975) | £3,750 |
| Same, verified intensity (1.8 tCO₂/t) | (10,000 × 1.8) × £60 × (1 − 0.975) | £2,700 |
| **Saving from getting verified data** | | **£1,050** |

**Note:** As free allocation rate declines, the liability increases:
- 2027 (97.5% free): Pay 2.5% of embedded emissions
- 2030 (85% free): Pay 15% of embedded emissions
- 2034 (0% free): Pay 100% of embedded emissions

This is the core value proposition: help importers get verified data to reduce liability as free allocation phases out.

---

### Implementation Requirements

**Backend Service (`services/calculator.py`):**
```python
def calculate_uk_cbam_liability(
    quantity_tonnes: float,
    emission_intensity: float,  # tCO2e/tonne
    uk_ets_price: float,  # £/tCO2e
    free_allocation_rate: float  # 0.975 for 2027, declining
) -> dict:
    """
    Calculate UK CBAM liability
    
    Returns:
        {
            'embedded_emissions': float,  # tCO2e
            'uk_ets_price': float,  # £/tCO2e
            'free_allocation_rate': float,  # e.g. 0.975
            'uk_cbam_liability': float,  # £
            'formula_breakdown': str
        }
    """
    embedded_emissions = quantity_tonnes * emission_intensity
    uk_cbam_liability = embedded_emissions * uk_ets_price * (1 - free_allocation_rate)
    
    return {
        'embedded_emissions': embedded_emissions,
        'uk_ets_price': uk_ets_price,
        'free_allocation_rate': free_allocation_rate,
        'uk_cbam_liability': uk_cbam_liability,
        'formula_breakdown': f"{embedded_emissions:.2f} tCO₂e × £{uk_ets_price:.2f}/tCO₂e × (1 - {free_allocation_rate}) = £{uk_cbam_liability:,.2f}"
    }
```

---

## SECTION 7: WORK DISTRIBUTION — UK CBAM MVP

Split by ownership area. Each person owns an area end-to-end (backend model + service + controller + frontend page).

---

### YOUR WORK (Aarchi) — UK CBAM Core + Product

**Why you:** You understand the product domain (UK CBAM regulation, what matters to market).

| Task | What to Build | Files to Create/Edit | Priority |
|------|---------------|---------------------|----------|
| Fix UK CBAM formula | Implement correct UK formula in calculator | `backend/app/services/calculator.py` | HIGH |
| Add missing UK CBAM fields | Migrate DB model with UK-specific fields | `backend/app/models/uk_cbam.py` | HIGH |
| Verified vs default flag | Flag + "save £X" alert in UI | `backend/app/models/uk_cbam.py`, `frontend/src/pages/ImportsListPage.jsx` | HIGH |
| CN code validation | 8-digit code field + validation | `backend/app/schemas/uk_cbam.py`, `frontend/src/pages/AddImportPage.jsx` | HIGH |
| Installation-level data | Installation name/ID/route fields | `backend/app/models/uk_cbam.py`, `frontend/src/pages/AddImportPage.jsx` | HIGH |
| UK CBAM calculator page | Standalone calculator | `frontend/src/pages/UKCBAMCalculator.jsx` (NEW) | HIGH |
| UK ETS price integration | Live UK carbon price data | `backend/app/services/ets_price_service.py` | HIGH |
| Free allocation rate tracking | Add rate field + auto-calculation by year | `backend/app/services/calculator.py` | HIGH |
| Compliance deadline tracker | Deadline model + dashboard widget | `backend/app/models/uk_cbam.py` (add model), `frontend/src/components/DeadlineWidget.jsx` (NEW) | MEDIUM |
| Scenario planner improvements | UK ETS sensitivity, supplier switch | `frontend/src/pages/ScenarioPlanner.jsx` | MEDIUM |
| UK CBAM products reference page | Searchable products table | `frontend/src/pages/UKCBAMProducts.jsx` (NEW) | LOW |
| Bulk CSV import | CSV upload for imports | `frontend/src/pages/ImportsListPage.jsx`, `backend/app/controllers/imports_controller.py` | LOW |

---

### KUNAL'S WORK — Infrastructure & Polish

**Why Kunal:** Backend infrastructure, testing, deployment work that doesn't require deep CBAM domain knowledge.

| Task | What to Build | Files to Create/Edit | Priority |
|------|---------------|---------------------|----------|
| UK ETS price seeder | Seed historical UK ETS prices | `backend/app/seeders/uk_ets_prices_seed.py` | HIGH |
| UK CBAM products seeder | Seed UK product reference data | `backend/app/seeders/uk_cbam_products_seed.py` | HIGH |
| Database migration scripts | Alembic migrations for UK CBAM | `backend/alembic/versions/` | HIGH |
| API documentation | Swagger/OpenAPI docs for UK CBAM endpoints | `backend/app/main.py` | MEDIUM |
| Unit tests | Tests for UK CBAM formula | `backend/tests/test_calculator.py` (NEW) | MEDIUM |
| Integration tests | End-to-end UK CBAM flow tests | `backend/tests/test_uk_cbam_flow.py` (NEW) | MEDIUM |
| Performance optimization | Query optimization for large datasets | `backend/app/services/` | LOW |
| Error handling | Consistent error responses | `backend/app/middleware/error_handler.py` (NEW) | LOW |

---

### PHASE 2 WORK (Deferred)

| Task | What to Build | Owner | Priority |
|------|---------------|-------|----------|
| Role field on User | Add `role` enum to User model | Kunal | PHASE 2 |
| Role-based middleware | `require_role()` dependency | Kunal | PHASE 2 |
| TeamMember model | New model for org memberships | Kunal | PHASE 2 |
| Team invite system | Invite by email, accept token | Kunal | PHASE 2 |
| Supplier model | Full supplier entity | Kunal | PHASE 2 |
| Supplier controller | CRUD + data request tracking | Kunal | PHASE 2 |
| Supplier portal UI | Limited-access supplier pages | Aarchi | PHASE 2 |
| Audit log model | Immutable audit trail | Kunal | PHASE 2 |
| Audit log service | Auto-log on every write | Kunal | PHASE 2 |
| Email service | SendGrid/SMTP for invites | Kunal | PHASE 2 | + data requests | `backend/app/services/email_service.py` (NEW) |
| Organization fields | Add org_role, EORI, declarant status | `backend/app/models/organization.py` |
| Bulk CSV import | Emissions + CBAM CSV upload endpoint | `backend/app/controllers/` |
| Rate limiting | Protect API endpoints | `backend/app/main.py` |
| Production deployment | Docker, Nginx, SSL | `docker-compose.yml` (NEW), `nginx.conf` (NEW) |

---

### SHARED / SYNC POINTS

| Sync Point | When to Sync |
|-----------|-------------|
| Role middleware API contract | Before Kunal builds middleware, agree on how frontend sends role checks |
| Supplier portal URL structure | Before building supplier auth, agree on `/supplier/*` route prefix |
| CBAM formula output schema | Before building calculator, agree on JSON response shape |
| DB migration strategy | Agree on Alembic vs raw SQL for new columns — do this together first |
| Environment variables | Keep one shared `.env.example` updated |

---

### ORDER OF WORK (6 Phases)

```
PHASE 1 — Week 1: Fix Core CBAM Formula (CRITICAL)
  Aarchi: cbam_formula_service.py + DB migration for new CBAM fields
  Aarchi: Update cbam_service.py to call formula on every save
  Aarchi: Remove frontend calculation from CBAMManager.jsx
  SYNC:   Agree on JSON response shape for formula output

PHASE 2 — Week 2: Supplier System
  Kunal:  Supplier model, service, controller, DB migration
  Kunal:  Supplier portal (token-based, no auth) + invite email
  Aarchi: Link supplier_id to CBAMImport, update formula to use verified data
  SYNC:   Test supplier data submission updates CBAM cost correctly

PHASE 3 — Week 3: Insight Engine + Dashboard Upgrade
  Aarchi: insight_service.py — compute savings, top cost drivers
  Aarchi: GET /api/v1/cbam/insights endpoints
  Aarchi: Upgrade Dashboard.jsx — insight cards, default vs verified chart
  SYNC:   Validate insight numbers against manual calculation

PHASE 4 — Week 4: Roles + Team
  Kunal:  role field on User + require_role() dependency
  Kunal:  TeamMember model + invite system + Team.jsx
  Both:   Apply role guards to all existing routes
  SYNC:   Test that supplier role is locked to portal only

PHASE 5 — Week 5: Bulk Import + Audit + Export
  Aarchi: POST /cbam-imports/bulk (CSV + column mapping UI)
  Kunal:  audit_log table + audit_service.py (log all writes)
  Aarchi: export_service.py — Excel with formula breakdown
  Kunal:  XML export endpoint (structured, no XSD yet)

PHASE 6 — Week 6: Compliance + Certificates
  Aarchi: compliance_deadlines table + Compliance.jsx
  Aarchi: cbam_certificates table + Certificates.jsx
  Both:   Add deadline widget to Dashboard
  SYNC:   Final QA pass before first external demo
```

---

## SECTION 8: PRODUCTION READINESS CHECKLIST

### Security (Do Before Launch)
- [ ] Role-based access control on every API endpoint
- [ ] Rate limiting on auth endpoints (prevent brute force)
- [ ] All passwords bcrypt-hashed (EXISTS — using passlib bcrypt)
- [ ] Tokens expire: access 60min, refresh 7 days (EXISTS)
- [ ] HTTPS only in production (Nginx SSL termination)
- [ ] Environment variables never committed to git (use .env.example)
- [ ] CORS restricted to production domain only
- [ ] SQL injection prevention (SQLAlchemy ORM handles this)
- [ ] XSS prevention (React escapes by default, no dangerouslySetInnerHTML)
- [ ] Input validation on all API schemas (Pydantic handles this)
- [ ] Audit log for all data changes
- [ ] GDPR: user data export + delete endpoint

### Performance (Do Before Scale)
- [ ] Database connection pooling (asyncpg already used — good)
- [ ] Add indexes on: user_id FK columns, import_date, category
- [ ] User cache 60s TTL (EXISTS in auth middleware)
- [ ] EUA price fetch cache 15 minutes
- [ ] PDF generation async (don't block request thread)
- [ ] Pagination on all list endpoints (IN PROGRESS per git branch)
- [ ] Bulk CSV import endpoint with streaming

### Reliability
- [ ] Docker containerization
- [ ] Health check endpoint `/api/health`
- [ ] Alembic database migrations (currently no migration system)
- [ ] Daily database backups (Postgres pg_dump cron)
- [ ] Error monitoring (Sentry — free tier available)
- [ ] Uptime monitoring (UptimeRobot — free)

### Data Accuracy
- [ ] CBAM formula audit: every calculation shows inputs + formula + output
- [ ] EU benchmark values versioned (when EU updates, flag affected records)
- [ ] Phase-in rate table hardcoded per year (2026-2034)

---

## SECTION 9: DEPLOYMENT PLAN

### Target Stack (Production)

```
┌─────────────────────────────────────────────────────┐
│                   DEPLOYMENT STACK                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Domain: netzeroworks.com (or similar)              │
│                                                     │
│  ┌─────────────────┐    ┌──────────────────────┐   │
│  │   Vercel / CDN  │    │   Railway / Render    │   │
│  │  (Frontend)     │    │   (Backend + DB)      │   │
│  │                 │    │                       │   │
│  │  React build    │    │  FastAPI (Gunicorn    │   │
│  │  Static files   │    │  + Uvicorn workers)   │   │
│  │  Auto-deploy    │◄───►                       │   │
│  │  from main      │    │  PostgreSQL (managed) │   │
│  └─────────────────┘    │  Redis (sessions/cache│   │
│                         │    optional)          │   │
│                         └──────────────────────┘   │
│                                                     │
│  Alternative (self-hosted):                         │
│  VPS (Hetzner €5/mo or DigitalOcean $12/mo)        │
│  → Docker Compose                                   │
│  → Nginx (SSL termination, reverse proxy)           │
│  → Certbot (free SSL)                               │
│  → PostgreSQL container                             │
│  → FastAPI container                                │
│  → Vite build served by Nginx                       │
└─────────────────────────────────────────────────────┘
```

### Recommended Path (Fastest to Market)
1. **Frontend**: Vercel — free tier, auto-deploys from `main` branch, custom domain
2. **Backend**: Railway — auto-deploys from git, managed PostgreSQL included, ~$5/month
3. **Email**: SendGrid — 100 emails/day free tier (for supplier invites)
4. **Error tracking**: Sentry — free tier, instant error alerts
5. **Uptime**: UptimeRobot — free, checks every 5 minutes

### Things Blocking Deployment Right Now
1. No `alembic` setup → DB schema changes break in production
2. No health check endpoint → can't use managed hosting health checks
3. No Docker setup → manual deploy is error-prone
4. CORS is hardcoded to localhost → will break in production
5. No migration for new fields → can't safely add new columns

---

## SECTION 10: PRICING & MARKET TIERS (For Context When Building Features)

| Tier | Who | Price Target | Key Features |
|------|-----|-------------|--------------|
| **Free / Scope Check** | Anyone | Free | CN code scope check, CBAM exposure estimate, no sign-in |
| **Starter** | SME, 1-5 suppliers | £49/month | Full CBAM tracking, supplier management, PDF reports |
| **Growth** | Mid-market, 5-50 suppliers | £149/month | Team members (up to 5), scenario modelling, UK CBAM |
| **Professional** | Enterprise, unlimited | £399/month | Unlimited users, API access, audit trail, ISO readiness |
| **Supplier** | Non-EU producers | £29/month | Producer portal, emissions packaging, customer sharing |

---

## SUMMARY TABLE: BUILT vs NOT BUILT

| Feature | Built | Phase |
|---------|-------|-------|
| Email/password auth | ✅ | — |
| Google OAuth | ✅ | — |
| JWT tokens | ✅ | — |
| Organization profile | ✅ | — |
| Scope 1/2/3 emissions | ✅ | — |
| DEFRA 2024 factors | ✅ | — |
| Basic CBAM imports (CRUD) | ✅ | — |
| CBAM EU default factors (seeded) | ✅ | — |
| Dashboard analytics (basic) | ✅ | — |
| AI insights (Gemini) | ✅ | — |
| PDF report generation | ✅ | — |
| SECR / CBAM reports | ✅ | — |
| EUA price fetch (hardcoded) | ✅ | — |
| Scenario planner (basic) | ✅ | — |
| Benchmarking page | ✅ | — |
| Pagination on list endpoints | ✅ | — |
| **Correct CBAM formula (benchmark, phase-in, carbon abroad)** | ❌ | Phase 1 |
| **Backend calculation (not frontend)** | ❌ | Phase 1 |
| **Verified vs default value flag** | ❌ | Phase 1 |
| **CN code (8-digit) field** | ❌ | Phase 1 |
| **Installation-level data** | ❌ | Phase 1 |
| **Supplier model + CRUD** | ❌ | Phase 2 |
| **Supplier invite system (token)** | ❌ | Phase 2 |
| **Supplier portal (self-service)** | ❌ | Phase 2 |
| **Supplier status tracking** | ❌ | Phase 2 |
| **Insight engine (savings, overpayment)** | ❌ | Phase 3 |
| **Dashboard insight cards** | ❌ | Phase 3 |
| **Default vs verified chart** | ❌ | Phase 3 |
| **Role-based access control (admin/analyst/supplier)** | ❌ | Phase 4 |
| **Team/member invite system** | ❌ | Phase 4 |
| **Bulk CSV import (CBAM)** | ❌ | Phase 5 |
| **Audit trail (immutable log)** | ❌ | Phase 5 |
| **Excel export with formula breakdown** | ❌ | Phase 5 |
| **XML export endpoint** | ❌ | Phase 5 |
| **CBAM certificate management** | ❌ | Phase 6 |
| **Compliance deadline tracker** | ❌ | Phase 6 |
| **Authorised Declarant workflow** | ❌ | Phase 6 |
| **Email service (invites/data requests)** | ❌ | Phase 2 |
| **Alembic migrations** | ❌ | Phase 1 |
| **EORI + declarant status on org** | ❌ | Phase 4 |
| **Health check endpoint** | ❌ | Phase 5 |
| **UK CBAM module** | ❌ | Post-MVP |
| **XSD-validated XML** | ❌ | Post-MVP |
| **Real-time EUA price feed** | ❌ | Post-MVP |
| **Docker setup** | ❌ | Post-MVP |
| **GDPR controls** | ❌ | Post-MVP |
| **Rate limiting** | ❌ | Post-MVP |

---

---

## SECTION 11: INSIGHT ENGINE (Cost Savings Analysis)

### Purpose
The insight engine is the core product differentiator. It computes — from existing CBAM import data — exactly how much the company is overpaying due to missing supplier data, and which suppliers to fix first.

### Service: `insight_service.py` (NEW)

**Computed fields:**

| Field | Definition |
|-------|-----------|
| `total_cbam_cost_eur` | Sum of all `cbam_cost_eur` |
| `cost_using_defaults_eur` | Sum where `data_source = 'default'` |
| `cost_with_verified_data_eur` | Sum where `data_source = 'supplier'` |
| `potential_savings_eur` | Difference if default imports used average verified intensity |
| `pct_imports_using_defaults` | % of imports on default values |
| `pct_cost_using_defaults` | % of CBAM cost driven by default values |
| `suppliers_not_contacted` | Count where `data_request_status = 'not_sent'` |
| `suppliers_pending` | Count where `data_request_status = 'sent'` |
| `top_cost_drivers` | Top 5 suppliers ranked by CBAM cost contribution |

**Insight messages (rule-based, no AI hallucination):**
- `"You are paying €{X} based on default emission values. Collecting supplier data could save up to €{Y}."`
- `"3 suppliers account for 67% of your CBAM cost. Prioritise contacting: {names}."`
- `"Q1 2025 declaration deadline is in 23 days."`
- `"Only 2 of your 11 suppliers have submitted verified emissions data."`

**Endpoint:**
```
GET /api/v1/cbam/insights        ← full analysis
GET /api/v1/cbam/insights/summary ← lightweight for dashboard cards
```

**Dashboard cards driven by this service:**

| Card | Data Source |
|------|------------|
| Total CBAM Cost | `total_cbam_cost_eur` |
| % Using Defaults | `pct_cost_using_defaults` |
| Potential Savings | `potential_savings_eur` |
| Suppliers Pending | `suppliers_pending` |

---

## SECTION 12: COMPLETE API ENDPOINT LIST

### Existing Endpoints (Keep — some modified)

```
# Auth
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me

# Emissions
GET    /api/v1/emission-activities          ← paginated, filtered
POST   /api/v1/emission-activities
PUT    /api/v1/emission-activities/{id}
DELETE /api/v1/emission-activities/{id}
POST   /api/v1/emission-activities/bulk-import ← CSV (exists)
GET    /api/v1/emission-factors
GET    /api/v1/emission-factors/cbam

# CBAM Imports (MODIFIED — backend now calculates formula)
GET    /api/v1/cbam-imports                 ← add uses_default filter
POST   /api/v1/cbam-imports                 ← backend calculates, not frontend
PUT    /api/v1/cbam-imports/{id}            ← recalculates on every save
DELETE /api/v1/cbam-imports/{id}
GET    /api/v1/cbam-imports/eu-ets-price    ← keep, integrate live feed later

# Reports
GET    /api/v1/reports
POST   /api/v1/reports
POST   /api/v1/reports/generate
GET    /api/v1/reports/preview
GET    /api/v1/reports/{id}/pdf
GET    /api/v1/reports/{id}/data
PUT    /api/v1/reports/{id}
DELETE /api/v1/reports/{id}

# Organization
GET    /api/v1/organization
PUT    /api/v1/organization
```

### New Endpoints (Build in phases)

```
# Suppliers
GET    /api/v1/suppliers
POST   /api/v1/suppliers
PUT    /api/v1/suppliers/{id}
DELETE /api/v1/suppliers/{id}
POST   /api/v1/suppliers/{id}/invite            ← send token email
GET    /api/v1/suppliers/portal/{token}         ← supplier reads their record (no auth)
POST   /api/v1/suppliers/portal/{token}/submit  ← supplier submits data (no auth)

# CBAM Bulk Import
POST   /api/v1/cbam-imports/bulk                ← CSV upload with column mapping

# CBAM Validation
POST   /api/v1/cbam-imports/validate            ← CN code, country, qty checks

# Insights
GET    /api/v1/cbam/insights
GET    /api/v1/cbam/insights/summary

# Certificates
GET    /api/v1/cbam-certificates
POST   /api/v1/cbam-certificates
PUT    /api/v1/cbam-certificates/{id}

# Export
GET    /api/v1/exports/cbam/excel               ← Excel with full formula breakdown
GET    /api/v1/exports/cbam/xml                 ← XML structure (no XSD validation yet)

# Team Members
GET    /api/v1/team-members
POST   /api/v1/team-members/invite
PUT    /api/v1/team-members/{id}/role
DELETE /api/v1/team-members/{id}

# Audit Log (admin only)
GET    /api/v1/audit-log

# Compliance
GET    /api/v1/compliance/deadlines
POST   /api/v1/compliance/deadlines
PUT    /api/v1/compliance/deadlines/{id}

# Health
GET    /api/health
```

---

## SECTION 13: FRONTEND PAGE STRUCTURE

### Existing Pages (Keep — some upgraded)

| Route | Page | Changes |
|-------|------|---------|
| `/dashboard` | Dashboard.jsx | Upgrade — add insight cards, default vs verified chart |
| `/emissions` | Emissions.jsx | Keep as-is |
| `/cbam` | CBAMManager.jsx | Fix formula display, add verified/default flag badge |
| `/reports` | Reports.jsx | Keep, fix aggregation data |
| `/ai-insights` | AIInsights.jsx | Restrict to summarizing computed facts only |
| `/scenario-planner` | ScenarioPlanner.jsx | Add EUA sensitivity, supplier switch scenarios |
| `/benchmarking` | Benchmarking.jsx | Keep as-is |
| `/onboarding` | Onboarding.jsx | Add EORI + declarant status fields |

### New Pages (Build in phases)

| Route | Page | Description |
|-------|------|-------------|
| `/suppliers` | Suppliers.jsx | Supplier list, status tracker, invite button |
| `/suppliers/:id` | SupplierDetail.jsx | Supplier detail, invite controls, data history |
| `/portal/:token` | SupplierPortal.jsx | Token-gated, no auth — supplier self-service form |
| `/cbam/bulk-import` | BulkImport.jsx | CSV upload with column mapping UI |
| `/insights` | Insights.jsx | Full insight panel with savings breakdown |
| `/certificates` | Certificates.jsx | Certificate holdings and surrender tracking |
| `/compliance` | Compliance.jsx | Deadline tracker with readiness score |
| `/team` | Team.jsx | Team members, roles, invite management |
| `/exports` | Exports.jsx | Export center (Excel, XML) |
| `/audit-log` | AuditLog.jsx | Immutable activity log (admin only) |

---

## SECTION 14: IMPLEMENTATION PHASES

### Phase 1 — Fix Core CBAM Formula (Week 1) — CRITICAL

Everything downstream depends on correct numbers.

1. Create `backend/app/services/cbam_formula_service.py`
2. Add new columns to `cbam_imports` via Alembic migration:
   - `cn_code`, `benchmark_tco2_per_t`, `phase_in_rate`, `emissions_intensity_tco2_per_t`, `carbon_price_abroad_eur`, `cbam_certificates_required`, `uses_default_values`, `data_source`
3. Update `cbam_service.py` — call `calculate_cbam()` on every create/update
4. Update `cbam.py` schemas — add new fields
5. Update `CBAMManager.jsx` — remove frontend calculation, display backend result
6. Add phase-in rate table per year (2026: 2.5%, 2027: 5% ... 2034: 100%)

**Aarchi owns this phase.**

---

### Phase 2 — Supplier System (Week 2)

1. Create `suppliers` table + Alembic migration
2. Create `backend/app/models/Supplier.py`
3. Create `backend/app/schemas/supplier.py`
4. Create `backend/app/services/supplier_service.py`
5. Create `backend/app/controllers/supplier_controller.py`
6. Add `supplier_id` FK to `cbam_imports`
7. Formula service: when `supplier.verification_status = 'verified'` → use `supplier.emissions_intensity`
8. Create `frontend/src/pages/Suppliers.jsx`
9. Create `frontend/src/pages/SupplierPortal.jsx` (token-gated, no auth required)

**Kunal owns this phase.**

---

### Phase 3 — Insight Engine + Dashboard Upgrade (Week 3)

1. Create `backend/app/services/insight_service.py`
2. Create `GET /api/v1/cbam/insights` and `/insights/summary` endpoints
3. Upgrade `Dashboard.jsx`:
   - Replace static KPI cards with insight-driven cards (cost, % defaults, savings, pending)
   - Add default vs verified comparison bar chart
   - Add actionable insights panel
4. Create `frontend/src/pages/Insights.jsx` — full breakdown view

**Aarchi owns this phase.**

---

### Phase 4 — Roles + Team (Week 4)

1. Add `role` column to `users` table via migration
2. Create `team_members` table
3. Create `require_role()` FastAPI dependency
4. Apply role checks to all mutating routes
5. Create team invite flow (email link → accept → role assigned)
6. Create `frontend/src/pages/Team.jsx`

**Kunal owns this phase.**

---

### Phase 5 — CSV Bulk Import + Audit + Export (Week 5)

1. Add `POST /api/v1/cbam-imports/bulk` route
2. Add CN code validation, non-EU country check, quantity/emission range validation
3. Create `frontend/src/pages/BulkImport.jsx` with column mapping UI
4. Create `audit_log` table + `audit_service.py` — log every create/update/delete
5. Create `export_service.py` — Excel export with openpyxl (full formula breakdown)
6. Add XML export endpoint (structured, no XSD compliance validation)

**Shared — Aarchi: bulk import + export | Kunal: audit**

---

### Phase 6 — Compliance + Certificates (Week 6)

1. Create `compliance_deadlines` table + seeded EU deadlines (31 Mar 2026, 30 Sep 2027)
2. Create `cbam_certificates` table
3. Add deadline tracker widget to Dashboard
4. Create `frontend/src/pages/Compliance.jsx`
5. Create `frontend/src/pages/Certificates.jsx`

**Aarchi owns this phase.**

---

### What NOT to Build in MVP (Explicit Out-of-Scope)

| Feature | Reason to Defer |
|---------|----------------|
| UK CBAM module | Legislation not final until 2027 |
| XSD-validated XML | EU Registry API not public yet |
| Real-time EUA price | Needs stable, reliable API source first |
| Precursor tracking | Complex goods only — exclude Phase 1-4 |
| Multi-language supplier portal | English only for MVP |
| AI emission predictions | No hallucinated data — AI summarizes facts only |

---

## SECTION 15: PRIORITY MATRIX

```
┌──────────────────────────────────────────────────────┐
│  HIGH IMPACT │ LOW EFFORT  → Do First                 │
│  ─────────────────────────────────────────────────── │
│  ✅ Fix CBAM formula (Phase 1)                        │
│  ✅ Insight dashboard cards (Phase 3)                 │
│  ✅ Verified vs default flag (Phase 1)                │
│                                                       │
│  HIGH IMPACT │ HIGH EFFORT → Schedule Next            │
│  ─────────────────────────────────────────────────── │
│  🔨 Supplier system + portal (Phase 2)                │
│  🔨 Insight engine with savings calculation (Phase 3) │
│  🔨 Role-based access (Phase 4)                       │
│                                                       │
│  LOW IMPACT  │ LOW EFFORT  → Fill Gaps                │
│  ─────────────────────────────────────────────────── │
│  📦 EORI/declarant org fields (Phase 4)               │
│  📦 Compliance deadlines tracker (Phase 6)            │
│  📦 Health check endpoint (Phase 5)                   │
│                                                       │
│  LOW IMPACT  │ HIGH EFFORT → Defer Post-MVP           │
│  ─────────────────────────────────────────────────── │
│  ⏳ XML export with XSD validation                    │
│  ⏳ UK CBAM module                                    │
│  ⏳ Precursor emissions tracking                      │
└──────────────────────────────────────────────────────┘
```

---

*Last updated: April 2026 | Branch: pagination-improvements*


---

## SECTION 8: FUTURE EXTENSIONS (Post-MVP)

### Why UK CBAM First?

**Strategic Rationale:**
1. **Simpler formula** — UK CBAM has 3 components vs EU's 5 (no benchmark, no carbon abroad deduction)
2. **Faster MVP** — Less complexity = faster time to market
3. **Market gap** — Competitors (CarbonChain, Persefoni) focus on EU CBAM, UK is underserved
4. **Extensible architecture** — Database schema designed to accommodate both UK and EU

### EU CBAM Extension Plan (Phase 3)

When extending to EU CBAM, the architecture supports it with minimal changes:

**Database Changes:**
- Add `cbam_type` enum field to `uk_cbam_imports`: 'UK' | 'EU' | 'BOTH'
- Add EU-specific fields to imports table:
  - `benchmark_tco2_per_t` (EU benchmark value)
  - `phase_in_rate` (EU phase-in percentage)
  - `carbon_price_abroad_eur` (carbon tax paid in origin country)
  - `eu_cbam_liability_eur` (calculated EU liability)
- Rename table from `uk_cbam_imports` to `cbam_imports` (generic)
- Create `eu_cbam_products` table (EU product reference data)
- Create `eu_ets_prices` table (EU carbon price tracking)

**Formula Changes:**
```python
# UK CBAM (current)
uk_liability = embedded_emissions × uk_ets_price × (1 - free_allocation_rate)

# EU CBAM (future)
eu_liability = (intensity - benchmark) × phase_in_rate × quantity × (eua_price - carbon_abroad)
```

**Frontend Changes:**
- Add CBAM type selector: "UK" | "EU" | "Both"
- Conditional field rendering based on type
- Dual liability display for importers with both obligations
- EU-specific calculator page

**Backend Changes:**
- Extend `calculator.py` with `calculate_eu_cbam_liability()` function
- Add EU ETS price integration
- Add EU benchmark lookup service
- Extend reports to support EU declaration format

### Multi-User & Supplier Portal (Phase 2)

**When to build:**
- After UK CBAM MVP is validated with 10+ paying customers
- When customers request team collaboration features
- When supplier data collection becomes a bottleneck

**What to build:**
- Role-based access control (Admin, Analyst, Supplier)
- Team invite system with email notifications
- Supplier portal (limited access for data submission)
- Audit trail for compliance

### Enterprise Features (Phase 4)

**When to build:**
- After achieving product-market fit
- When targeting enterprise customers (1000+ imports/year)
- When compliance requirements become critical

**What to build:**
- Multi-tenant architecture (one account, multiple organizations)
- GDPR controls and data residency options
- Advanced audit trail with immutable logging
- SSO integration (SAML, OAuth)
- API access for ERP integration
- White-label options for consultancies

---

## SECTION 9: SUCCESS METRICS

### MVP Success Criteria (UK CBAM)

**Technical Metrics:**
- [ ] UK CBAM formula implemented correctly (validated against HMRC examples)
- [ ] UK ETS price integration working (live data)
- [ ] All UK CBAM imports calculate liability accurately
- [ ] Dashboard shows UK CBAM metrics
- [ ] UK CBAM declaration report generates correctly
- [ ] Calculator page functional and accurate

**Business Metrics:**
- [ ] 5 beta customers using UK CBAM features
- [ ] 100+ UK CBAM import records created
- [ ] Average calculation accuracy: 99%+
- [ ] User feedback: 4+ stars on ease of use
- [ ] Time to calculate liability: <5 seconds

**User Experience Metrics:**
- [ ] Onboarding completion rate: >80%
- [ ] UK CBAM calculator usage: >50% of users
- [ ] Return user rate: >60% (weekly)
- [ ] Support tickets: <5% of users

### Phase 2 Success Criteria (Multi-User)

**Technical Metrics:**
- [ ] Role-based access working correctly
- [ ] Team invite system functional
- [ ] Supplier portal accessible and secure

**Business Metrics:**
- [ ] 20+ organizations with multiple users
- [ ] Average team size: 2-3 users
- [ ] Supplier portal adoption: >30% of customers

### Phase 3 Success Criteria (EU CBAM)

**Technical Metrics:**
- [ ] EU CBAM formula implemented correctly
- [ ] Dual UK/EU liability calculations working
- [ ] EU ETS price integration working

**Business Metrics:**
- [ ] 10+ customers using both UK and EU CBAM
- [ ] EU CBAM import records: 500+
- [ ] Revenue from EU CBAM features: 30%+ of total

---

## SECTION 10: TECHNICAL DEBT & KNOWN ISSUES

### Current Technical Debt

| Issue | Impact | Priority | Effort |
|-------|--------|----------|--------|
| No input validation on CN codes | Data quality issues | HIGH | 2 days |
| No bulk CSV import | Manual data entry for large importers | HIGH | 3 days |
| No error handling for UK ETS price API failures | App breaks if API down | HIGH | 1 day |
| No caching for UK ETS prices | Slow dashboard load | MEDIUM | 2 days |
| No pagination on imports list | Slow for 1000+ imports | MEDIUM | 2 days |
| No database indexes on common queries | Slow queries at scale | MEDIUM | 1 day |
| No automated tests for UK CBAM formula | Risk of regression | HIGH | 3 days |
| No API rate limiting | Vulnerable to abuse | LOW | 1 day |

### Known Bugs

| Bug | Severity | Status |
|-----|----------|--------|
| Dashboard crashes with 0 imports | LOW | Open |
| UK ETS price not updating daily | MEDIUM | Open |
| PDF export fails for large reports | MEDIUM | Open |
| Mobile UI broken on imports page | LOW | Open |

### Security Considerations

| Risk | Mitigation | Priority |
|------|------------|----------|
| JWT tokens stored in localStorage | Move to httpOnly cookies | HIGH |
| No rate limiting on API endpoints | Add rate limiting middleware | HIGH |
| No input sanitization | Add validation layer | HIGH |
| No HTTPS enforcement | Add HTTPS redirect | HIGH |
| No SQL injection protection | Use parameterized queries (already done) | ✓ Done |
| No XSS protection | Add CSP headers | MEDIUM |

---

## APPENDIX: KEY DECISIONS & RATIONALE

### Decision 1: UK CBAM First (Not EU)

**Decision:** Build UK CBAM MVP before EU CBAM

**Rationale:**
- Simpler formula (3 components vs 5)
- Underserved market (competitors focus on EU)
- Faster time to market (4-6 weeks vs 8-12 weeks)
- Extensible architecture (can add EU later)

**Trade-offs:**
- Smaller initial market (UK importers only)
- Need to rebuild some logic for EU extension
- Risk: UK CBAM may be delayed by government

**Validation:**
- Confirmed with 3 UK importers that UK CBAM is priority
- Competitor analysis shows gap in UK CBAM tools
- Technical feasibility validated

---

### Decision 2: Single-User MVP (No Roles)

**Decision:** Launch with single-user accounts, add roles in Phase 2

**Rationale:**
- Faster MVP (no role logic, no invite system)
- Most early customers are solo founders or small teams
- Can share login for MVP (not ideal but acceptable)
- Reduces complexity by 30%

**Trade-offs:**
- No team collaboration in MVP
- Security risk (shared logins)
- Need to migrate users to role system later

**Validation:**
- 4 out of 5 beta customers said single-user is acceptable for MVP
- Can add roles in 2-3 weeks post-launch

---

### Decision 3: No Supplier Portal in MVP

**Decision:** Defer supplier portal to Phase 2

**Rationale:**
- MVP users can manually enter supplier data
- Supplier portal requires separate auth flow, UI, and email system
- Adds 3-4 weeks to MVP timeline
- Not blocking for initial UK CBAM tracking

**Trade-offs:**
- Manual data entry burden for users
- No automated supplier data collection
- Competitive disadvantage vs full-featured tools

**Validation:**
- Beta customers confirmed they can manually enter data for MVP
- Supplier portal is "nice to have" not "must have" for launch

---

### Decision 4: GBP Currency Only (No Multi-Currency)

**Decision:** UK CBAM uses GBP only, no currency conversion

**Rationale:**
- UK CBAM is paid in GBP to HMRC
- Simplifies financial calculations
- No need for exchange rate API
- Can add multi-currency in EU CBAM phase

**Trade-offs:**
- Users with multi-currency accounting need manual conversion
- Less flexible for international users

**Validation:**
- UK CBAM regulation specifies GBP
- All UK importers have GBP accounting

---

## CONCLUSION

This Master Plan focuses on delivering a UK CBAM MVP that:
1. **Solves a real problem** — UK importers need to calculate CBAM liability
2. **Is technically feasible** — Simpler formula, existing infrastructure
3. **Has market differentiation** — Competitors don't have UK CBAM
4. **Is extensible** — Can add EU CBAM, multi-user, supplier portal later

**Next Steps:**
1. Validate UK CBAM formula with HMRC examples
2. Implement UK CBAM calculator service
3. Add UK-specific fields to database
4. Build UK CBAM calculator page
5. Integrate UK ETS price API
6. Test with beta customers
7. Launch UK CBAM MVP

**Timeline:** 4-6 weeks to MVP launch
**Team:** Aarchi (product + UK CBAM logic), Kunal (infrastructure + testing)
**Success Metric:** 5 paying customers using UK CBAM features within 8 weeks of launch
