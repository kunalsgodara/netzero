"""
UK CBAM Imports Controller — Section 4.3 + 4.4 endpoints.

All routes require JWT Bearer token. Org isolation enforced via org_id from the current user.
"""

from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.uk_cbam import (
    ImportCreate, ImportUpdate, ImportResponse,
    AuditLogResponse, ThresholdStatusResponse,
)
from app.services.imports_service import (
    create_import,
    list_imports,
    get_import,
    update_import,
    soft_delete_import,
    get_import_audit,
    get_threshold_status,
)

router = APIRouter(prefix="/api/imports", tags=["imports"])
threshold_router = APIRouter(prefix="/api/threshold", tags=["threshold"])


# ── Imports CRUD ────────────────────────────────────────────────────


@router.post("", response_model=ImportResponse, status_code=201)
async def create(
    data: ImportCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """POST /api/imports — Create import + auto-calculate UK CBAM liability."""
    imp = await create_import(data, user, db)
    await db.commit()
    await db.refresh(imp, attribute_names=["product", "supplier"])
    return imp


@router.get("", response_model=dict)
async def list_all(
    year: Optional[int] = Query(None, description="Filter by year (e.g. 2027)"),
    sector: Optional[str] = Query(None, description="Filter by sector (e.g. steel)"),
    supplier_id: Optional[UUID] = Query(None, description="Filter by supplier UUID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """GET /api/imports — List imports (paginated, filterable, org-scoped)."""
    if not user.org_id:
        return {"items": [], "total": 0, "page": page, "page_size": page_size}

    imports, total = await list_imports(
        org_id=user.org_id, db=db,
        year=year, sector=sector, supplier_id=supplier_id,
        page=page, page_size=page_size,
    )

    return {
        "items": [ImportResponse.model_validate(imp) for imp in imports],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{import_id}", response_model=ImportResponse)
async def get_one(
    import_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """GET /api/imports/{id} — Single import detail with formula outputs."""
    if not user.org_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Organisation required")
    return await get_import(import_id, user.org_id, db)


@router.put("/{import_id}", response_model=ImportResponse)
async def update(
    import_id: UUID,
    data: ImportUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """PUT /api/imports/{id} — Update import + trigger recalculation."""
    imp = await update_import(import_id, data, user, db)
    await db.commit()
    await db.refresh(imp, attribute_names=["product", "supplier"])
    return imp


@router.delete("/{import_id}", status_code=204)
async def delete(
    import_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """DELETE /api/imports/{id} — Soft delete + audit log entry."""
    await soft_delete_import(import_id, user, db)
    await db.commit()


@router.get("/{import_id}/audit", response_model=List[AuditLogResponse])
async def audit_trail(
    import_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """GET /api/imports/{id}/audit — Full audit trail for one import."""
    if not user.org_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Organisation required")
    return await get_import_audit(import_id, user.org_id, db)


# ── Threshold Tracker (Section 4.4) ────────────────────────────────


@threshold_router.get("/status", response_model=ThresholdStatusResponse)
async def threshold_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    GET /api/threshold/status — Rolling 12-month import value tracker.

    Returns threshold status based on import_value_gbp (Hard Rule #5).
    """
    if not user.org_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Organisation required")
    return await get_threshold_status(user.org_id, db)
