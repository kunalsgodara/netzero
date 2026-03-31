from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.models import Report, User
from app.schemas import ReportCreate, ReportUpdate, ReportResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.get("", response_model=List[ReportResponse])
async def list_reports(
    order_by: str = "-created_date",
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Report).where(Report.user_id == current_user.id)
    if order_by.startswith("-"):
        col = getattr(Report, order_by[1:], Report.created_date)
        query = query.order_by(desc(col))
    else:
        col = getattr(Report, order_by, Report.created_date)
        query = query.order_by(col)
    query = query.limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=ReportResponse, status_code=201)
async def create_report(
    data: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = Report(user_id=current_user.id, **data.model_dump())
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return report


@router.put("/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: UUID,
    data: ReportUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.user_id == current_user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(report, key, value)

    await db.flush()
    await db.refresh(report)
    return report


@router.delete("/{report_id}", status_code=204)
async def delete_report(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.user_id == current_user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    await db.delete(report)
