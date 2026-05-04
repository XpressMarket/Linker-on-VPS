# backend/app/core/config.py
from pydantic_settings import BaseSettings
from typing import List
 
class Settings(BaseSettings):
    # App
    ENVIRONMENT: str = "production"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Captcha 
    RECAPTCHA_SECRET_KEY: str

    
    # Database
    DATABASE_URL: str
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["https://marketa-web.vercel.app"]
    ALLOWED_HOSTS: List[str] = ["https://*.vercel.app", "127.0.0.1"]
    
    # Email
    SMTP_HOST: str
    SMTP_PORT: int = 587
    SMTP_USER: str
    SMTP_PASSWORD: str
    FROM_EMAIL: str
    
    # Storage
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str = "us-east-1"
    S3_BUCKET: str
    CLOUDFRONT_URL: str = ""
    
    # Security
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # URLs
    FRONTEND_URL: str = "https://marketa-web.vercel.app"
    
    class Config:
        env_file = ".env"

settings = Settings()