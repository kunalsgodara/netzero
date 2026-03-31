import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.config.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)
    period = Column(String, nullable=False)
    status = Column(String, default="draft")
    total_emissions_tco2e = Column(Float, nullable=True)
    total_cbam_charge_eur = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        CheckConstraint(
            "type IN ('secr','cbam_declaration','executive_summary')",
            name="check_report_type"
        ),
        CheckConstraint(
            "status IN ('draft','generated','submitted','approved')",
            name="check_report_status"
        ),
    )

    user = relationship("User", back_populates="reports")
