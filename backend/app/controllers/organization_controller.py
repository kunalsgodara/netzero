from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.models.user import User
from app.schemas.organization import OrganizationCreate, OrganizationUpdate, OrganizationResponse
from app.middleware.auth import get_current_user
from app.services.organization_service import (
    list_organizations, create_organization, get_organization,
    update_organization, delete_organization,
)

router = APIRouter(prefix="/api/v1/organizations", tags=["organizations"])


@router.get("", response_model=List[OrganizationResponse])
async def list_orgs(
    order_by: str = "-created_date", limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await list_organizations(current_user.id, order_by, limit, db)


@router.post("", response_model=OrganizationResponse, status_code=201)
async def create_org(
    data: OrganizationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await create_organization(current_user.id, data, db)


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_org(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_organization(org_id, current_user.id, db)


@router.put("/{org_id}", response_model=OrganizationResponse)
async def update_org(
    org_id: UUID, data: OrganizationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await update_organization(org_id, current_user.id, data, db)


@router.delete("/{org_id}", status_code=204)
async def delete_org(
    org_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await delete_organization(org_id, current_user.id, db)
