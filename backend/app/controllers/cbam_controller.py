from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.models.user import User
from app.schemas.cbam import CBAMImportCreate, CBAMImportUpdate, CBAMImportResponse
from app.middleware.auth import get_current_user
from app.services.cbam_service import (
    list_cbam_imports, create_cbam_import, update_cbam_import,
    delete_cbam_import, get_eu_ets_price,
)

router = APIRouter(prefix="/api/v1/cbam-imports", tags=["cbam-imports"])


@router.get("/eu-ets-price")
def ets_price():
    return get_eu_ets_price()


@router.get("", response_model=List[CBAMImportResponse])
async def list_imports(
    order_by: str = "-created_date", limit: int = 200,
    category: Optional[str] = None, declaration_status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await list_cbam_imports(current_user.id, order_by, limit, category, declaration_status, db)


@router.post("", response_model=CBAMImportResponse, status_code=201)
async def create_import(
    data: CBAMImportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await create_cbam_import(current_user.id, data, db)


@router.put("/{import_id}", response_model=CBAMImportResponse)
async def update_import(
    import_id: UUID, data: CBAMImportUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await update_cbam_import(import_id, current_user.id, data, db)


@router.delete("/{import_id}", status_code=204)
async def delete_import(
    import_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await delete_cbam_import(import_id, current_user.id, db)
