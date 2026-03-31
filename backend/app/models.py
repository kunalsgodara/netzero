import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Date, ForeignKey, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=True)  # null if Google OAuth only
    google_id = Column(String, unique=True, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    organizations = relationship("Organization", back_populates="user", cascade="all, delete-orphan")
    emission_activities = relationship("EmissionActivity", back_populates="user", cascade="all, delete-orphan")
    cbam_imports = relationship("CBAMImport", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")


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

    user = relationship("User", back_populates="organizations")


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
    """Stores the standard UK DEFRA conversion factors for dynamic access."""
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


class CBAMImport(Base):
    __tablename__ = "cbam_imports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_name = Column(String, nullable=False)
    hscn_code = Column(String, nullable=False)
    category = Column(String, nullable=False)
    origin_country = Column(String, nullable=False)
    quantity_tonnes = Column(Float, nullable=False)
    emission_factor = Column(Float, nullable=True)
    embedded_emissions = Column(Float, nullable=True)
    carbon_price_eur = Column(Float, nullable=True)
    cbam_charge_eur = Column(Float, nullable=True)
    import_date = Column(Date, nullable=True)
    quarter = Column(String, nullable=True)
    declaration_status = Column(String, default="pending")
    supplier_name = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        CheckConstraint(
            "category IN ('cement','iron_steel','aluminum','fertilizers','electricity','hydrogen')",
            name="check_cbam_category"
        ),
        CheckConstraint(
            "declaration_status IN ('pending','declared','verified')",
            name="check_declaration_status"
        ),
        CheckConstraint(
            "quarter IN ('Q1','Q2','Q3','Q4') OR quarter IS NULL",
            name="check_quarter"
        ),
    )

    user = relationship("User", back_populates="cbam_imports")


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
