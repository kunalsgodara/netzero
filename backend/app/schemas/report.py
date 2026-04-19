import uuid
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class ReportCreate(BaseModel):
    title: str
    type: str
    period: str
    status: Optional[str] = "draft"
    total_emissions_tco2e: Optional[float] = None
    total_cbam_charge_eur: Optional[float] = None
    notes: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ReportUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    period: Optional[str] = None
    status: Optional[str] = None
    total_emissions_tco2e: Optional[float] = None
    total_cbam_charge_eur: Optional[float] = None
    notes: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


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
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    created_date: datetime

    class Config:
        from_attributes = True


class ReportGenerateRequest(BaseModel):
    title: str
    type: str
    period: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None




class ScopeBreakdown(BaseModel):
    scope: str
    label: str
    emissions_tco2e: float
    description: str


class CategoryBreakdown(BaseModel):
    category: str
    scope: str
    emissions_tco2e: float
    share_pct: float


class ActivityDetail(BaseModel):
    activity_name: str
    scope: str
    source: Optional[str] = None
    quantity: float
    unit: str
    co2e_tco2e: float
    activity_date: Optional[str] = None


class CBAMCategoryBreakdown(BaseModel):
    category: str
    total_qty_tonnes: float
    embedded_emissions_tco2e: float
    cbam_charge_eur: float


class CBAMImportDetail(BaseModel):
    product_name: str
    hscn_code: str
    origin_country: str
    supplier_name: Optional[str] = None
    quantity_tonnes: float
    embedded_emissions: float
    cbam_charge_eur: float
    declaration_status: str


class OrganizationInfo(BaseModel):
    name: str
    industry: Optional[str] = None
    country: Optional[str] = None
    reporting_year: Optional[int] = None
    base_year: Optional[int] = None
    reduction_target_pct: Optional[float] = None


class ReportAggregationResponse(BaseModel):
    """Full aggregation data returned by /preview and /{id}/data endpoints."""
    organization: Optional[OrganizationInfo] = None

    
    total_emissions_tco2e: float = 0.0
    scope_breakdown: List[ScopeBreakdown] = []
    category_breakdown: List[CategoryBreakdown] = []
    activities: List[ActivityDetail] = []
    activity_count: int = 0

    
    total_cbam_charge_eur: float = 0.0
    total_embedded_emissions_tco2e: float = 0.0
    cbam_category_breakdown: List[CBAMCategoryBreakdown] = []
    cbam_imports: List[CBAMImportDetail] = []
    cbam_import_count: int = 0
    pending_declarations: int = 0
