import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Boolean, DateTime, Date, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.config.database import Base


class EmissionActivity(Base):
    __tablename__ = "emission_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    activity_name = Column(String, nullable=False)
    scope = Column(String, nullable=False)
    category = Column(String, nullable=True)
    source = Column(String, nullable=True)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    emission_factor = Column(Float, nullable=True)
    co2e_kg = Column(Float, nullable=True)
    activity_date = Column(Date, nullable=True)
    reporting_period = Column(String, nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        CheckConstraint("scope IN ('scope_1','scope_2','scope_3')", name="check_scope"),
    )

    user = relationship("User", back_populates="emission_activities")


class EmissionFactor(Base):
    __tablename__ = "emission_factors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scope = Column(String, nullable=False)
    category = Column(String, nullable=False)
    source = Column(String, nullable=False)
    unit = Column(String, nullable=False)
    factor = Column(Float, nullable=False)
    source_dataset = Column(String, default="DEFRA 2024")
    created_date = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
