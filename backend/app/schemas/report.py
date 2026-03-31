import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


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
