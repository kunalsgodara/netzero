from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
import uuid

from app.config.database import get_db
from app.config.settings import get_settings
from app.config.constants import APP_NAME
from app.models.user import User
from app.schemas.auth import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    OTPVerify, ForgotPasswordRequest, ResetPasswordRequest, ResendOTPRequest,
)
from app.middleware.auth import get_current_user, decode_token, create_access_token, create_refresh_token
from app.services.auth_service import (
    register_user, login_user, find_or_create_google_user,
    verify_email_otp, resend_otp,
    forgot_password, verify_reset_otp, reset_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


@router.post("/register")
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    return await register_user(data, db)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    return await login_user(data, db)


@router.post("/verify-email", response_model=TokenResponse)
async def verify_email(data: OTPVerify, db: AsyncSession = Depends(get_db)):
    return await verify_email_otp(data.email, data.otp, db)


@router.post("/resend-otp")
async def resend_otp_endpoint(data: ResendOTPRequest, db: AsyncSession = Depends(get_db)):
    return await resend_otp(data.email, db)


@router.post("/forgot-password")
async def forgot_password_endpoint(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    return await forgot_password(data.email, db)


@router.post("/verify-reset-otp")
async def verify_reset_otp_endpoint(data: OTPVerify, db: AsyncSession = Depends(get_db)):
    return await verify_reset_otp(data.email, data.otp, db)


@router.post("/reset-password")
async def reset_password_endpoint(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    return await reset_password(data.email, data.otp, data.new_password, db)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    org_id_str = str(user.org_id) if user.org_id else None
    return TokenResponse(
        access_token=create_access_token(str(user.id), org_id=org_id_str),
        refresh_token=create_refresh_token(str(user.id), org_id=org_id_str),
    )


@router.get("/google")
async def google_login(redirect: str = None):
    url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={settings.google_client_id}"
        f"&redirect_uri={settings.google_redirect_uri}"
        f"&response_type=code&scope=openid email profile"
        f"&state={redirect or settings.frontend_url}&access_type=offline"
    )
    return RedirectResponse(url)


@router.get("/google/callback")
async def google_callback(code: str, state: str = None, db: AsyncSession = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")
        tokens = token_resp.json()
        userinfo_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        userinfo = userinfo_resp.json()

    user = await find_or_create_google_user(
        userinfo["id"], userinfo["email"], userinfo.get("name", ""), db
    )
    org_id_str = str(user.org_id) if user.org_id else None
    access_token = create_access_token(str(user.id), org_id=org_id_str)
    refresh_token = create_refresh_token(str(user.id), org_id=org_id_str)
    redirect_url = state or settings.frontend_url
    separator = "&" if "?" in redirect_url else "?"
    return RedirectResponse(f"{redirect_url}{separator}access_token={access_token}&refresh_token={refresh_token}")


@router.get("/apps/public/prod/public-settings/by-id/{app_id}")
async def public_settings(app_id: str):
    return {"id": app_id, "public_settings": {"auth_required": True, "app_name": APP_NAME}}
