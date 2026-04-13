import csv
import io
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from fastapi import HTTPException

from app.models.emission import EmissionActivity, EmissionFactor
from app.schemas.emission import EmissionActivityCreate, EmissionActivityUpdate


import csv
import io
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from fastapi import HTTPException

from app.models.emission import EmissionActivity, EmissionFactor
from app.schemas.emission import EmissionActivityCreate, EmissionActivityUpdate


async def list_activities(user_id: UUID, order_by: str, page: int, page_size: int, scope: str, category: str, month: int, year: int, db: AsyncSession):
    """List emission activities with pagination. Returns (activities, total_count)."""
    
    # Build base query
    query = select(EmissionActivity).where(EmissionActivity.user_id == user_id)
    count_query = select(func.count(EmissionActivity.id)).where(EmissionActivity.user_id == user_id)
    
    if scope:
        query = query.where(EmissionActivity.scope == scope)
        count_query = count_query.where(EmissionActivity.scope == scope)
    if category:
        query = query.where(EmissionActivity.category == category)
        count_query = count_query.where(EmissionActivity.category == category)
    if year:
        query = query.where(func.extract('year', EmissionActivity.activity_date) == year)
        count_query = count_query.where(func.extract('year', EmissionActivity.activity_date) == year)
    if month:
        query = query.where(func.extract('month', EmissionActivity.activity_date) == month)
        count_query = count_query.where(func.extract('month', EmissionActivity.activity_date) == month)
    
    # Count total
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0
    
    # Apply ordering
    if order_by.startswith("-"):
        col = getattr(EmissionActivity, order_by[1:], EmissionActivity.created_date)
        query = query.order_by(desc(col))
    else:
        col = getattr(EmissionActivity, order_by, EmissionActivity.created_date)
        query = query.order_by(col)
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    activities = result.scalars().all()
    
    return activities, total


async def create_activity(user_id: UUID, data: EmissionActivityCreate, db: AsyncSession):
    activity = EmissionActivity(user_id=user_id, **data.model_dump())
    db.add(activity)
    await db.flush()
    await db.refresh(activity)
    return activity


async def get_activity(activity_id: UUID, user_id: UUID, db: AsyncSession):
    result = await db.execute(
        select(EmissionActivity).where(
            EmissionActivity.id == activity_id,
            EmissionActivity.user_id == user_id,
        )
    )
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Emission activity not found")
    return activity


async def update_activity(activity_id: UUID, user_id: UUID, data: EmissionActivityUpdate, db: AsyncSession):
    activity = await get_activity(activity_id, user_id, db)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(activity, key, value)
    await db.flush()
    await db.refresh(activity)
    return activity


async def delete_activity(activity_id: UUID, user_id: UUID, db: AsyncSession):
    activity = await get_activity(activity_id, user_id, db)
    await db.delete(activity)


async def bulk_import_csv(user_id: UUID, content: bytes, db: AsyncSession):
    text = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))
    created, errors = 0, []
    for i, row in enumerate(reader, start=2):
        try:
            activity = EmissionActivity(
                user_id=user_id,
                activity_name=row.get("activity_name", "").strip(),
                scope=row.get("scope", "").strip(),
                category=row.get("category", "").strip() or None,
                source=row.get("source", "").strip() or None,
                quantity=float(row.get("quantity", 0)),
                unit=row.get("unit", "").strip(),
                emission_factor=float(row["emission_factor"]) if row.get("emission_factor") else None,
                co2e_kg=float(row["co2e_kg"]) if row.get("co2e_kg") else None,
                reporting_period=row.get("reporting_period", "").strip() or None,
            )
            db.add(activity)
            created += 1
        except Exception as e:
            errors.append({"row": i, "error": str(e)})
    await db.flush()
    return {"created": created, "errors": errors}


async def list_emission_factors(db: AsyncSession):
    # Exclude CBAM factors — those are only used in the CBAM Manager page
    result = await db.execute(
        select(EmissionFactor)
        .where(EmissionFactor.scope != "CBAM")
        .order_by(EmissionFactor.scope, EmissionFactor.category, EmissionFactor.source)
    )
    return result.scalars().all()


async def list_cbam_factors(db: AsyncSession):
    result = await db.execute(
        select(EmissionFactor)
        .where(EmissionFactor.scope == "CBAM")
        .order_by(EmissionFactor.category, EmissionFactor.source)
    )
    return result.scalars().all()
