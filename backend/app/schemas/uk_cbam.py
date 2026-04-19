import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, field_validator
import re




class OrganisationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    created_at: datetime




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




class ImportCreate(BaseModel):
    product_id: uuid.UUID
    supplier_id: Optional[uuid.UUID] = None
    import_date: date
    import_value_gbp: Decimal
    quantity_tonnes: Decimal
    country_of_origin: str
    import_type: str = "standard"  
    data_source: str = "default"   
    emissions_intensity_actual: Optional[Decimal] = None
    verifier_name: Optional[str] = None
    verification_date: Optional[date] = None
    carbon_price_deduction_gbp: Decimal = Decimal("0")
    deduction_evidence_note: Optional[str] = None
    # Installation fields (optional)
    installation_name: Optional[str] = None
    installation_id: Optional[str] = None
    production_route: Optional[str] = None

    @field_validator('quantity_tonnes', 'import_value_gbp', 'carbon_price_deduction_gbp', 'emissions_intensity_actual')
    @classmethod
    def validate_non_negative(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        """Validate numeric fields are non-negative."""
        if v is not None and v < 0:
            raise ValueError("Value must be non-negative")
        return v

    @field_validator('import_date')
    @classmethod
    def validate_date_not_future(cls, v: date) -> date:
        """Validate import_date is not in the future."""
        if v > date.today():
            raise ValueError("import_date cannot be in the future")
        return v

    @field_validator('installation_name')
    @classmethod
    def validate_installation_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate installation_name length."""
        if v is not None and len(v) > 255:
            raise ValueError("installation_name must be 255 characters or less")
        return v

    @field_validator('installation_id')
    @classmethod
    def validate_installation_id(cls, v: Optional[str]) -> Optional[str]:
        """Validate installation_id is alphanumeric and max 100 chars."""
        if v is not None:
            if len(v) > 100:
                raise ValueError("installation_id must be 100 characters or less")
            if not re.match(r'^[a-zA-Z0-9]+$', v):
                raise ValueError("installation_id must contain only alphanumeric characters")
        return v

    @field_validator('production_route')
    @classmethod
    def validate_production_route(cls, v: Optional[str]) -> Optional[str]:
        """Validate production_route is one of the allowed values."""
        if v is not None:
            valid_routes = ["BF-BOF", "EAF-scrap", "DRI", "Smelting-electrolysis", "Other"]
            if v not in valid_routes:
                raise ValueError(f"production_route must be one of {valid_routes}")
        return v


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
    # Installation fields (optional)
    installation_name: Optional[str] = None
    installation_id: Optional[str] = None
    production_route: Optional[str] = None

    @field_validator('quantity_tonnes', 'import_value_gbp', 'carbon_price_deduction_gbp', 'emissions_intensity_actual')
    @classmethod
    def validate_non_negative(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        """Validate numeric fields are non-negative."""
        if v is not None and v < 0:
            raise ValueError("Value must be non-negative")
        return v

    @field_validator('import_date')
    @classmethod
    def validate_date_not_future(cls, v: Optional[date]) -> Optional[date]:
        """Validate import_date is not in the future."""
        if v is not None and v > date.today():
            raise ValueError("import_date cannot be in the future")
        return v

    @field_validator('installation_name')
    @classmethod
    def validate_installation_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate installation_name length."""
        if v is not None and len(v) > 255:
            raise ValueError("installation_name must be 255 characters or less")
        return v

    @field_validator('installation_id')
    @classmethod
    def validate_installation_id(cls, v: Optional[str]) -> Optional[str]:
        """Validate installation_id is alphanumeric and max 100 chars."""
        if v is not None:
            if len(v) > 100:
                raise ValueError("installation_id must be 100 characters or less")
            if not re.match(r'^[a-zA-Z0-9]+$', v):
                raise ValueError("installation_id must contain only alphanumeric characters")
        return v

    @field_validator('production_route')
    @classmethod
    def validate_production_route(cls, v: Optional[str]) -> Optional[str]:
        """Validate production_route is one of the allowed values."""
        if v is not None:
            valid_routes = ["BF-BOF", "EAF-scrap", "DRI", "Smelting-electrolysis", "Other"]
            if v not in valid_routes:
                raise ValueError(f"production_route must be one of {valid_routes}")
        return v


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

    
    data_source: str
    emissions_intensity_actual: Optional[Decimal] = None
    emissions_intensity_default: Decimal
    verifier_name: Optional[str] = None
    verification_date: Optional[date] = None

    
    carbon_price_deduction_gbp: Decimal = Decimal("0")
    deduction_evidence_note: Optional[str] = None

    
    uk_ets_rate_used: Optional[Decimal] = None
    embedded_emissions_tco2e: Optional[Decimal] = None
    cbam_liability_gbp: Optional[Decimal] = None
    cbam_liability_default_gbp: Optional[Decimal] = None
    potential_saving_gbp: Optional[Decimal] = None

    
    is_threshold_exempt: bool = False
    exemption_reason: Optional[str] = None

    # Installation fields
    installation_name: Optional[str] = None
    installation_id: Optional[str] = None
    production_route: Optional[str] = None

    
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime




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




class CBAMReportCreate(BaseModel):
    report_type: str  
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




class ThresholdStatusResponse(BaseModel):
    total_gbp: Decimal
    threshold_gbp: Decimal = Decimal("50000")
    percentage: float
    status: str  
    imports_in_window: int
