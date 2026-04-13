from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from fastapi import HTTPException

from app.models.uk_cbam import UKETSPrice


async def get_current_ets_price(db: AsyncSession) -> UKETSPrice:
    """Return the latest UK ETS quarterly price (most recent by fetched_at)."""
    result = await db.execute(
        select(UKETSPrice).order_by(desc(UKETSPrice.fetched_at)).limit(1)
    )
    price = result.scalar_one_or_none()
    if not price:
        raise HTTPException(status_code=404, detail="No UK ETS price data available")
    return price


async def get_price_history(db: AsyncSession) -> list[UKETSPrice]:
    """Return all stored UK ETS quarterly rates, newest first."""
    result = await db.execute(
        select(UKETSPrice).order_by(desc(UKETSPrice.fetched_at))
    )
    return result.scalars().all()
