from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import EmissionFactor
from app.schemas import EmissionFactorResponse

router = APIRouter(prefix="/api/v1/emission-factors", tags=["emission-factors"])

@router.get("", response_model=List[EmissionFactorResponse])
async def list_emission_factors(
    db: AsyncSession = Depends(get_db),
):
    """
    Returns the dynamic taxonomy of standard emission factors
    seeded from DEFRA / DESNZ. Public endpoint - no auth required
    so the Emissions form can populate before the user is logged in.
    """
    result = await db.execute(select(EmissionFactor).order_by(EmissionFactor.scope, EmissionFactor.category, EmissionFactor.source))
    return result.scalars().all()
