import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Date, ForeignKey, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.config.database import Base


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
