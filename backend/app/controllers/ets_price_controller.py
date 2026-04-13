from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.schemas.uk_cbam import UKETSPriceResponse, UKETSPriceCurrentResponse
from app.services.ets_price_service import get_current_ets_price, get_price_history

router = APIRouter(prefix="/api/ets-price", tags=["ets-price"])


@router.get("/current", response_model=UKETSPriceCurrentResponse)
async def current_price(db: AsyncSession = Depends(get_db)):
    """GET /api/ets-price/current — Latest UK ETS quarterly rate (£/tCO₂e)."""
    price = await get_current_ets_price(db)
    return UKETSPriceCurrentResponse(
        quarter=price.quarter,
        price_gbp=price.price_gbp,
        source=price.source,
        currency="GBP",
    )


@router.get("/history", response_model=List[UKETSPriceResponse])
async def price_history(db: AsyncSession = Depends(get_db)):
    """GET /api/ets-price/history — All stored quarterly rates."""
    return await get_price_history(db)
