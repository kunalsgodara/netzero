from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import get_settings
from app.routes import auth, organizations, emissions, emission_factors, cbam, reports, integrations

settings = get_settings()

app = FastAPI(
    title="NetZeroWorks API",
    description="Carbon compliance platform backend",
    version="1.0.0",
)

# CORS — allow the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router)
app.include_router(organizations.router)
app.include_router(emissions.router)
app.include_router(emission_factors.router)
app.include_router(cbam.router)
app.include_router(reports.router)
app.include_router(integrations.router)

# Serve uploaded files
upload_dir = settings.upload_dir
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")


@app.get("/api/health")
async def health():
    return {"status": "ok", "app": "NetZeroWorks"}


# DB table creation for development (use Alembic for production)
@app.on_event("startup")
async def startup():
    from app.database import engine, Base, async_session
    from app.models import User, Organization, EmissionActivity, EmissionFactor, CBAMImport, Report  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed CBAM emission factors (idempotent)
    try:
        from app.cbam_factors_seed import CBAM_FACTORS
        from sqlalchemy import select, and_
        async with async_session() as session:
            count = 0
            for hscn_code, cat_key, cat_label, description, direct, indirect, total in CBAM_FACTORS:
                result = await session.execute(
                    select(EmissionFactor).where(
                        and_(
                            EmissionFactor.scope == "CBAM",
                            EmissionFactor.category == cat_key,
                            EmissionFactor.source == str(hscn_code)
                        )
                    )
                )
                if result.scalar_one_or_none():
                    continue
                factor = EmissionFactor(
                    scope="CBAM",
                    category=cat_key,
                    source=str(hscn_code),
                    unit="tCO2e/tonne",
                    factor=total,
                    source_dataset=f"EU CBAM Default Values 2024 | {cat_label} | {description} | Direct: {direct} Indirect: {indirect}"
                )
                session.add(factor)
                count += 1
            if count > 0:
                await session.commit()
                print(f"[startup] Seeded {count} CBAM factors.")
    except Exception as e:
        print(f"[startup] CBAM factor seeding skipped: {e}")
