import csv
import io
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.models import EmissionActivity, User
from app.schemas import EmissionActivityCreate, EmissionActivityUpdate, EmissionActivityResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/v1/emission-activities", tags=["emission-activities"])


@router.get("", response_model=List[EmissionActivityResponse])
async def list_emission_activities(
    order_by: str = "-created_date",
    limit: int = 200,
    scope: str = None,
    category: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(EmissionActivity).where(EmissionActivity.user_id == current_user.id)
    if scope:
        query = query.where(EmissionActivity.scope == scope)
    if category:
        query = query.where(EmissionActivity.category == category)
    if order_by.startswith("-"):
        col = getattr(EmissionActivity, order_by[1:], EmissionActivity.created_date)
        query = query.order_by(desc(col))
    else:
        col = getattr(EmissionActivity, order_by, EmissionActivity.created_date)
        query = query.order_by(col)
    query = query.limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", response_model=EmissionActivityResponse, status_code=201)
async def create_emission_activity(
    data: EmissionActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activity = EmissionActivity(user_id=current_user.id, **data.model_dump())
    db.add(activity)
    await db.flush()
    await db.refresh(activity)
    return activity


@router.put("/{activity_id}", response_model=EmissionActivityResponse)
async def update_emission_activity(
    activity_id: UUID,
    data: EmissionActivityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(EmissionActivity).where(
            EmissionActivity.id == activity_id,
            EmissionActivity.user_id == current_user.id,
        )
    )
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Emission activity not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(activity, key, value)

    await db.flush()
    await db.refresh(activity)
    return activity


@router.delete("/{activity_id}", status_code=204)
async def delete_emission_activity(
    activity_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(EmissionActivity).where(
            EmissionActivity.id == activity_id,
            EmissionActivity.user_id == current_user.id,
        )
    )
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Emission activity not found")
    await db.delete(activity)


@router.post("/bulk-import", response_model=dict)
async def bulk_import(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Import emission activities from a CSV file."""
    content = await file.read()
    text = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))

    created = 0
    errors = []

    for i, row in enumerate(reader, start=2):
        try:
            activity = EmissionActivity(
                user_id=current_user.id,
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
