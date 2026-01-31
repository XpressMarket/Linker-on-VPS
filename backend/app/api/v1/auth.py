
# backend/app/api/v1/auth.py

# from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy import select
# from datetime import datetime, timedelta
# from pydantic import BaseModel, EmailStr, field_validator
# import secrets

# from app.db.session import get_db
# from app.models.user import User, UserRole
# from app.models.verification import VerificationToken, VerificationType
# from app.core.security import (
#     get_password_hash,
#     verify_password,
#     create_access_token,
#     create_refresh_token,
#     decode_token,
#     generate_verification_token
# )
# from app.core.config import settings








# backend/app/api/v1/auth.py


from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from datetime import datetime, timezone

from pydantic import BaseModel, EmailStr, field_validator
import httpx

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.verification import VerificationToken, VerificationType
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_verification_token
)
from app.core.config import settings
from app.services.email import send_verification_email, send_password_reset_email
from app.services.captcha import verify_captcha

router = APIRouter()
security = HTTPBearer()

# Schemas
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    captcha_token: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain digit')
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyEmailRequest(BaseModel):
    token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# 1. ADD THIS SCHEMA after ResetPasswordRequest (around line 60)
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain digit')
        return v


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    is_email_verified: bool


# Dependencies
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    
    return user

async def require_verified_email(current_user: User = Depends(get_current_user)):
    if not current_user.is_email_verified:
        raise HTTPException(status_code=403, detail="Email not verified")
    return current_user

# async def require_admin(current_user: User = Depends(require_verified_email)):
#     if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
#         raise HTTPException(status_code=403, detail="Admin access required")
#     return current_user


async def require_admin(current_user: User = Depends(require_verified_email)):
    """
    Require any admin level access.
    Includes: admin, executive_admin, platform_owner, super_admin (legacy)
    """
    if current_user.role not in [
        UserRole.ADMIN, 
        UserRole.EXECUTIVE_ADMIN, 
        UserRole.PLATFORM_OWNER,
        UserRole.SUPER_ADMIN  # Backward compatibility
    ]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# async def require_super_admin(current_user: User = Depends(require_verified_email)):
#     if current_user.role != UserRole.SUPER_ADMIN:
#         raise HTTPException(status_code=403, detail="Super admin access required")
#     return current_user

async def require_super_admin(current_user: User = Depends(require_verified_email)):
    """
    Require super admin or platform owner access.
    Note: super_admin is legacy, platform_owner is the new root role.
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.PLATFORM_OWNER]:
        raise HTTPException(status_code=403, detail="Super admin access required")
    return current_user



# ✅ NEW: Executive Admin permission check
async def require_executive_admin(current_user: User = Depends(require_verified_email)):
    """
    Require executive admin or platform owner access.
    Used for managing regular admins.
    """
    if current_user.role not in [UserRole.EXECUTIVE_ADMIN, UserRole.PLATFORM_OWNER]:
        raise HTTPException(
            status_code=403, 
            detail="Executive admin access required"
        )
    return current_user


# ✅ NEW: Platform Owner permission check
async def require_platform_owner(current_user: User = Depends(require_verified_email)):
    """
    Require platform owner (root admin) access.
    Used for managing executive admins and critical system operations.
    """
    if current_user.role != UserRole.PLATFORM_OWNER:
        raise HTTPException(
            status_code=403, 
            detail="Platform owner access required"
        )
    return current_user


# Endpoints
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    req: Request = None
):
    # Verify CAPTCHA
    if not await verify_captcha(request.captcha_token, req.client.host):
        raise HTTPException(status_code=400, detail="CAPTCHA verification failed")
    
    # Check if user exists
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=request.email,
        password_hash=get_password_hash(request.password),
        role=UserRole.USER # changed from USER to user
    )
    db.add(user)
    await db.flush()
    
    # Create verification token
    token = generate_verification_token()
    verification = VerificationToken(
        user_id=user.id,
        token=token,
        type=VerificationType.EMAIL,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
        # expires_at=datetime.utcnow() + timedelta(hours=24)
        # Reduced time to 
    )
    db.add(verification)
    await db.commit()
    
    # Send verification email
    background_tasks.add_task(
        send_verification_email,
        user.email,
        token
    )
    
    return {
        "message": "Registration successful. Please check your email to verify your account.",
        "user_id": str(user.id)
    }

@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    # Find user
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    
    # ✅ NEW: Check email verification
    if not user.is_email_verified:
        raise HTTPException(
            status_code=403, 
            detail="Please verify your email before logging in. Check your inbox for the verification link."
        )
    
    # Update last login
    user.last_login = datetime.now(timezone.utc)
    await db.commit()
    
    # Create tokens
    access_token = create_access_token({"sub": str(user.id), "role": user.role.value})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )



@router.post("/verify-email")
async def verify_email(
    request: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db)
):
    # Find token
    result = await db.execute(
        select(VerificationToken).where(
            VerificationToken.token == request.token,
            VerificationToken.type == VerificationType.EMAIL,
            VerificationToken.used_at.is_(None)
        )
    )
    verification = result.scalar_one_or_none()
    
    if not verification:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    if verification.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token has expired")
    
    # Verify user
    result = await db.execute(select(User).where(User.id == verification.user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_email_verified = True
    verification.used_at = datetime.now(timezone.utc)
    
    await db.commit()
    
    return {"message": "Email verified successfully"}


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    # Find user
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    # Don't reveal if user exists
    if not user:
        return {"message": "If the email exists, a password reset link has been sent"}
    
    # Create reset token
    token = generate_verification_token()
    verification = VerificationToken(
        user_id=user.id,
        token=token,
        type=VerificationType.PASSWORD_RESET,
        # expires_at=datetime.utcnow() + timedelta(hours=1)
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
    )
    db.add(verification)
    await db.commit()
    
    # Send reset email
    background_tasks.add_task(
        send_password_reset_email,
        user.email,
        token
    )
    
    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    # Find token
    result = await db.execute(
        select(VerificationToken).where(
            VerificationToken.token == request.token,
            VerificationToken.type == VerificationType.PASSWORD_RESET,
            VerificationToken.used_at.is_(None)
        )
    )
    verification = result.scalar_one_or_none()
    
   # ✅ FIX: Use timezone-aware datetime for comparison
    if not verification or verification.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # Update password
    result = await db.execute(select(User).where(User.id == verification.user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.password_hash = get_password_hash(request.new_password)
    verification.used_at = datetime.now(timezone.utc)  # ✅ FIX: Use timezone-aware datetime
    
    await db.commit()
    
    return {"message": "Password reset successfully"}


# 2. ADD THIS ENDPOINT after reset_password (around line 380)
@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change password for authenticated user
    Requires current password verification
    """
    # Verify current password
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=400, 
            detail="Current password is incorrect"
        )
    
    # Check if new password is different from current
    if verify_password(request.new_password, current_user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="New password must be different from current password"
        )
    
    # Update password
    current_user.password_hash = get_password_hash(request.new_password)
    current_user.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    
    return {"message": "Password changed successfully"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        role=current_user.role.value,
        is_email_verified=current_user.is_email_verified
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
    
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    access_token = create_access_token({"sub": str(user.id), "role": user.role.value})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )