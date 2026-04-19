from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.schemas.uk_cbam import UKCBAMProductResponse
from app.services.products_service import list_products, get_product_by_code

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=List[UKCBAMProductResponse])
async def get_products(db: AsyncSession = Depends(get_db)):
    """GET /api/products — All UK CBAM products with default intensities."""
    return await list_products(db)


@router.get("/{commodity_code}", response_model=UKCBAMProductResponse)
async def get_product(commodity_code: str, db: AsyncSession = Depends(get_db)):
    """GET /api/products/{commodity_code} — Single product detail."""
    return await get_product_by_code(commodity_code, db)
