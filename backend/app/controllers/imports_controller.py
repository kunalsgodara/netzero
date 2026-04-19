"""
UK CBAM Imports Controller — Section 4.3 + 4.4 endpoints.

All routes require JWT Bearer token. Org isolation enforced via org_id from the current user.
"""

from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from io import BytesIO

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
from app.services.csv_import_service import process_bulk_csv_import, generate_csv_template, BulkImportResult
from app.services.excel_export_service import generate_excel_export, ExportFilters

router = APIRouter(prefix="/api/imports", tags=["imports"])
threshold_router = APIRouter(prefix="/api/threshold", tags=["threshold"])





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


@router.get("/csv-template")
async def download_csv_template():
    """
    GET /api/imports/csv-template — Download CSV template file.

    Returns a CSV template with correct headers and an example row.
    """
    template_content = generate_csv_template()

    return Response(
        content=template_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=uk_cbam_import_template.csv"
        }
    )


@router.get("/export-excel")
async def export_to_excel(
    year: Optional[int] = Query(None, description="Filter by year (e.g. 2027)"),
    sector: Optional[str] = Query(None, description="Filter by sector (e.g. steel)"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    GET /api/imports/export-excel — Export imports to Excel file.

    Generates Excel file with 3 sheets:
        1. Imports Summary - All import records with calculations
        2. Formula Breakdown - Detailed calculation steps
        3. Summary - Aggregated statistics and sector breakdown

    Query Parameters:
        - year: Filter by import year (optional)
        - sector: Filter by product sector (optional)

    Returns: Excel file (.xlsx) for download
    """
    if not user.org_id:
        raise HTTPException(status_code=403, detail="Organisation required")

    filters = ExportFilters(year=year, sector=sector)

    try:
        excel_bytes = await generate_excel_export(
            org_id=user.org_id,
            filters=filters,
            db=db
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Generate filename with filters
    filename_parts = ["uk_cbam_imports"]
    if year:
        filename_parts.append(f"{year}")
    if sector:
        filename_parts.append(sector)
    filename = "_".join(filename_parts) + ".xlsx"

    return StreamingResponse(
        BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/{import_id}", response_model=ImportResponse)
async def get_one(
    import_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """GET /api/imports/{id} — Single import detail with formula outputs."""
    if not user.org_id:
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
        raise HTTPException(status_code=403, detail="Organisation required")
    return await get_import_audit(import_id, user.org_id, db)


@router.post("/bulk-csv", response_model=BulkImportResult)
async def bulk_import_csv(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    POST /api/imports/bulk-csv — Upload CSV file for bulk import.

    Accepts CSV file with imports data. Validates each row and creates Import records.
    Returns summary with success/error counts and detailed error list.

    File Requirements:
        - Max size: 10MB
        - Max rows: 1000
        - Required columns: import_date, product_code, quantity_tonnes, import_value_gbp, country_of_origin

    Rate Limit: 10 uploads per hour per user
    """
    if not user.org_id:
        raise HTTPException(status_code=403, detail="Organisation required")

    # Validate file size (10MB limit)
    file_content = await file.read()
    if len(file_content) > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be CSV format")

    # Process CSV import
    result = await process_bulk_csv_import(
        file_content=file_content,
        org_id=user.org_id,
        user=user,
        db=db
    )

    return result





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
