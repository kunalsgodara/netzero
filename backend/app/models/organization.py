import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.config.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    industry = Column(String, nullable=True)
    country = Column(String, nullable=True)
    reporting_year = Column(Integer, nullable=True)
    reduction_target_pct = Column(Float, nullable=True)
    base_year = Column(Integer, nullable=True)
    base_year_emissions_tco2e = Column(Float, nullable=True)
    revenue_gbp_m = Column(Float, nullable=True)
    onboarding_complete = Column(Boolean, default=False)
    created_date = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        CheckConstraint(
            "industry IN ('manufacturing','construction','energy','chemicals','metals','logistics','other') OR industry IS NULL",
            name="check_industry"
        ),
    )

    user = relationship("User", back_populates="organisations_owned")
