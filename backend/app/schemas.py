import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


# ── Auth ──────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: str


# ── Organization ──────────────────────────────────────────────────

class OrganizationCreate(BaseModel):
    name: str
    industry: Optional[str] = None
    country: Optional[str] = None
    reporting_year: Optional[int] = None
    reduction_target_pct: Optional[float] = None
    base_year: Optional[int] = None
    base_year_emissions_tco2e: Optional[float] = None
    revenue_gbp_m: Optional[float] = None
    onboarding_complete: Optional[bool] = False

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    reporting_year: Optional[int] = None
    reduction_target_pct: Optional[float] = None
    base_year: Optional[int] = None
    base_year_emissions_tco2e: Optional[float] = None
    revenue_gbp_m: Optional[float] = None
    onboarding_complete: Optional[bool] = None

class OrganizationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    industry: Optional[str] = None
    country: Optional[str] = None
    reporting_year: Optional[int] = None
    reduction_target_pct: Optional[float] = None
    base_year: Optional[int] = None
    base_year_emissions_tco2e: Optional[float] = None
    revenue_gbp_m: Optional[float] = None
    onboarding_complete: bool = False
    created_date: datetime

    class Config:
        from_attributes = True


# ── EmissionActivity ──────────────────────────────────────────────

class EmissionActivityCreate(BaseModel):
    activity_name: str
    scope: str
    category: Optional[str] = None
    source: Optional[str] = None
    quantity: float
    unit: str
    emission_factor: Optional[float] = None
    co2e_kg: Optional[float] = None
    activity_date: Optional[date] = None
    reporting_period: Optional[str] = None

class EmissionActivityUpdate(BaseModel):
    activity_name: Optional[str] = None
    scope: Optional[str] = None
    category: Optional[str] = None
    source: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    emission_factor: Optional[float] = None
    co2e_kg: Optional[float] = None
    activity_date: Optional[date] = None
    reporting_period: Optional[str] = None

class EmissionActivityResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    activity_name: str
    scope: str
    category: Optional[str] = None
    source: Optional[str] = None
    quantity: float
    unit: str
    emission_factor: Optional[float] = None
    co2e_kg: Optional[float] = None
    activity_date: Optional[date] = None
    reporting_period: Optional[str] = None
    created_date: datetime

    class Config:
        from_attributes = True


# ── EmissionFactor ────────────────────────────────────────────────

class EmissionFactorResponse(BaseModel):
    id: uuid.UUID
    scope: str
    category: str
    source: str
    unit: str
    factor: float
    source_dataset: str
    created_date: datetime

    class Config:
        from_attributes = True


# ── CBAMImport ────────────────────────────────────────────────────

class CBAMImportCreate(BaseModel):
    product_name: str
    hscn_code: str
    category: str
    origin_country: str
    quantity_tonnes: float
    emission_factor: Optional[float] = None
    embedded_emissions: Optional[float] = None
    carbon_price_eur: Optional[float] = None
    cbam_charge_eur: Optional[float] = None
    import_date: Optional[date] = None
    quarter: Optional[str] = None
    declaration_status: Optional[str] = "pending"
    supplier_name: Optional[str] = None
    notes: Optional[str] = None

class CBAMImportUpdate(BaseModel):
    product_name: Optional[str] = None
    hscn_code: Optional[str] = None
    category: Optional[str] = None
    origin_country: Optional[str] = None
    quantity_tonnes: Optional[float] = None
    emission_factor: Optional[float] = None
    embedded_emissions: Optional[float] = None
    carbon_price_eur: Optional[float] = None
    cbam_charge_eur: Optional[float] = None
    import_date: Optional[date] = None
    quarter: Optional[str] = None
    declaration_status: Optional[str] = None
    supplier_name: Optional[str] = None
    notes: Optional[str] = None

class CBAMImportResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    product_name: str
    hscn_code: str
    category: str
    origin_country: str
    quantity_tonnes: float
    emission_factor: Optional[float] = None
    embedded_emissions: Optional[float] = None
    carbon_price_eur: Optional[float] = None
    cbam_charge_eur: Optional[float] = None
    import_date: Optional[date] = None
    quarter: Optional[str] = None
    declaration_status: str = "pending"
    supplier_name: Optional[str] = None
    notes: Optional[str] = None
    created_date: datetime

    class Config:
        from_attributes = True


# ── Report ────────────────────────────────────────────────────────

class ReportCreate(BaseModel):
    title: str
    type: str
    period: str
    status: Optional[str] = "draft"
    total_emissions_tco2e: Optional[float] = None
    total_cbam_charge_eur: Optional[float] = None
    notes: Optional[str] = None

class ReportUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    period: Optional[str] = None
    status: Optional[str] = None
    total_emissions_tco2e: Optional[float] = None
    total_cbam_charge_eur: Optional[float] = None
    notes: Optional[str] = None

class ReportResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    type: str
    period: str
    status: str = "draft"
    total_emissions_tco2e: Optional[float] = None
    total_cbam_charge_eur: Optional[float] = None
    notes: Optional[str] = None
    created_date: datetime

    class Config:
        from_attributes = True


# ── LLM Integration ──────────────────────────────────────────────

class LLMInvokeRequest(BaseModel):
    prompt: str
    response_json_schema: Optional[dict] = None
