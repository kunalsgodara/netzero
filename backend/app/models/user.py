import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.config.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="SET NULL"), nullable=True)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=True)
    google_id = Column(String, unique=True, nullable=True)
    role = Column(String(50), default="member")  # admin | member | viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Existing relationships (SECR features)
    organisations_owned = relationship("Organization", back_populates="user", cascade="all, delete-orphan")
    emission_activities = relationship("EmissionActivity", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")

    # UK CBAM relationships
    organisation = relationship("Organisation", back_populates="users", foreign_keys=[org_id])
    created_imports = relationship("Import", back_populates="creator", foreign_keys="Import.created_by")
    audit_logs = relationship("AuditLog", back_populates="user")
    generated_reports = relationship("CBAMReport", back_populates="generator", foreign_keys="CBAMReport.generated_by")
