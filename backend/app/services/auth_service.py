import random
import string
import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.constants import APP_NAME, EMAIL_SUBJECT_VERIFY, EMAIL_SUBJECT_RESET
from sqlalchemy import select, text

from app.models.user import User
from app.models.uk_cbam import Organisation
from app.middleware.auth import hash_password, verify_password, create_access_token, create_refresh_token
from app.schemas.auth import UserCreate, UserLogin, TokenResponse
from app.config.settings import get_settings

OTP_EXPIRE_MINUTES = 10
OTP_COOLDOWN_SECONDS = 30


def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def _build_otp_html(otp: str, subject: str) -> str:
    return f"""
    <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
        <div style="width:32px;height:32px;background:linear-gradient(135deg,#059669,#0d9488);border-radius:8px;display:flex;align-items:center;justify-content:center;">
          <span style="color:white;font-size:16px;">&#127807;</span>
        </div>
        <span style="font-size:15px;font-weight:800;color:#071a0b;letter-spacing:-0.3px;">{APP_NAME}</span>
      </div>
      <h2 style="font-size:20px;font-weight:900;color:#071a0b;margin:0 0 8px;">{subject}</h2>
      <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.6;">Use the code below. It expires in <strong>10 minutes</strong>.</p>
      <div style="background:#f0fdf4;border:2px solid #059669;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
        <span style="font-size:36px;font-weight:900;letter-spacing:0.5rem;color:#059669;">{otp}</span>
      </div>
      <p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.6;">If you didn't request this, you can safely ignore this email.</p>
    </div>
    """


async def _send_otp_email(email: str, otp: str, subject: str = "Your verification code") -> bool:
    """
    Send OTP email to user.
    Returns True if email sent successfully, False otherwise.
    """
    settings = get_settings()

    print(f"\n[OTP] To: {email} | Subject: {subject} | Code: {otp}\n")

    if not settings.smtp_user or not settings.smtp_password:
        print("[EMAIL] SMTP not configured, skipping email send")
        return False

    smtp_user = settings.smtp_user
    smtp_password = settings.smtp_password.replace(" ", "")
    smtp_from = settings.smtp_from

    def _send_sync():
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = smtp_from
        msg["To"] = email
        msg.attach(MIMEText(_build_otp_html(otp, subject), "html"))

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, [email], msg.as_string())

    try:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, _send_sync)
        print(f"[EMAIL] Successfully sent to {email}")
        return True
    except Exception as e:
        error_msg = f"Failed to send email to {email}: {str(e)}"
        print(f"[EMAIL ERROR] {error_msg}")
        # Log error but don't raise - OTP is still valid in database
        # In production, this should be logged to monitoring system
        return False


async def register_user(data: UserCreate, db: AsyncSession) -> dict[str, str | bool]:
    result = await db.execute(select(User).where(User.email == data.email))
    existing = result.scalar_one_or_none()

    if existing:
        if existing.is_verified:
            raise HTTPException(status_code=400, detail="Email already registered")
        now = datetime.now(timezone.utc)
        if existing.otp_resend_allowed_at and now < existing.otp_resend_allowed_at:
            wait = int((existing.otp_resend_allowed_at - now).total_seconds())
            raise HTTPException(status_code=429, detail=f"Please wait {wait}s before requesting another code")
        otp = _generate_otp()
        existing.otp_code = otp
        existing.otp_expires_at = now + timedelta(minutes=OTP_EXPIRE_MINUTES)
        existing.otp_resend_allowed_at = now + timedelta(seconds=OTP_COOLDOWN_SECONDS)
        existing.hashed_password = hash_password(data.password)
        existing.full_name = data.full_name
        await db.flush()
        await db.commit()
        email_sent = await _send_otp_email(existing.email, otp, EMAIL_SUBJECT_VERIFY)
        return {
            "message": "OTP sent" if email_sent else "OTP generated but email delivery failed. Please contact support.",
            "email": existing.email,
            "email_sent": email_sent
        }

    otp = _generate_otp()
    now = datetime.now(timezone.utc)

    org = Organisation(name=data.org_name)
    db.add(org)
    await db.flush()

    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=hash_password(data.password),
        org_id=org.id,
        role="admin",
        is_verified=False,
        otp_code=otp,
        otp_expires_at=now + timedelta(minutes=OTP_EXPIRE_MINUTES),
        otp_resend_allowed_at=now + timedelta(seconds=OTP_COOLDOWN_SECONDS),
    )
    db.add(user)
    await db.flush()
    await db.commit()
    email_sent = await _send_otp_email(user.email, otp, EMAIL_SUBJECT_VERIFY)
    return {
        "message": "OTP sent" if email_sent else "OTP generated but email delivery failed. Please contact support.",
        "email": user.email,
        "email_sent": email_sent
    }


async def verify_email_otp(email: str, otp: str, db: AsyncSession) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    if not user.otp_code or user.otp_code != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if not user.otp_expires_at or datetime.now(timezone.utc) > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired")

    user.is_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    user.otp_resend_allowed_at = None
    await db.flush()
    await db.commit()

    org_id_str = str(user.org_id) if user.org_id else None
    return TokenResponse(
        access_token=create_access_token(str(user.id), org_id=org_id_str),
        refresh_token=create_refresh_token(str(user.id), org_id=org_id_str),
    )


async def resend_otp(email: str, db: AsyncSession) -> dict[str, str | int | bool]:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")

    now = datetime.now(timezone.utc)
    if user.otp_resend_allowed_at and now < user.otp_resend_allowed_at:
        wait = int((user.otp_resend_allowed_at - now).total_seconds())
        raise HTTPException(status_code=429, detail=f"Please wait {wait}s before requesting another code")

    otp = _generate_otp()
    user.otp_code = otp
    user.otp_expires_at = now + timedelta(minutes=OTP_EXPIRE_MINUTES)
    user.otp_resend_allowed_at = now + timedelta(seconds=OTP_COOLDOWN_SECONDS)
    await db.flush()
    await db.commit()
    email_sent = await _send_otp_email(user.email, otp, "Your new verification code")
    return {
        "message": "OTP resent" if email_sent else "OTP generated but email delivery failed. Please contact support.",
        "cooldown_seconds": OTP_COOLDOWN_SECONDS,
        "email_sent": email_sent
    }


async def login_user(data: UserLogin, db: AsyncSession) -> TokenResponse:
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="EMAIL_NOT_VERIFIED")

    org_id_str = str(user.org_id) if user.org_id else None
    return TokenResponse(
        access_token=create_access_token(str(user.id), org_id=org_id_str),
        refresh_token=create_refresh_token(str(user.id), org_id=org_id_str),
    )


async def forgot_password(email: str, db: AsyncSession) -> dict[str, str | int | bool]:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not user.is_verified:
        return {"message": "If this email is registered, a code has been sent"}

    now = datetime.now(timezone.utc)
    if user.otp_resend_allowed_at and now < user.otp_resend_allowed_at:
        wait = int((user.otp_resend_allowed_at - now).total_seconds())
        raise HTTPException(status_code=429, detail=f"Please wait {wait}s before requesting another code")

    otp = _generate_otp()
    user.otp_code = otp
    user.otp_expires_at = now + timedelta(minutes=OTP_EXPIRE_MINUTES)
    user.otp_resend_allowed_at = now + timedelta(seconds=OTP_COOLDOWN_SECONDS)
    await db.flush()
    await db.commit()
    email_sent = await _send_otp_email(user.email, otp, EMAIL_SUBJECT_RESET)
    return {
        "message": "If this email is registered, a code has been sent" if email_sent else "OTP generated but email delivery failed. Please contact support.",
        "cooldown_seconds": OTP_COOLDOWN_SECONDS,
        "email_sent": email_sent
    }


async def verify_reset_otp(email: str, otp: str, db: AsyncSession) -> dict[str, str]:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.otp_code or user.otp_code != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if not user.otp_expires_at or datetime.now(timezone.utc) > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired")
    return {"message": "OTP verified"}


async def reset_password(email: str, otp: str, new_password: str, db: AsyncSession) -> dict[str, str]:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.otp_code or user.otp_code != otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    if not user.otp_expires_at or datetime.now(timezone.utc) > user.otp_expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user.hashed_password = hash_password(new_password)
    user.otp_code = None
    user.otp_expires_at = None
    user.otp_resend_allowed_at = None
    await db.flush()
    await db.commit()
    return {"message": "Password reset successfully"}


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
            user.is_verified = True
        else:
            # Create organization for Google OAuth user
            org = Organisation(name=f"{full_name}'s Organization")
            db.add(org)
            await db.flush()
            
            user = User(
                email=email,
                full_name=full_name,
                google_id=google_id,
                is_verified=True,
                org_id=org.id,
                role="admin",
            )
            db.add(user)

    await db.flush()
    await db.commit()
    return user
