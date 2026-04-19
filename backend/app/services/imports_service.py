"""
Imports service — orchestrates CRUD, calculation, and audit logging for UK CBAM imports.
"""

import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_, func
from sqlalchemy.orm import joinedload
from fastapi import HTTPException

from app.models.uk_cbam import Import, UKCBAMProduct, UKETSPrice, AuditLog
from app.models.user import User
from app.services.calculator import calculate_cbam_liability
from app.schemas.uk_cbam import ImportCreate, ImportUpdate


def _import_to_dict(imp: Import) -> dict:
    """Serialize an Import to a JSON-safe dict for audit logging."""
    return {
        "id": str(imp.id),
        "product_id": str(imp.product_id),
        "supplier_id": str(imp.supplier_id) if imp.supplier_id else None,
        "import_date": str(imp.import_date),
        "import_value_gbp": str(imp.import_value_gbp),
        "quantity_tonnes": str(imp.quantity_tonnes),
        "country_of_origin": imp.country_of_origin,
        "import_type": imp.import_type,
        "data_source": imp.data_source,
        "emissions_intensity_actual": str(imp.emissions_intensity_actual) if imp.emissions_intensity_actual else None,
        "emissions_intensity_default": str(imp.emissions_intensity_default),
        "carbon_price_deduction_gbp": str(imp.carbon_price_deduction_gbp),
        "uk_ets_rate_used": str(imp.uk_ets_rate_used) if imp.uk_ets_rate_used else None,
        "embedded_emissions_tco2e": str(imp.embedded_emissions_tco2e) if imp.embedded_emissions_tco2e else None,
        "cbam_liability_gbp": str(imp.cbam_liability_gbp) if imp.cbam_liability_gbp else None,
        "cbam_liability_default_gbp": str(imp.cbam_liability_default_gbp) if imp.cbam_liability_default_gbp else None,
        "potential_saving_gbp": str(imp.potential_saving_gbp) if imp.potential_saving_gbp else None,
        "is_threshold_exempt": imp.is_threshold_exempt,
        "verifier_name": imp.verifier_name,
    }


async def _write_audit(
    db: AsyncSession,
    org_id: UUID,
    user_id: UUID,
    entity_id: UUID,
    action: str,
    old_data: Optional[dict] = None,
    new_data: Optional[dict] = None,
):
    """Write an immutable audit_log entry."""
    entry = AuditLog(
        org_id=org_id,
        user_id=user_id,
        entity_type="import",
        entity_id=entity_id,
        action=action,
        old_data=old_data,
        new_data=new_data,
    )
    db.add(entry)


async def _get_product(product_id: UUID, db: AsyncSession) -> UKCBAMProduct:
    result = await db.execute(select(UKCBAMProduct).where(UKCBAMProduct.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=400, detail="Invalid product_id — product not found")
    return product


async def _get_current_ets_rate(db: AsyncSession) -> Decimal:
    result = await db.execute(select(UKETSPrice).order_by(desc(UKETSPrice.fetched_at)).limit(1))
    price = result.scalar_one_or_none()
    if not price:
        raise HTTPException(status_code=500, detail="No UK ETS price data available — contact admin")
    return Decimal(str(price.price_gbp))


async def _run_calculation(data: ImportCreate, product: UKCBAMProduct, ets_rate: Decimal):
    """Execute the Section 4.3 calculation formula."""
    return calculate_cbam_liability(
        quantity_tonnes=data.quantity_tonnes,
        data_source=data.data_source,
        import_type=data.import_type,
        emissions_intensity_default=Decimal(str(product.default_intensity)),
        emissions_intensity_actual=data.emissions_intensity_actual,
        carbon_price_deduction_gbp=data.carbon_price_deduction_gbp,
        uk_ets_rate=ets_rate,
    )





async def create_import(data: ImportCreate, user: User, db: AsyncSession) -> Import:
    """POST /api/imports — create + auto-calculate liability."""
    if not user.org_id:
        raise HTTPException(status_code=403, detail="You must be assigned to an organisation to create imports")

    
    if data.import_type not in ("standard", "outward_processing", "returned_goods"):
        raise HTTPException(status_code=400, detail="import_type must be: standard, outward_processing, or returned_goods")

    
    if data.data_source not in ("default", "actual_unverified", "actual_verified"):
        raise HTTPException(status_code=400, detail="data_source must be: default, actual_unverified, or actual_verified")

    
    if data.data_source in ("actual_unverified", "actual_verified") and data.emissions_intensity_actual is None:
        raise HTTPException(status_code=400, detail="emissions_intensity_actual is required when data_source is actual")

    
    product = await _get_product(data.product_id, db)

    
    valid_sectors = {"aluminium", "cement", "fertiliser", "hydrogen", "steel"}
    if product.sector not in valid_sectors:
        raise HTTPException(status_code=400, detail=f"Sector '{product.sector}' is not in-scope for UK CBAM")

    
    ets_rate = await _get_current_ets_rate(db)

    
    calc = await _run_calculation(data, product, ets_rate)

    
    imp = Import(
        org_id=user.org_id,
        supplier_id=data.supplier_id,
        product_id=data.product_id,
        import_date=data.import_date,
        import_value_gbp=data.import_value_gbp,
        quantity_tonnes=data.quantity_tonnes,
        country_of_origin=data.country_of_origin,
        import_type=data.import_type,
        data_source=data.data_source,
        emissions_intensity_actual=data.emissions_intensity_actual,
        emissions_intensity_default=calc.emissions_intensity_default,
        verifier_name=data.verifier_name,
        verification_date=data.verification_date,
        carbon_price_deduction_gbp=data.carbon_price_deduction_gbp,
        deduction_evidence_note=data.deduction_evidence_note,
        
        uk_ets_rate_used=calc.uk_ets_rate_used,
        embedded_emissions_tco2e=calc.embedded_emissions_tco2e,
        cbam_liability_gbp=calc.cbam_liability_gbp,
        cbam_liability_default_gbp=calc.cbam_liability_default_gbp,
        potential_saving_gbp=calc.potential_saving_gbp,
        is_threshold_exempt=calc.is_threshold_exempt,
        exemption_reason=calc.exemption_reason,
        
        created_by=user.id,
    )
    db.add(imp)
    await db.flush()

    
    await _write_audit(db, user.org_id, user.id, imp.id, "created", new_data=_import_to_dict(imp))

    return imp


async def list_imports(
    org_id: UUID,
    db: AsyncSession,
    year: Optional[int] = None,
    sector: Optional[str] = None,
    supplier_id: Optional[UUID] = None,
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[Import], int]:
    """GET /api/imports — paginated, filterable, org-scoped."""
    base = (
        select(Import)
        .where(Import.org_id == org_id, Import.is_deleted == False)  
        .options(joinedload(Import.product), joinedload(Import.supplier))
    )

    if year:
        base = base.where(
            and_(
                Import.import_date >= date(year, 1, 1),
                Import.import_date <= date(year, 12, 31),
            )
        )
    if sector:
        base = base.join(UKCBAMProduct).where(UKCBAMProduct.sector == sector)
    if supplier_id:
        base = base.where(Import.supplier_id == supplier_id)

    
    count_q = select(func.count()).select_from(base.subquery())
    total_result = await db.execute(count_q)
    total = total_result.scalar()

    
    offset = (page - 1) * page_size
    result = await db.execute(
        base.order_by(desc(Import.import_date)).offset(offset).limit(page_size)
    )
    imports = result.scalars().unique().all()

    return imports, total


async def get_import(import_id: UUID, org_id: UUID, db: AsyncSession) -> Import:
    """GET /api/imports/{id} — single import, org-scoped."""
    result = await db.execute(
        select(Import)
        .where(Import.id == import_id, Import.org_id == org_id, Import.is_deleted == False)  
        .options(joinedload(Import.product), joinedload(Import.supplier))
    )
    imp = result.scalar_one_or_none()
    if not imp:
        raise HTTPException(status_code=404, detail="Import not found")
    return imp


async def update_import(
    import_id: UUID, data: ImportUpdate, user: User, db: AsyncSession
) -> Import:
    """PUT /api/imports/{id} — update + recalculate."""
    if not user.org_id:
        raise HTTPException(status_code=403, detail="Organisation required")

    imp = await get_import(import_id, user.org_id, db)
    old_data = _import_to_dict(imp)

    
    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(imp, field, value)

    
    product = await _get_product(imp.product_id, db)
    ets_rate = await _get_current_ets_rate(db)

    
    calc = calculate_cbam_liability(
        quantity_tonnes=Decimal(str(imp.quantity_tonnes)),
        data_source=imp.data_source,
        import_type=imp.import_type,
        emissions_intensity_default=Decimal(str(product.default_intensity)),
        emissions_intensity_actual=Decimal(str(imp.emissions_intensity_actual)) if imp.emissions_intensity_actual else None,
        carbon_price_deduction_gbp=Decimal(str(imp.carbon_price_deduction_gbp or 0)),
        uk_ets_rate=ets_rate,
    )

    
    imp.emissions_intensity_default = calc.emissions_intensity_default
    imp.uk_ets_rate_used = calc.uk_ets_rate_used
    imp.embedded_emissions_tco2e = calc.embedded_emissions_tco2e
    imp.cbam_liability_gbp = calc.cbam_liability_gbp
    imp.cbam_liability_default_gbp = calc.cbam_liability_default_gbp
    imp.potential_saving_gbp = calc.potential_saving_gbp
    imp.is_threshold_exempt = calc.is_threshold_exempt
    imp.exemption_reason = calc.exemption_reason
    imp.updated_at = datetime.utcnow()

    await _write_audit(db, user.org_id, user.id, imp.id, "updated",
                       old_data=old_data, new_data=_import_to_dict(imp))

    return imp


async def soft_delete_import(import_id: UUID, user: User, db: AsyncSession) -> None:
    """DELETE /api/imports/{id} — soft delete + audit."""
    if not user.org_id:
        raise HTTPException(status_code=403, detail="Organisation required")

    imp = await get_import(import_id, user.org_id, db)
    old_data = _import_to_dict(imp)

    imp.is_deleted = True
    imp.updated_at = datetime.utcnow()

    await _write_audit(db, user.org_id, user.id, imp.id, "deleted", old_data=old_data)


async def get_import_audit(import_id: UUID, org_id: UUID, db: AsyncSession) -> list[AuditLog]:
    """GET /api/imports/{id}/audit — full audit trail."""
    result = await db.execute(
        select(AuditLog)
        .where(
            AuditLog.entity_type == "import",
            AuditLog.entity_id == import_id,
            AuditLog.org_id == org_id,
        )
        .order_by(desc(AuditLog.created_at))
    )
    return result.scalars().all()





async def get_threshold_status(org_id: UUID, db: AsyncSession) -> dict:
    """
    GET /api/threshold/status — rolling 12-month import value tracker.

    Hard Rule #5: threshold is based on import_value_gbp (not liability).
    Status: "below" | "warning" (>= 80%) | "exceeded" (>= 100%)
    """
    twelve_months_ago = date.today() - timedelta(days=365)
    threshold_gbp = Decimal("50000")

    result = await db.execute(
        select(
            func.coalesce(func.sum(Import.import_value_gbp), 0),
            func.count(Import.id),
        )
        .where(
            Import.org_id == org_id,
            Import.is_deleted == False,  
            Import.import_date >= twelve_months_ago,
        )
    )
    row = result.one()
    total_gbp = Decimal(str(row[0]))
    imports_count = row[1]

    percentage = float((total_gbp / threshold_gbp) * 100) if threshold_gbp > 0 else 0.0

    if percentage >= 100:
        status = "exceeded"
    elif percentage >= 80:
        status = "warning"
    else:
        status = "below"

    return {
        "total_gbp": total_gbp,
        "threshold_gbp": threshold_gbp,
        "percentage": round(percentage, 1),
        "status": status,
        "imports_in_window": imports_count,
    }
