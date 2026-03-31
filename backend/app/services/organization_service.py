from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from fastapi import HTTPException

from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate, OrganizationUpdate


async def list_organizations(user_id: UUID, order_by: str, limit: int, db: AsyncSession):
    query = select(Organization).where(Organization.user_id == user_id)
    if order_by.startswith("-"):
        col = getattr(Organization, order_by[1:], Organization.created_date)
        query = query.order_by(desc(col))
    else:
        col = getattr(Organization, order_by, Organization.created_date)
        query = query.order_by(col)
    result = await db.execute(query.limit(limit))
    return result.scalars().all()


async def create_organization(user_id: UUID, data: OrganizationCreate, db: AsyncSession):
    org = Organization(user_id=user_id, **data.model_dump())
    db.add(org)
    await db.flush()
    await db.refresh(org)
    return org


async def get_organization(org_id: UUID, user_id: UUID, db: AsyncSession):
    result = await db.execute(
        select(Organization).where(Organization.id == org_id, Organization.user_id == user_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


async def update_organization(org_id: UUID, user_id: UUID, data: OrganizationUpdate, db: AsyncSession):
    org = await get_organization(org_id, user_id, db)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(org, key, value)
    await db.flush()
    await db.refresh(org)
    return org


async def delete_organization(org_id: UUID, user_id: UUID, db: AsyncSession):
    org = await get_organization(org_id, user_id, db)
    await db.delete(org)
