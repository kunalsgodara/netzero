from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from fastapi import HTTPException

from app.models.cbam import CBAMImport
from app.schemas.cbam import CBAMImportCreate, CBAMImportUpdate


async def list_cbam_imports(user_id: UUID, order_by: str, limit: int, category: str, declaration_status: str, db: AsyncSession):
    query = select(CBAMImport).where(CBAMImport.user_id == user_id)
    if category:
        query = query.where(CBAMImport.category == category)
    if declaration_status:
        query = query.where(CBAMImport.declaration_status == declaration_status)
    if order_by.startswith("-"):
        col = getattr(CBAMImport, order_by[1:], CBAMImport.created_date)
        query = query.order_by(desc(col))
    else:
        col = getattr(CBAMImport, order_by, CBAMImport.created_date)
        query = query.order_by(col)
    result = await db.execute(query.limit(limit))
    return result.scalars().all()


async def create_cbam_import(user_id: UUID, data: CBAMImportCreate, db: AsyncSession):
    imp = CBAMImport(user_id=user_id, **data.model_dump())
    db.add(imp)
    await db.flush()
    await db.refresh(imp)
    return imp


async def get_cbam_import(import_id: UUID, user_id: UUID, db: AsyncSession):
    result = await db.execute(
        select(CBAMImport).where(CBAMImport.id == import_id, CBAMImport.user_id == user_id)
    )
    imp = result.scalar_one_or_none()
    if not imp:
        raise HTTPException(status_code=404, detail="CBAM import not found")
    return imp


async def update_cbam_import(import_id: UUID, user_id: UUID, data: CBAMImportUpdate, db: AsyncSession):
    imp = await get_cbam_import(import_id, user_id, db)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(imp, key, value)
    await db.flush()
    await db.refresh(imp)
    return imp


async def delete_cbam_import(import_id: UUID, user_id: UUID, db: AsyncSession):
    imp = await get_cbam_import(import_id, user_id, db)
    await db.delete(imp)


def get_eu_ets_price():
    return {"price": 75.40, "currency": "EUR", "source": "EUA Live Snapshot", "status": "success"}
