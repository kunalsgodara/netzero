import io
from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.models.user import User
from app.schemas.report import (
    ReportCreate, ReportUpdate, ReportResponse,
    ReportGenerateRequest, ReportAggregationResponse,
)
from app.middleware.auth import get_current_user
from app.services.report_service import (
    list_reports, create_report, update_report, delete_report,
    generate_report, get_report_aggregation_data, get_report,
)
from app.services.report_aggregation_service import build_aggregation
from app.services.report_pdf_service import generate_pdf

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.get("/preview", response_model=ReportAggregationResponse)
async def preview_aggregation(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Preview aggregation data for a date range without creating a report."""
    return await build_aggregation(current_user.id, start_date, end_date, db)


@router.get("")
async def list_all_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(4, ge=1, le=10000),
    order_by: str = "-created_date",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List reports with pagination. Returns newest first by default."""
    reports, total = await list_reports(current_user.id, order_by, page, page_size, db)
    total_pages = (total + page_size - 1) // page_size
    
    return {
        "items": [ReportResponse.model_validate(r) for r in reports],
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }


@router.post("", response_model=ReportResponse, status_code=201)
async def create_new_report(
    data: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await create_report(current_user.id, data, db)


@router.post("/generate", response_model=ReportResponse, status_code=201)
async def generate_new_report(
    data: ReportGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a report with server-computed aggregations for a given date range."""
    return await generate_report(current_user.id, data, db)


@router.get("/{report_id}/pdf")
async def download_report_pdf(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and stream a PDF for a specific report."""
    report = await get_report(report_id, current_user.id, db)
    agg_data = await get_report_aggregation_data(report_id, current_user.id, db)

    created_str = (
        report.created_date.strftime("%d %B %Y")
        if report.created_date else
        date.today().strftime("%d %B %Y")
    )
    meta = {
        "title":        report.title,
        "period":       report.period,
        "status":       report.status,
        "created_date": created_str,
    }

    pdf_bytes = generate_pdf(report.type, agg_data, meta)
    safe_name = report.title.replace(" ", "_")

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_name}.pdf"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )


@router.get("/{report_id}/data")
async def get_report_data(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the full aggregation data for a specific report."""
    return await get_report_aggregation_data(report_id, current_user.id, db)


@router.put("/{report_id}", response_model=ReportResponse)
async def update_existing_report(
    report_id: UUID, data: ReportUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await update_report(report_id, current_user.id, data, db)


@router.delete("/{report_id}", status_code=204)
async def delete_existing_report(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await delete_report(report_id, current_user.id, db)
