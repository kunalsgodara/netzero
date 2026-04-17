from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
import os

from app.config.settings import get_settings
from app.config.constants import APP_NAME, APP_API_TITLE, APP_DESCRIPTION, APP_VERSION
from app.config.database import engine, async_session
from app.middleware.rate_limit import RateLimitMiddleware
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
    deadlines_controller,
)

settings = get_settings()

app = FastAPI(
    title=APP_API_TITLE,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
    max_age=3600,
)

# Add rate limiting middleware
app.add_middleware(RateLimitMiddleware)


app.include_router(auth_controller.router)
app.include_router(organization_controller.router)
app.include_router(emission_controller.router)
app.include_router(emission_controller.factors_router)
app.include_router(report_controller.router)
app.include_router(integration_controller.router)


app.include_router(products_controller.router)
app.include_router(ets_price_controller.router)
app.include_router(imports_controller.router)
app.include_router(imports_controller.threshold_router)
app.include_router(dashboard_controller.router)
app.include_router(deadlines_controller.router)

upload_dir = settings.upload_dir
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")


@app.get("/api/health")
async def health():
    return {"status": "ok", "app": APP_NAME}


@app.on_event("shutdown")
async def shutdown():
    from app.services.integration_service import _http_client
    if _http_client and not _http_client.is_closed:
        await _http_client.aclose()


@app.on_event("startup")
async def startup():
    from app.config.database import Base
    from app.models import (  
        User, Organization, EmissionActivity, EmissionFactor, Report,
        Organisation, UKCBAMProduct, UKETSPrice,
        Supplier, Import, AuditLog, CBAMReport, ComplianceDeadline,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        for col_sql in [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organisations(id) ON DELETE SET NULL",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member'",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR UNIQUE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_resend_allowed_at TIMESTAMP",
        ]:
            await conn.execute(text(col_sql))

    
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
                        includes_indirect=False,  
                        notes=notes,
                    ))
                    count += 1
                if count > 0:
                    await session.commit()
                    print(f"[startup] Seeded {count} UK CBAM products.")
    except Exception as e:
        print(f"[startup] UK CBAM product seeding skipped: {e}")

    
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

    # Seed compliance deadlines
    try:
        from app.seeders.compliance_deadlines_seed import seed_compliance_deadlines
        from app.models.uk_cbam import ComplianceDeadline
        async with async_session() as session:
            result = await session.execute(select(ComplianceDeadline).limit(1))
            if result.scalar_one_or_none():
                print("[startup] Compliance deadlines already seeded, skipping.")
            else:
                await seed_compliance_deadlines(session)
    except Exception as e:
        print(f"[startup] Compliance deadline seeding skipped: {e}")
