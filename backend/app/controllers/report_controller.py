from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.models.user import User
from app.schemas.report import ReportCreate, ReportUpdate, ReportResponse
from app.middleware.auth import get_current_user
from app.services.report_service import (
    list_reports, create_report, update_report, delete_report,
)

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


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
