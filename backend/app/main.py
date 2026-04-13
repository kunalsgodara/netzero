from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config.settings import get_settings
from app.config.database import engine, async_session
from app.controllers import (
    auth_controller,
    organization_controller,
    emission_controller,
    integration_controller,
    report_controller,
    products_controller,
    ets_price_controller,
    imports_controller,
    dashboard_controller,
)

settings = get_settings()

app = FastAPI(
    title="NetZeroWorks API",
    description="Carbon compliance platform backend — UK CBAM + SECR",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Existing SECR routes ──────────────────────────────────────────
app.include_router(auth_controller.router)
app.include_router(organization_controller.router)
app.include_router(emission_controller.router)
app.include_router(emission_controller.factors_router)
app.include_router(report_controller.router)
app.include_router(integration_controller.router)

# ─── UK CBAM routes ────────────────────────────────────────────────
app.include_router(products_controller.router)
app.include_router(ets_price_controller.router)
app.include_router(imports_controller.router)
app.include_router(imports_controller.threshold_router)
app.include_router(dashboard_controller.router)

upload_dir = settings.upload_dir
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")


@app.get("/api/health")
async def health():
    return {"status": "ok", "app": "NetZeroWorks"}


@app.on_event("shutdown")
async def shutdown():
    from app.services.integration_service import _http_client
    if _http_client and not _http_client.is_closed:
        await _http_client.aclose()


@app.on_event("startup")
async def startup():
    from app.config.database import Base
    from app.models import (  # noqa: F401
        User, Organization, EmissionActivity, EmissionFactor, Report,
        Organisation, UKCBAMProduct, UKETSPrice,
        Supplier, Import, AuditLog, CBAMReport,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # ─── Seed DEFRA Scope 1/2/3 factors (idempotent) ───────────────
    from sqlalchemy import select, and_
    async with async_session() as session:
        result = await session.execute(select(EmissionFactor).limit(1))
        if result.scalar_one_or_none():
            print("[startup] DEFRA factors already seeded, skipping.")
        else:
            try:
                from app.seeders.defra_factors import DEFRA_FACTORS
                count = 0
                for scope, category, source, unit, factor, source_dataset in DEFRA_FACTORS:
                    result = await session.execute(
                        select(EmissionFactor).where(
                            and_(
                                EmissionFactor.scope == scope,
                                EmissionFactor.category == category,
                                EmissionFactor.source == source,
                            )
                        )
                    )
                    if result.scalar_one_or_none():
                        continue
                    session.add(EmissionFactor(
                        scope=scope, category=category, source=source,
                        unit=unit, factor=factor, source_dataset=source_dataset,
                    ))
                    count += 1
                if count > 0:
                    await session.commit()
                    print(f"[startup] Seeded {count} DEFRA factors.")
            except Exception as e:
                print(f"[startup] DEFRA seeding skipped: {e}")

    # ─── Seed UK CBAM Products (idempotent) ────────────────────────
    try:
        from app.seeders.uk_cbam_products_seed import UK_CBAM_PRODUCTS
        async with async_session() as session:
            result = await session.execute(select(UKCBAMProduct).limit(1))
            if result.scalar_one_or_none():
                print("[startup] UK CBAM products already seeded, skipping.")
            else:
                count = 0
                for code, desc, sector, ptype, intensity, valid_from, notes in UK_CBAM_PRODUCTS:
                    session.add(UKCBAMProduct(
                        commodity_code=code,
                        description=desc,
                        sector=sector,
                        product_type=ptype,
                        default_intensity=intensity,
                        valid_from=valid_from,
                        includes_indirect=False,  # Always FALSE until 2029
                        notes=notes,
                    ))
                    count += 1
                if count > 0:
                    await session.commit()
                    print(f"[startup] Seeded {count} UK CBAM products.")
    except Exception as e:
        print(f"[startup] UK CBAM product seeding skipped: {e}")

    # ─── Seed UK ETS Prices (idempotent) ───────────────────────────
    try:
        from app.seeders.uk_ets_prices_seed import UK_ETS_PRICES
        async with async_session() as session:
            result = await session.execute(select(UKETSPrice).limit(1))
            if result.scalar_one_or_none():
                print("[startup] UK ETS prices already seeded, skipping.")
            else:
                count = 0
                for quarter, price, source in UK_ETS_PRICES:
                    session.add(UKETSPrice(
                        quarter=quarter,
                        price_gbp=price,
                        source=source,
                    ))
                    count += 1
                if count > 0:
                    await session.commit()
                    print(f"[startup] Seeded {count} UK ETS prices.")
    except Exception as e:
        print(f"[startup] UK ETS price seeding skipped: {e}")
