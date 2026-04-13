import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict


# ─── Organisation ────────────────────────────────────────────────────

class OrganisationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    created_at: datetime


# ─── UK CBAM Products (reference data) ──────────────────────────────

class UKCBAMProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    commodity_code: str
    description: str
    sector: str
    product_type: str
    default_intensity: Decimal
    valid_from: date
    valid_to: Optional[date] = None
    includes_indirect: bool = False
    notes: Optional[str] = None


# ─── UK ETS Prices ──────────────────────────────────────────────────

class UKETSPriceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    quarter: str
    price_gbp: Decimal
    source: Optional[str] = None
    fetched_at: datetime


class UKETSPriceCurrentResponse(BaseModel):
    """Simplified response for GET /api/ets-price/current."""
    quarter: str
    price_gbp: Decimal
    source: Optional[str] = None
    currency: str = "GBP"


# ─── Suppliers ──────────────────────────────────────────────────────

class SupplierBase(BaseModel):
    name: str
    country: Optional[str] = None
    contact_email: Optional[str] = None
    installation_id: Optional[str] = None
    notes: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    contact_email: Optional[str] = None
    installation_id: Optional[str] = None
    data_status: Optional[str] = None
    notes: Optional[str] = None


class SupplierResponse(SupplierBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    org_id: uuid.UUID
    data_status: str = "not_requested"
    last_request_sent: Optional[datetime] = None
    last_data_received: Optional[datetime] = None
    created_at: datetime


# ─── Imports ────────────────────────────────────────────────────────

class ImportCreate(BaseModel):
    product_id: uuid.UUID
    supplier_id: Optional[uuid.UUID] = None
    import_date: date
    import_value_gbp: Decimal
    quantity_tonnes: Decimal
    country_of_origin: str
    import_type: str = "standard"  # standard | outward_processing | returned_goods
    data_source: str = "default"   # default | actual_unverified | actual_verified
    emissions_intensity_actual: Optional[Decimal] = None
    verifier_name: Optional[str] = None
    verification_date: Optional[date] = None
    carbon_price_deduction_gbp: Decimal = Decimal("0")
    deduction_evidence_note: Optional[str] = None


class ImportUpdate(BaseModel):
    supplier_id: Optional[uuid.UUID] = None
    import_date: Optional[date] = None
    import_value_gbp: Optional[Decimal] = None
    quantity_tonnes: Optional[Decimal] = None
    country_of_origin: Optional[str] = None
    import_type: Optional[str] = None
    data_source: Optional[str] = None
    emissions_intensity_actual: Optional[Decimal] = None
    verifier_name: Optional[str] = None
    verification_date: Optional[date] = None
    carbon_price_deduction_gbp: Optional[Decimal] = None
    deduction_evidence_note: Optional[str] = None


class ImportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    org_id: uuid.UUID
    supplier_id: Optional[uuid.UUID] = None
    product_id: uuid.UUID
    import_date: date
    import_value_gbp: Decimal
    quantity_tonnes: Decimal
    country_of_origin: str
    import_type: str

    # Emissions
    data_source: str
    emissions_intensity_actual: Optional[Decimal] = None
    emissions_intensity_default: Decimal
    verifier_name: Optional[str] = None
    verification_date: Optional[date] = None

    # Carbon price deduction
    carbon_price_deduction_gbp: Decimal = Decimal("0")
    deduction_evidence_note: Optional[str] = None

    # Formula outputs
    uk_ets_rate_used: Optional[Decimal] = None
    embedded_emissions_tco2e: Optional[Decimal] = None
    cbam_liability_gbp: Optional[Decimal] = None
    cbam_liability_default_gbp: Optional[Decimal] = None
    potential_saving_gbp: Optional[Decimal] = None

    # Special rules
    is_threshold_exempt: bool = False
    exemption_reason: Optional[str] = None

    # Audit
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime


# ─── Audit Log ──────────────────────────────────────────────────────

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    org_id: Optional[uuid.UUID] = None
    user_id: Optional[uuid.UUID] = None
    entity_type: str
    entity_id: Optional[uuid.UUID] = None
    action: str
    old_data: Optional[Any] = None
    new_data: Optional[Any] = None
    ip_address: Optional[str] = None
    created_at: datetime


# ─── CBAM Reports ───────────────────────────────────────────────────

class CBAMReportCreate(BaseModel):
    report_type: str  # annual | quarterly
    period_start: date
    period_end: date


class CBAMReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    org_id: uuid.UUID
    report_type: Optional[str] = None
    period_start: date
    period_end: date
    status: str = "draft"
    total_liability: Optional[Decimal] = None
    generated_by: Optional[uuid.UUID] = None
    generated_at: datetime
    file_path: Optional[str] = None


# ─── Threshold ──────────────────────────────────────────────────────

class ThresholdStatusResponse(BaseModel):
    total_gbp: Decimal
    threshold_gbp: Decimal = Decimal("50000")
    percentage: float
    status: str  # below | warning | exceeded
    imports_in_window: int
