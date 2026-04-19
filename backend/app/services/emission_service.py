import csv
import io
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from fastapi import HTTPException

from app.models.emission import EmissionActivity, EmissionFactor
from app.schemas.emission import EmissionActivityCreate, EmissionActivityUpdate



from typing import Tuple, List

async def list_activities(user_id: UUID, order_by: str, page: int, page_size: int, scope: str, category: str, month: int, year: int, db: AsyncSession) -> Tuple[List[EmissionActivity], int]:
    """List emission activities with pagination. Returns (activities, total_count)."""
    
    # Whitelist allowed columns for ordering
    ALLOWED_ORDER_COLUMNS = {
        'created_date', 'activity_date', 'quantity', 'co2e_kg', 
        'activity_name', 'scope', 'category', 'unit'
    }
    
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
    
    
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0
    
    
    # Validate and sanitize order_by parameter
    is_desc = order_by.startswith("-")
    col_name = order_by[1:] if is_desc else order_by
    
    if col_name not in ALLOWED_ORDER_COLUMNS:
        col_name = 'created_date'  # Default to safe column
        is_desc = True
    
    col = getattr(EmissionActivity, col_name)
    query = query.order_by(desc(col) if is_desc else col)
    
    
    # Validate page number
    page = max(1, page)
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    activities = result.scalars().all()
    
    return activities, total


async def create_activity(user_id: UUID, data: EmissionActivityCreate, db: AsyncSession) -> EmissionActivity:
    activity = EmissionActivity(user_id=user_id, **data.model_dump())
    db.add(activity)
    await db.flush()
    await db.commit()
    await db.refresh(activity)
    return activity


async def get_activity(activity_id: UUID, user_id: UUID, db: AsyncSession) -> EmissionActivity:
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


async def update_activity(activity_id: UUID, user_id: UUID, data: EmissionActivityUpdate, db: AsyncSession) -> EmissionActivity:
    activity = await get_activity(activity_id, user_id, db)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(activity, key, value)
    await db.flush()
    await db.commit()
    await db.refresh(activity)
    return activity


async def delete_activity(activity_id: UUID, user_id: UUID, db: AsyncSession) -> None:
    activity = await get_activity(activity_id, user_id, db)
    await db.delete(activity)
    await db.commit()


async def bulk_import_csv(user_id: UUID, content: bytes, db: AsyncSession) -> dict:
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Invalid CSV file encoding. Please use UTF-8.")
    
    try:
        reader = csv.DictReader(io.StringIO(text))
    except csv.Error as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")
    
    # Validate required columns
    required_columns = {'activity_name', 'scope', 'quantity', 'unit'}
    if reader.fieldnames:
        missing_columns = required_columns - set(reader.fieldnames)
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
    
    created, errors = 0, []
    for i, row in enumerate(reader, start=2):
        try:
            # Validate required fields
            if not row.get("activity_name", "").strip():
                raise ValueError("activity_name is required")
            if not row.get("scope", "").strip():
                raise ValueError("scope is required")
            if not row.get("unit", "").strip():
                raise ValueError("unit is required")
            
            # Validate numeric fields
            try:
                quantity = float(row.get("quantity", 0))
                if quantity < 0:
                    raise ValueError("quantity must be non-negative")
            except (ValueError, TypeError):
                raise ValueError("quantity must be a valid number")
            
            emission_factor = None
            if row.get("emission_factor"):
                try:
                    emission_factor = float(row["emission_factor"])
                except (ValueError, TypeError):
                    raise ValueError("emission_factor must be a valid number")
            
            co2e_kg = None
            if row.get("co2e_kg"):
                try:
                    co2e_kg = float(row["co2e_kg"])
                except (ValueError, TypeError):
                    raise ValueError("co2e_kg must be a valid number")
            
            activity = EmissionActivity(
                user_id=user_id,
                activity_name=row.get("activity_name", "").strip(),
                scope=row.get("scope", "").strip(),
                category=row.get("category", "").strip() or None,
                source=row.get("source", "").strip() or None,
                quantity=quantity,
                unit=row.get("unit", "").strip(),
                emission_factor=emission_factor,
                co2e_kg=co2e_kg,
                reporting_period=row.get("reporting_period", "").strip() or None,
            )
            db.add(activity)
            created += 1
        except Exception as e:
            errors.append({"row": i, "error": str(e)})
            # Continue processing other rows
    
    if created > 0:
        await db.flush()
        await db.commit()
    
    return {"created": created, "errors": errors}


async def list_emission_factors(db: AsyncSession) -> List[EmissionFactor]:
    
    result = await db.execute(
        select(EmissionFactor)
        .where(EmissionFactor.scope != "CBAM")
        .order_by(EmissionFactor.scope, EmissionFactor.category, EmissionFactor.source)
    )
    return result.scalars().all()


async def list_cbam_factors(db: AsyncSession) -> List[EmissionFactor]:
    result = await db.execute(
        select(EmissionFactor)
        .where(EmissionFactor.scope == "CBAM")
        .order_by(EmissionFactor.category, EmissionFactor.source)
    )
    return result.scalars().all()
