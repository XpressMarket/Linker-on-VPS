# backend/app/core/security.py
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Request
from starlette.middleware.base import BaseHTTPMiddleware
import secrets
import hashlib

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    now = datetime.now(timezone.utc)  # ✅ FIXED: Calculate fresh timestamp
    
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict):
    to_encode = data.copy()
    now = datetime.now(timezone.utc)  # ✅ FIXED: Calculate fresh timestamp
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def generate_verification_token() -> str:
    """Generate a secure random token for email verification"""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Hash a token for secure storage"""
    return hashlib.sha256(token.encode()).hexdigest()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple rate limiting middleware"""
    def __init__(self, app, calls: int = 100, period: int = 60):
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.clients = {}

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        now = datetime.now(timezone.utc)
        
        # Clean old entries
        self.clients = {
            ip: times for ip, times in self.clients.items()
            if any(now - t < timedelta(seconds=self.period) for t in times)
        }
        
        # Check rate limit
        if client_ip in self.clients:
            recent_calls = [
                t for t in self.clients[client_ip]
                if now - t < timedelta(seconds=self.period)
            ]
            if len(recent_calls) >= self.calls:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded"
                )
            self.clients[client_ip] = recent_calls + [now]
        else:
            self.clients[client_ip] = [now]
        
        response = await call_next(request)
        return response
