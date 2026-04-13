from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.models.user import User
from app.models.uk_cbam import Organisation
from app.middleware.auth import hash_password, verify_password, create_access_token, create_refresh_token
from app.schemas.auth import UserCreate, UserLogin, TokenResponse


async def register_user(data: UserCreate, db: AsyncSession) -> TokenResponse:
    """Register creates an Organisation + admin User in one transaction."""
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create the organisation first
    org = Organisation(name=data.org_name)
    db.add(org)
    await db.flush()  # Flush to get org.id

    # Create the user with org_id and admin role
    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        org_id=org.id,
        role="admin",
    )
    db.add(user)
    await db.flush()

    org_id_str = str(org.id)
    return TokenResponse(
        access_token=create_access_token(str(user.id), org_id=org_id_str),
        refresh_token=create_refresh_token(str(user.id), org_id=org_id_str),
    )


async def login_user(data: UserLogin, db: AsyncSession) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    org_id_str = str(user.org_id) if user.org_id else None
    return TokenResponse(
        access_token=create_access_token(str(user.id), org_id=org_id_str),
        refresh_token=create_refresh_token(str(user.id), org_id=org_id_str),
    )


async def find_or_create_google_user(google_id: str, email: str, full_name: str, db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if not user:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            user.google_id = google_id
            if not user.full_name:
                user.full_name = full_name
        else:
            user = User(email=email, full_name=full_name, google_id=google_id)
            db.add(user)

    await db.flush()
    return user
