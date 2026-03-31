import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


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
