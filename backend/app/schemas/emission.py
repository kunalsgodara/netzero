import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


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
