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
    cbam_controller,
)

settings = get_settings()

app = FastAPI(
    title="NetZeroWorks API",
    description="Carbon compliance platform backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_controller.router)
app.include_router(organization_controller.router)
app.include_router(emission_controller.router)
app.include_router(emission_controller.factors_router)
app.include_router(cbam_controller.router)
app.include_router(report_controller.router)
app.include_router(integration_controller.router)

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
    from app.models import User, Organization, EmissionActivity, EmissionFactor, CBAMImport, Report  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Quick check: if any emission factors exist, skip seeding entirely
    from sqlalchemy import select, and_
    async with async_session() as session:
        result = await session.execute(select(EmissionFactor).limit(1))
        if result.scalar_one_or_none():
            print("[startup] Database already seeded, skipping factor seeding.")
            return

    # Seed DEFRA Scope 1/2/3 factors (idempotent)
    try:
        from app.seeders.defra_factors import DEFRA_FACTORS
        async with async_session() as session:
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

    # Seed CBAM factors (idempotent — skips if already seeded)
    try:
        from app.seeders.cbam_factors import CBAM_FACTORS
        async with async_session() as session:
            count = 0
            for hscn_code, cat_key, cat_label, description, direct, indirect, total in CBAM_FACTORS:
                result = await session.execute(
                    select(EmissionFactor).where(
                        and_(
                            EmissionFactor.scope == "CBAM",
                            EmissionFactor.category == cat_key,
                            EmissionFactor.source == str(hscn_code),
                        )
                    )
                )
                if result.scalar_one_or_none():
                    continue
                session.add(EmissionFactor(
                    scope="CBAM", category=cat_key, source=str(hscn_code),
                    unit="tCO2e/tonne", factor=total,
                    source_dataset=f"EU CBAM Default Values 2024 | {cat_label} | {description} | Direct: {direct} Indirect: {indirect}",
                ))
                count += 1
            if count > 0:
                await session.commit()
                print(f"[startup] Seeded {count} CBAM factors.")
    except Exception as e:
        print(f"[startup] CBAM seeding skipped: {e}")
