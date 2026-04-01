from datetime import date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
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
    generate_report, get_report_aggregation_data,
)
from app.services.report_aggregation_service import build_aggregation

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


@router.get("", response_model=List[ReportResponse])
async def list_all_reports(
    order_by: str = "-created_date", limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await list_reports(current_user.id, order_by, limit, db)


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
