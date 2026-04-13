from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.uk_cbam import UKCBAMProduct


async def list_products(db: AsyncSession) -> list[UKCBAMProduct]:
    """Return all UK CBAM products with default intensities."""
    result = await db.execute(
        select(UKCBAMProduct).order_by(UKCBAMProduct.sector, UKCBAMProduct.commodity_code)
    )
    return result.scalars().all()


async def get_product_by_code(commodity_code: str, db: AsyncSession) -> UKCBAMProduct:
    """Return a single product by its UK tariff commodity code."""
    result = await db.execute(
        select(UKCBAMProduct).where(UKCBAMProduct.commodity_code == commodity_code)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with commodity code '{commodity_code}' not found")
    return product
