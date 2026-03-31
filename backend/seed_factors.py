import asyncio
import os
import sys

# Add the backend dir to sys.path so we can import 'app'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, async_session
from app.models import EmissionFactor

# Format: (scope, category, source, unit, factor, source_dataset)
DEFRA_FACTORS = [
    ("Scope 1", "Stationary Combustion", "Natural Gas", "kWh", 0.18293, "DEFRA 2024"),
    ("Scope 1", "Stationary Combustion", "Diesel", "litres", 2.68787, "DEFRA 2024"),
    ("Scope 1", "Stationary Combustion", "Petrol", "litres", 2.31440, "DEFRA 2024"),
    ("Scope 1", "Stationary Combustion", "Coal", "tonnes", 2883.71, "DEFRA 2024"),
    ("Scope 1", "Stationary Combustion", "LPG", "litres", 1.55537, "DEFRA 2024"),
    ("Scope 1", "Stationary Combustion", "Biomass", "tonnes", 61.55, "DEFRA 2024"),
    ("Scope 1", "Mobile Combustion", "Diesel", "litres", 2.68787, "DEFRA 2024"),
    ("Scope 1", "Mobile Combustion", "Petrol", "litres", 2.31440, "DEFRA 2024"),
    ("Scope 1", "Mobile Combustion", "LPG", "litres", 1.55537, "DEFRA 2024"),
    ("Scope 1", "Mobile Combustion", "Car (average)", "km", 0.17145, "DEFRA 2024"),
    ("Scope 1", "Mobile Combustion", "Van (average)", "km", 0.24587, "DEFRA 2024"),
    ("Scope 1", "Mobile Combustion", "HGV (average)", "km", 0.86532, "DEFRA 2024"),
    ("Scope 1", "Fugitive Emissions", "Refrigerants", "kg", 3922.0, "DEFRA 2024"),
    ("Scope 1", "Process Emissions", "Industrial Processes", "tonnes", 910.0, "DEFRA 2024"),
    ("Scope 2", "Purchased Electricity", "Grid Electricity", "kWh", 0.20707, "DEFRA 2024"),
    ("Scope 2", "Purchased Electricity", "Renewable Electricity", "kWh", 0.000, "DEFRA 2024"),
    ("Scope 2", "Purchased Heat/Steam", "Heat and Steam", "kWh", 0.17040, "DEFRA 2024"),
    ("Scope 2", "Purchased Cooling", "Cooling", "kWh", 0.20707, "DEFRA 2024"),
    ("Scope 3", "Business Travel", "Air Travel", "km", 0.25493, "DEFRA 2024"),
    ("Scope 3", "Business Travel", "Rail Travel", "km", 0.03549, "DEFRA 2024"),
    ("Scope 3", "Business Travel", "Taxi", "km", 0.14880, "DEFRA 2024"),
    ("Scope 3", "Business Travel", "Bus", "km", 0.10312, "DEFRA 2024"),
    ("Scope 3", "Employee Commuting", "Car (average)", "km", 0.17145, "DEFRA 2024"),
    ("Scope 3", "Employee Commuting", "Rail Travel", "km", 0.03549, "DEFRA 2024"),
    ("Scope 3", "Employee Commuting", "Bus", "km", 0.10312, "DEFRA 2024"),
    ("Scope 3", "Employee Commuting", "Cycling/Walking", "km", 0.000, "DEFRA 2024"),
    ("Scope 3", "Purchased Goods", "General Goods & Services", "tonnes", 580.0, "DEFRA 2024"),
    ("Scope 3", "Purchased Goods", "Capital Goods", "tonnes", 780.0, "DEFRA 2024"),
    ("Scope 3", "Waste Disposal", "Landfill", "tonnes", 586.5, "DEFRA 2024"),
    ("Scope 3", "Waste Disposal", "Recycled", "tonnes", 21.35, "DEFRA 2024"),
    ("Scope 3", "Upstream & Downstream Transport", "Road Freight", "tonne-km", 0.10720, "DEFRA 2024"),
    ("Scope 3", "Upstream & Downstream Transport", "Air Freight", "tonne-km", 0.60230, "DEFRA 2024"),
]

async def seed_data():
    async with engine.begin() as conn:
        # Create table if it doesn't exist
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        from sqlalchemy import select
        # Check if already seeded
        result = await session.execute(select(EmissionFactor).limit(1))
        if result.scalar_one_or_none():
            print("Database already seeded with emission factors.")
            return

        print(f"Seeding {len(DEFRA_FACTORS)} DEFRA factors...")
        for row in DEFRA_FACTORS:
            factor = EmissionFactor(
                scope=row[0],
                category=row[1],
                source=row[2],
                unit=row[3],
                factor=row[4],
                source_dataset=row[5]
            )
            session.add(factor)
        
        await session.commit()
        print("Seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_data())
