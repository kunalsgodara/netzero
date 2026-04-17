import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Boolean, DateTime, Date, Text,
    ForeignKey, Numeric, Index,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.config.database import Base


class Organisation(Base):
    __tablename__ = "organisations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    
    users = relationship("User", back_populates="organisation", cascade="all, delete-orphan")
    suppliers = relationship("Supplier", back_populates="organisation", cascade="all, delete-orphan")
    imports = relationship("Import", back_populates="organisation", cascade="all, delete-orphan")
    deadlines = relationship("ComplianceDeadline", back_populates="organisation", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="organisation")
    cbam_reports = relationship("CBAMReport", back_populates="organisation", cascade="all, delete-orphan")


class UKCBAMProduct(Base):
    """Reference / seed data — UK tariff commodity codes with HMRC default emission intensities."""
    __tablename__ = "uk_cbam_products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    commodity_code = Column(String(20), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=False)
    sector = Column(String(50), nullable=False)  
    product_type = Column(String(20), nullable=False)  
    default_intensity = Column(Numeric(10, 4), nullable=False)  
    valid_from = Column(Date, nullable=False)
    valid_to = Column(Date, nullable=True)  
    includes_indirect = Column(Boolean, default=False)  
    notes = Column(Text, nullable=True)

    
    imports = relationship("Import", back_populates="product")


class UKETSPrice(Base):
    """Live price feed cache — UK ETS quarterly average prices in GBP."""
    __tablename__ = "uk_ets_prices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quarter = Column(String(10), nullable=False)  
    price_gbp = Column(Numeric(8, 2), nullable=False)  
    source = Column(Text, nullable=True)
    fetched_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    country = Column(String(100), nullable=True)
    contact_email = Column(String(255), nullable=True)
    installation_id = Column(String(100), nullable=True)  
    data_status = Column(String(30), default="not_requested")
    
    last_request_sent = Column(DateTime(timezone=True), nullable=True)
    last_data_received = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    
    organisation = relationship("Organisation", back_populates="suppliers")
    imports = relationship("Import", back_populates="supplier")

    __table_args__ = (
        Index("idx_suppliers_org", "org_id"),
    )


class Import(Base):
    """Core transaction table — one row per CBAM import with full formula outputs."""
    __tablename__ = "imports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("uk_cbam_products.id"), nullable=False)
    import_date = Column(Date, nullable=False)
    import_value_gbp = Column(Numeric(14, 2), nullable=False)  
    quantity_tonnes = Column(Numeric(12, 4), nullable=False)
    country_of_origin = Column(String(100), nullable=False)
    import_type = Column(String(30), default="standard")
    

    
    data_source = Column(String(30), nullable=False, default="default")
    
    emissions_intensity_actual = Column(Numeric(10, 4), nullable=True)  
    emissions_intensity_default = Column(Numeric(10, 4), nullable=False)  
    verifier_name = Column(String(255), nullable=True)
    verification_date = Column(Date, nullable=True)

    
    carbon_price_deduction_gbp = Column(Numeric(10, 2), default=0)
    deduction_evidence_note = Column(Text, nullable=True)

    
    uk_ets_rate_used = Column(Numeric(8, 2), nullable=True)  
    embedded_emissions_tco2e = Column(Numeric(12, 4), nullable=True)
    cbam_liability_gbp = Column(Numeric(14, 2), nullable=True)
    cbam_liability_default_gbp = Column(Numeric(14, 2), nullable=True)  
    potential_saving_gbp = Column(Numeric(14, 2), nullable=True)  

    
    is_threshold_exempt = Column(Boolean, default=False)
    exemption_reason = Column(Text, nullable=True)

    # Installation-level fields (UK CBAM requirement)
    installation_name = Column(String(255), nullable=True)
    installation_id = Column(String(100), nullable=True)
    production_route = Column(String(50), nullable=True)
    # production_route values: "BF-BOF", "EAF-scrap", "DRI", "Smelting-electrolysis", "Other"

    
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    
    is_deleted = Column(Boolean, default=False)

    
    organisation = relationship("Organisation", back_populates="imports")
    supplier = relationship("Supplier", back_populates="imports")
    product = relationship("UKCBAMProduct", back_populates="imports")
    creator = relationship("User", back_populates="created_imports", foreign_keys=[created_by])

    __table_args__ = (
        Index("idx_imports_org_date", "org_id", "import_date"),
        Index("idx_imports_supplier", "supplier_id"),
    )


class ComplianceDeadline(Base):
    """UK CBAM compliance deadlines tracking."""
    __tablename__ = "compliance_deadlines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False)
    deadline_type = Column(String(50), nullable=False)
    # Types: "uk_cbam_registration", "uk_cbam_q1_declaration", etc.
    due_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False, default="upcoming")
    # Status: "upcoming", "at_risk", "overdue", "complete"
    completed_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    organisation = relationship("Organisation", back_populates="deadlines")

    __table_args__ = (
        Index("idx_deadlines_org_date", "org_id", "due_date"),
    )


class AuditLog(Base):
    """Immutable event log — never update or delete rows."""
    __tablename__ = "audit_log"
    """Immutable event log — never update or delete rows."""
    __tablename__ = "audit_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    entity_type = Column(String(50), nullable=False)  
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    action = Column(String(50), nullable=False)  
    old_data = Column(JSONB, nullable=True)
    new_data = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    
    organisation = relationship("Organisation", back_populates="audit_logs")
    user = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index("idx_audit_entity", "entity_type", "entity_id"),
    )


class CBAMReport(Base):
    __tablename__ = "cbam_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=False)
    report_type = Column(String(20), nullable=True)  
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    status = Column(String(20), default="draft")  
    total_liability = Column(Numeric(14, 2), nullable=True)
    generated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    generated_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    file_path = Column(Text, nullable=True)  

    
    organisation = relationship("Organisation", back_populates="cbam_reports")
    generator = relationship("User", back_populates="generated_reports", foreign_keys=[generated_by])
