import json
from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from fastapi import HTTPException

from app.models.report import Report
from app.schemas.report import ReportCreate, ReportUpdate, ReportGenerateRequest
from app.services.report_aggregation_service import build_aggregation


async def list_reports(user_id: UUID, order_by: str, page: int, page_size: int, db: AsyncSession):
    """List reports with pagination. Returns (reports, total_count)."""
    
    # Count total
    count_query = select(func.count(Report.id)).where(Report.user_id == user_id)
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0
    
    # Build query with ordering
    query = select(Report).where(Report.user_id == user_id)
    if order_by.startswith("-"):
        col = getattr(Report, order_by[1:], Report.created_date)
        query = query.order_by(desc(col))
    else:
        col = getattr(Report, order_by, Report.created_date)
        query = query.order_by(col)
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    reports = result.scalars().all()
    
    return reports, total


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


async def generate_report(
    user_id: UUID,
    data: ReportGenerateRequest,
    db: AsyncSession,
):
    """
    Create a report with server-computed aggregations for a given date range.
    Aggregation data is stored as JSON in the `notes` field.
    """
    aggregation = await build_aggregation(user_id, data.start_date, data.end_date, db)

    # Serialize aggregation to JSON for storage in notes
    agg_dict = aggregation.model_dump()
    # Convert date objects to strings for JSON serialization
    notes_json = json.dumps(agg_dict, default=str)

    report = Report(
        user_id=user_id,
        title=data.title,
        type=data.type,
        period=data.period,
        status="generated",
        total_emissions_tco2e=aggregation.total_emissions_tco2e,
        total_cbam_charge_eur=aggregation.total_cbam_charge_eur,
        start_date=data.start_date,
        end_date=data.end_date,
        notes=notes_json,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)
    return report


async def get_report_aggregation_data(
    report_id: UUID,
    user_id: UUID,
    db: AsyncSession,
):
    """
    Return the full aggregation data for a specific report.
    If the report has stored aggregation in `notes`, use that.
    Otherwise, re-aggregate from the database using the report's date range.
    """
    report = await get_report(report_id, user_id, db)

    # Try to parse stored aggregation
    if report.notes:
        try:
            return json.loads(report.notes)
        except (json.JSONDecodeError, TypeError):
            pass

    # Fall back to re-aggregating from live data
    aggregation = await build_aggregation(
        user_id, report.start_date, report.end_date, db
    )
    return aggregation.model_dump()
