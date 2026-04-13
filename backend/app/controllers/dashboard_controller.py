"""
UK CBAM Dashboard Controller — aggregated analytics for the main dashboard.

Provides:
  GET /api/dashboard/cbam-summary  — KPIs + sector breakdown + monthly timeline
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract, case

from app.config.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.uk_cbam import Import, UKCBAMProduct

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/cbam-summary")
async def cbam_summary(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Aggregated UK CBAM dashboard data for the current org.
    Returns total liability, savings, sector breakdown, and monthly timeline.
    """
    if not user.org_id:
        return {
            "total_liability_gbp": 0,
            "total_liability_default_gbp": 0,
            "total_saving_gbp": 0,
            "total_imports": 0,
            "total_emissions_tco2e": 0,
            "by_sector": [],
            "by_country": [],
            "monthly_timeline": [],
        }

    org_id = user.org_id
    base_filter = (Import.org_id == org_id) & (Import.is_deleted == False)

    # ── KPI Totals ──────────────────────────────────────────────
    totals_q = await db.execute(
        select(
            func.count(Import.id).label("total_imports"),
            func.coalesce(func.sum(Import.cbam_liability_gbp), 0).label("total_liability_gbp"),
            func.coalesce(func.sum(Import.cbam_liability_default_gbp), 0).label("total_liability_default_gbp"),
            func.coalesce(func.sum(Import.potential_saving_gbp), 0).label("total_saving_gbp"),
            func.coalesce(func.sum(Import.embedded_emissions_tco2e), 0).label("total_emissions_tco2e"),
        ).where(base_filter)
    )
    row = totals_q.one()

    # ── By Sector ───────────────────────────────────────────────
    sector_q = await db.execute(
        select(
            UKCBAMProduct.sector,
            func.count(Import.id).label("count"),
            func.coalesce(func.sum(Import.cbam_liability_gbp), 0).label("liability"),
            func.coalesce(func.sum(Import.embedded_emissions_tco2e), 0).label("emissions"),
            func.coalesce(func.sum(Import.potential_saving_gbp), 0).label("saving"),
        )
        .join(UKCBAMProduct, Import.product_id == UKCBAMProduct.id)
        .where(base_filter)
        .group_by(UKCBAMProduct.sector)
        .order_by(func.sum(Import.cbam_liability_gbp).desc())
    )
    by_sector = [
        {
            "sector": r.sector,
            "count": r.count,
            "liability_gbp": float(r.liability),
            "emissions_tco2e": float(r.emissions),
            "saving_gbp": float(r.saving),
        }
        for r in sector_q.all()
    ]

    # ── By Country ──────────────────────────────────────────────
    country_q = await db.execute(
        select(
            Import.country_of_origin,
            func.count(Import.id).label("count"),
            func.coalesce(func.sum(Import.cbam_liability_gbp), 0).label("liability"),
            func.coalesce(func.sum(Import.embedded_emissions_tco2e), 0).label("emissions"),
        )
        .where(base_filter)
        .group_by(Import.country_of_origin)
        .order_by(func.sum(Import.cbam_liability_gbp).desc())
    )
    by_country = [
        {
            "country": r.country_of_origin,
            "count": r.count,
            "liability_gbp": float(r.liability),
            "emissions_tco2e": float(r.emissions),
        }
        for r in country_q.all()
    ]

    # ── Monthly Timeline ────────────────────────────────────────
    timeline_q = await db.execute(
        select(
            extract("year", Import.import_date).label("yr"),
            extract("month", Import.import_date).label("mo"),
            func.count(Import.id).label("count"),
            func.coalesce(func.sum(Import.cbam_liability_gbp), 0).label("liability"),
            func.coalesce(func.sum(Import.embedded_emissions_tco2e), 0).label("emissions"),
        )
        .where(base_filter)
        .group_by("yr", "mo")
        .order_by("yr", "mo")
    )
    monthly_timeline = [
        {
            "year": int(r.yr),
            "month": int(r.mo),
            "count": r.count,
            "liability_gbp": float(r.liability),
            "emissions_tco2e": float(r.emissions),
        }
        for r in timeline_q.all()
    ]

    return {
        "total_liability_gbp": float(row.total_liability_gbp),
        "total_liability_default_gbp": float(row.total_liability_default_gbp),
        "total_saving_gbp": float(row.total_saving_gbp),
        "total_imports": row.total_imports,
        "total_emissions_tco2e": float(row.total_emissions_tco2e),
        "by_sector": by_sector,
        "by_country": by_country,
        "monthly_timeline": monthly_timeline,
    }
