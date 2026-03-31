import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


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
