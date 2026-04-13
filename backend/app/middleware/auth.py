from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
import time

from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config.settings import get_settings
from app.config.database import get_db
from app.models.user import User

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=10)
security = HTTPBearer()

# Simple TTL cache for user lookups — avoids a DB hit on every authenticated request
_user_cache: dict[str, tuple] = {}  # user_id -> (User, expires_at)
_USER_CACHE_TTL = 60  # seconds


def _cache_user(user_id: str, user: User):
    _user_cache[user_id] = (user, time.monotonic() + _USER_CACHE_TTL)


def _get_cached_user(user_id: str) -> Optional[User]:
    entry = _user_cache.get(user_id)
    if entry and time.monotonic() < entry[1]:
        return entry[0]
    _user_cache.pop(user_id, None)
    return None


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str, org_id: Optional[str] = None, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token with user_id and org_id claims."""
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    payload = {"sub": user_id, "exp": expire, "type": "access"}
    if org_id:
        payload["org_id"] = org_id
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(user_id: str, org_id: Optional[str] = None) -> str:
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    payload = {"sub": user_id, "exp": expire, "type": "refresh"}
    if org_id:
        payload["org_id"] = org_id
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # Return cached user if still valid (avoids DB hit on every request)
    cached = _get_cached_user(user_id)
    if cached:
        return cached

    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    # Eagerly touch all columns we need before detaching from the session.
    # This prevents DetachedInstanceError when cached user is used in other requests.
    _ = user.org_id, user.id, user.email, user.full_name, user.role, user.is_active

    # Expunge from session so the cached object won't try to lazy-load
    db.expunge(user)

    _cache_user(user_id, user)
    return user
