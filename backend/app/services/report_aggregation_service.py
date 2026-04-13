"""
Aggregation service for report generation.

Performs time-period-based queries against emission_activities and UK CBAM imports
to produce scope/category breakdowns and summary metrics.
"""

from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, cast, Date

from app.models.emission import EmissionActivity
from app.models.uk_cbam import Import as CBAMImport, UKCBAMProduct
from app.models.organization import Organization
from app.schemas.report import (
    ReportAggregationResponse,
    ScopeBreakdown,
    CategoryBreakdown,
    ActivityDetail,
    CBAMCategoryBreakdown,
    CBAMImportDetail,
    OrganizationInfo,
)

SCOPE_LABELS = {
    "scope_1": ("Scope 1 – Direct Emissions", "Stationary combustion, fugitive emissions, owned vehicles"),
    "scope_2": ("Scope 2 – Indirect (Energy)", "Purchased electricity, heat, steam & cooling"),
    "scope_3": ("Scope 3 – Value Chain", "Business travel, supply chain, waste, water"),
}


def _date_filter(model, start: Optional[date], end: Optional[date]):
    """Build a date filter using activity_date / import_date, falling back to created_date/created_at."""
    conditions = []
    # Detect fallback column
    if hasattr(model, "created_date"):
        fallback_col = model.created_date
    elif hasattr(model, "created_at"):
        fallback_col = model.created_at
    else:
        fallback_col = None

    # Use hasattr to detect the correct date column for this model
    if hasattr(model, "activity_date"):
        date_col = model.activity_date
    elif hasattr(model, "import_date"):
        date_col = model.import_date
    else:
        date_col = None

    if start and end and date_col is not None:
        if fallback_col is not None:
            conditions.append(
                or_(
                    and_(date_col != None, date_col >= start, date_col <= end),  # noqa: E711
                    and_(date_col == None, cast(fallback_col, Date) >= start, cast(fallback_col, Date) <= end),  # noqa: E711
                )
            )
        else:
            conditions.append(and_(date_col >= start, date_col <= end))
    elif start and end and fallback_col is not None:
        conditions.append(
            and_(cast(fallback_col, Date) >= start, cast(fallback_col, Date) <= end)
        )
    return conditions


async def get_org_details(user_id: UUID, db: AsyncSession) -> Optional[OrganizationInfo]:
    result = await db.execute(
        select(Organization).where(Organization.user_id == user_id).limit(1)
    )
    org = result.scalar_one_or_none()
    if not org:
        return None
    return OrganizationInfo(
        name=org.name,
        industry=org.industry,
        country=org.country,
        reporting_year=org.reporting_year,
        base_year=org.base_year,
        reduction_target_pct=org.reduction_target_pct,
    )


async def aggregate_emissions(
    user_id: UUID,
    start: Optional[date],
    end: Optional[date],
    db: AsyncSession,
):
    """Aggregate emission activities for a user within a date range."""
    base = select(EmissionActivity).where(EmissionActivity.user_id == user_id)
    date_conds = _date_filter(EmissionActivity, start, end)
    if date_conds:
        base = base.where(*date_conds)

    result = await db.execute(base.order_by(EmissionActivity.activity_date.asc().nullslast()))
    activities_list = result.scalars().all()

    # Scope breakdown
    scope_totals = {}
    for a in activities_list:
        s = a.scope or "scope_1"
        scope_totals[s] = scope_totals.get(s, 0.0) + (a.co2e_kg or 0.0) / 1000.0

    total = sum(scope_totals.values())

    scope_breakdown = []
    for scope_key in ["scope_1", "scope_2", "scope_3"]:
        val = scope_totals.get(scope_key, 0.0)
        label, desc = SCOPE_LABELS.get(scope_key, (scope_key, ""))
        scope_breakdown.append(ScopeBreakdown(
            scope=scope_key, label=label,
            emissions_tco2e=round(val, 2), description=desc,
        ))

    # Category breakdown
    cat_totals = {}
    for a in activities_list:
        cat_key = f"{a.category or 'Other'} ({a.scope})"
        if cat_key not in cat_totals:
            cat_totals[cat_key] = {"scope": a.scope, "category": a.category or "Other", "total": 0.0}
        cat_totals[cat_key]["total"] += (a.co2e_kg or 0.0) / 1000.0

    category_breakdown = []
    for key, data in sorted(cat_totals.items(), key=lambda x: -x[1]["total"]):
        share = (data["total"] / total * 100) if total > 0 else 0.0
        category_breakdown.append(CategoryBreakdown(
            category=f"{data['category']} ({data['scope'].replace('_', ' ').title()})",
            scope=data["scope"],
            emissions_tco2e=round(data["total"], 2),
            share_pct=round(share, 1),
        ))

    # Activity details
    activity_details = []
    for a in activities_list:
        activity_details.append(ActivityDetail(
            activity_name=a.activity_name,
            scope=a.scope,
            source=a.source,
            quantity=a.quantity,
            unit=a.unit,
            co2e_tco2e=round((a.co2e_kg or 0.0) / 1000.0, 3),
            activity_date=str(a.activity_date) if a.activity_date else None,
        ))

    return {
        "total_emissions_tco2e": round(total, 2),
        "scope_breakdown": scope_breakdown,
        "category_breakdown": category_breakdown,
        "activities": activity_details,
        "activity_count": len(activities_list),
    }


async def aggregate_cbam(
    user_id: UUID,
    start: Optional[date],
    end: Optional[date],
    db: AsyncSession,
):
    """Aggregate UK CBAM imports for a user within a date range.

    NOTE: The new UK CBAM Import model is org-scoped, not user-scoped.
    To maintain backwards compatibility with SECR reports, we query imports
    created by this user. Once the frontend is updated to UK CBAM, this
    should switch to org_id-based querying.
    """
    base = select(CBAMImport).where(
        CBAMImport.created_by == user_id,
        CBAMImport.is_deleted == False,  # noqa: E712
    )
    date_conds = _date_filter(CBAMImport, start, end)
    if date_conds:
        base = base.where(*date_conds)

    result = await db.execute(base.order_by(CBAMImport.import_date.asc().nullslast()))
    imports_list = result.scalars().all()

    total_charge = sum(float(i.cbam_liability_gbp or 0) for i in imports_list)
    total_embedded = sum(float(i.embedded_emissions_tco2e or 0) for i in imports_list)

    # Sector breakdown (replacing the old EU category breakdown)
    sector_map = {}
    for i in imports_list:
        # Eagerly load product to get sector info
        sector = "unknown"
        if i.product:
            sector = i.product.sector
        if sector not in sector_map:
            sector_map[sector] = {"qty": 0.0, "emissions": 0.0, "charge": 0.0}
        sector_map[sector]["qty"] += float(i.quantity_tonnes or 0)
        sector_map[sector]["emissions"] += float(i.embedded_emissions_tco2e or 0)
        sector_map[sector]["charge"] += float(i.cbam_liability_gbp or 0)

    cbam_category_breakdown = [
        CBAMCategoryBreakdown(
            category=sector,
            total_qty_tonnes=round(data["qty"], 1),
            embedded_emissions_tco2e=round(data["emissions"], 2),
            cbam_charge_eur=round(data["charge"], 2),  # Using the same schema field name for now
        )
        for sector, data in sorted(sector_map.items(), key=lambda x: -x[1]["charge"])
    ]

    # Import details
    cbam_imports = [
        CBAMImportDetail(
            product_name=i.product.description if i.product else "Unknown",
            hscn_code=i.product.commodity_code if i.product else "",
            origin_country=i.country_of_origin,
            supplier_name=i.supplier.name if i.supplier else None,
            quantity_tonnes=float(i.quantity_tonnes or 0),
            embedded_emissions=round(float(i.embedded_emissions_tco2e or 0), 2),
            cbam_charge_eur=round(float(i.cbam_liability_gbp or 0), 2),
            declaration_status="pending",
        )
        for i in imports_list
    ]

    return {
        "total_cbam_charge_eur": round(total_charge, 2),
        "total_embedded_emissions_tco2e": round(total_embedded, 2),
        "cbam_category_breakdown": cbam_category_breakdown,
        "cbam_imports": cbam_imports,
        "cbam_import_count": len(imports_list),
        "pending_declarations": 0,
    }


async def build_aggregation(
    user_id: UUID,
    start: Optional[date],
    end: Optional[date],
    db: AsyncSession,
) -> ReportAggregationResponse:
    """Build a full aggregation response combining org info, emissions, and CBAM data."""
    org_info = await get_org_details(user_id, db)
    emissions_data = await aggregate_emissions(user_id, start, end, db)
    cbam_data = await aggregate_cbam(user_id, start, end, db)

    return ReportAggregationResponse(
        organization=org_info,
        **emissions_data,
        **cbam_data,
    )
