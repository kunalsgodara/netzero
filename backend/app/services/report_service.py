from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from fastapi import HTTPException

from app.models.report import Report
from app.schemas.report import ReportCreate, ReportUpdate


async def list_reports(user_id: UUID, order_by: str, limit: int, db: AsyncSession):
    query = select(Report).where(Report.user_id == user_id)
    if order_by.startswith("-"):
        col = getattr(Report, order_by[1:], Report.created_date)
        query = query.order_by(desc(col))
    else:
        col = getattr(Report, order_by, Report.created_date)
        query = query.order_by(col)
    result = await db.execute(query.limit(limit))
    return result.scalars().all()


async def create_report(user_id: UUID, data: ReportCreate, db: AsyncSession):
    report = Report(user_id=user_id, **data.model_dump())
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return report


async def get_report(report_id: UUID, user_id: UUID, db: AsyncSession):
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.user_id == user_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


async def update_report(report_id: UUID, user_id: UUID, data: ReportUpdate, db: AsyncSession):
    report = await get_report(report_id, user_id, db)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(report, key, value)
    await db.flush()
    await db.refresh(report)
    return report


async def delete_report(report_id: UUID, user_id: UUID, db: AsyncSession):
    report = await get_report(report_id, user_id, db)
    await db.delete(report)
