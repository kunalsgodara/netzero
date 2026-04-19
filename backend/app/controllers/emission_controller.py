from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.models.user import User
from app.schemas.emission import EmissionActivityCreate, EmissionActivityUpdate, EmissionActivityResponse, EmissionFactorResponse
from app.middleware.auth import get_current_user
from app.services.emission_service import (
    list_activities, create_activity, update_activity,
    delete_activity, bulk_import_csv, list_emission_factors, list_cbam_factors,
)

router = APIRouter(prefix="/api/v1/emission-activities", tags=["emission-activities"])
factors_router = APIRouter(prefix="/api/v1/emission-factors", tags=["emission-factors"])


from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.models.user import User
from app.schemas.emission import EmissionActivityCreate, EmissionActivityUpdate, EmissionActivityResponse, EmissionFactorResponse
from app.middleware.auth import get_current_user
from app.services.emission_service import (
    list_activities, create_activity, update_activity,
    delete_activity, bulk_import_csv, list_emission_factors, list_cbam_factors,
)

router = APIRouter(prefix="/api/v1/emission-activities", tags=["emission-activities"])
factors_router = APIRouter(prefix="/api/v1/emission-factors", tags=["emission-factors"])


@router.get("")
async def list_emission_activities(
    page: int = Query(1, ge=1),
    page_size: int = Query(4, ge=1, le=10000),
    order_by: str = "-created_date",
    scope: str = None,
    category: str = None,
    month: int = Query(None, ge=1, le=12),
    year: int = Query(None, ge=1900),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List emission activities with pagination. Returns newest first by default."""
    activities, total = await list_activities(current_user.id, order_by, page, page_size, scope, category, month, year, db)
    total_pages = (total + page_size - 1) // page_size
    
    return {
        "items": [EmissionActivityResponse.model_validate(a) for a in activities],
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }


@router.post("", response_model=EmissionActivityResponse, status_code=201)
async def create_emission_activity(
    data: EmissionActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await create_activity(current_user.id, data, db)


@router.put("/{activity_id}", response_model=EmissionActivityResponse)
async def update_emission_activity(
    activity_id: UUID, data: EmissionActivityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await update_activity(activity_id, current_user.id, data, db)


@router.delete("/{activity_id}", status_code=204)
async def delete_emission_activity(
    activity_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await delete_activity(activity_id, current_user.id, db)


@router.post("/bulk-import", response_model=dict)
async def bulk_import(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = await file.read()
    return await bulk_import_csv(current_user.id, content, db)


@factors_router.get("", response_model=List[EmissionFactorResponse])
async def list_factors(db: AsyncSession = Depends(get_db)):
    return await list_emission_factors(db)


@factors_router.get("/cbam", response_model=List[EmissionFactorResponse])
async def list_cbam_factors_endpoint(db: AsyncSession = Depends(get_db)):
    return await list_cbam_factors(db)
