"""
Compliance Deadlines Seeder
Seeds UK CBAM regulatory deadlines for all organisations.
"""
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.uk_cbam import Organisation, ComplianceDeadline
import uuid


# UK CBAM deadlines for 2027-2029
DEADLINES = [
    # 2026-2027
    {"type": "uk_cbam_registration", "due_date": date(2026, 12, 31), "description": "Register with HMRC for UK CBAM"},
    
    # 2027 Quarterly Declarations
    {"type": "uk_cbam_q1_2027", "due_date": date(2027, 4, 30), "description": "Q1 2027 Declaration (Jan-Mar)"},
    {"type": "uk_cbam_q2_2027", "due_date": date(2027, 7, 31), "description": "Q2 2027 Declaration (Apr-Jun)"},
    {"type": "uk_cbam_q3_2027", "due_date": date(2027, 10, 31), "description": "Q3 2027 Declaration (Jul-Sep)"},
    {"type": "uk_cbam_q4_2027", "due_date": date(2028, 1, 31), "description": "Q4 2027 Declaration (Oct-Dec)"},
    
    # 2028 Quarterly Declarations
    {"type": "uk_cbam_q1_2028", "due_date": date(2028, 4, 30), "description": "Q1 2028 Declaration (Jan-Mar)"},
    {"type": "uk_cbam_q2_2028", "due_date": date(2028, 7, 31), "description": "Q2 2028 Declaration (Apr-Jun)"},
    {"type": "uk_cbam_q3_2028", "due_date": date(2028, 10, 31), "description": "Q3 2028 Declaration (Jul-Sep)"},
    {"type": "uk_cbam_q4_2028", "due_date": date(2029, 1, 31), "description": "Q4 2028 Declaration (Oct-Dec)"},
    
    # 2029 Quarterly Declarations
    {"type": "uk_cbam_q1_2029", "due_date": date(2029, 4, 30), "description": "Q1 2029 Declaration (Jan-Mar)"},
    {"type": "uk_cbam_q2_2029", "due_date": date(2029, 7, 31), "description": "Q2 2029 Declaration (Apr-Jun)"},
    {"type": "uk_cbam_q3_2029", "due_date": date(2029, 10, 31), "description": "Q3 2029 Declaration (Jul-Sep)"},
    {"type": "uk_cbam_q4_2029", "due_date": date(2030, 1, 31), "description": "Q4 2029 Declaration (Oct-Dec)"},
]


async def seed_compliance_deadlines(db: AsyncSession) -> None:
    """
    Seed compliance deadlines for all organisations.
    Creates standard UK CBAM deadlines for each organisation.
    """
    print("Seeding compliance deadlines...")
    
    # Get all organisations
    result = await db.execute(select(Organisation))
    organisations = result.scalars().all()
    
    if not organisations:
        print("No organisations found. Skipping deadline seeding.")
        return
    
    created_count = 0
    
    for org in organisations:
        # Check if deadlines already exist for this org
        existing = await db.execute(
            select(ComplianceDeadline).where(ComplianceDeadline.org_id == org.id)
        )
        if existing.scalars().first():
            print(f"Deadlines already exist for organisation: {org.name}")
            continue
        
        # Create deadlines for this organisation
        for deadline_data in DEADLINES:
            deadline = ComplianceDeadline(
                id=uuid.uuid4(),
                org_id=org.id,
                deadline_type=deadline_data["type"],
                due_date=deadline_data["due_date"],
                status="upcoming",
                notes=deadline_data["description"]
            )
            db.add(deadline)
            created_count += 1
        
        print(f"Created {len(DEADLINES)} deadlines for organisation: {org.name}")
    
    await db.commit()
    print(f"✓ Seeded {created_count} compliance deadlines for {len(organisations)} organisations")


if __name__ == "__main__":
    import asyncio
    from app.config.database import get_db
    
    async def main():
        async for session in get_db():
            await seed_compliance_deadlines(session)
            break
    
    asyncio.run(main())
