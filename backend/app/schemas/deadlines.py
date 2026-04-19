import uuid
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


class DeadlineCreate(BaseModel):
    """Schema for creating a new compliance deadline."""
    deadline_type: str
    due_date: date
    notes: Optional[str] = None

    @field_validator('deadline_type')
    @classmethod
    def validate_deadline_type(cls, v: str) -> str:
        """Validate deadline_type is a valid UK CBAM deadline type."""
        valid_types = [
            "uk_cbam_registration",
            "uk_cbam_q1_declaration",
            "uk_cbam_q2_declaration",
            "uk_cbam_q3_declaration",
            "uk_cbam_q4_declaration",
        ]
        # Allow any type that starts with uk_cbam_ for flexibility
        if not v.startswith("uk_cbam_"):
            raise ValueError(f"deadline_type must start with 'uk_cbam_', got: {v}")
        return v


class DeadlineUpdate(BaseModel):
    """Schema for updating a compliance deadline."""
    due_date: Optional[date] = None
    status: Optional[str] = None
    notes: Optional[str] = None

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        """Validate status is one of the allowed values."""
        if v is None:
            return v
        valid_statuses = ["upcoming", "at_risk", "overdue", "complete"]
        if v not in valid_statuses:
            raise ValueError(f"status must be one of {valid_statuses}, got: {v}")
        return v


class DeadlineResponse(BaseModel):
    """Schema for compliance deadline response."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    org_id: uuid.UUID
    deadline_type: str
    due_date: date
    status: str
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime


class DeadlineWithDaysRemaining(DeadlineResponse):
    """Extended deadline response with calculated days remaining."""
    days_remaining: int
