
# backend/app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Optional

class Settings(BaseSettings):
    # App
    ENVIRONMENT: str = "production"
    SECRET_KEY: str = "dev-secret-key-change-in-production"  # 🔴 Made optional with default
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Captcha - 🔴 Made optional with default
    RECAPTCHA_SECRET_KEY: str = "dev-bypass-key"

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # CORS
    ALLOWED_ORIGINS: str = "https://marketa-web.vercel.app,http://localhost:3000"
    ALLOWED_HOSTS: str = "marketa-web.vercel.app,linker-on-vps.onrender.com,localhost"

    # Email - 🔴 Made optional with defaults for development
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "dev@example.com"
    SMTP_PASSWORD: str = "dev-password"
    FROM_EMAIL: str = "dev@example.com"

    # Storage - 🔴 Made optional with defaults (disabled by default)
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    S3_BUCKET: str = ""
    CLOUDFRONT_URL: str = ""

    # Security
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB
    ALLOWED_IMAGE_TYPES: str = "image/jpeg,image/png,image/webp"

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # URLs
    FRONTEND_URL: str = "https://marketa-web.vercel.app"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    @property
    def allowed_hosts_list(self) -> List[str]:
        return [h.strip() for h in self.ALLOWED_HOSTS.split(",") if h.strip()]

    @property
    def allowed_image_types_list(self) -> List[str]:
        return [t.strip() for t in self.ALLOWED_IMAGE_TYPES.split(",") if t.strip()]

    @property
    def aws_enabled(self) -> bool:
        """Check if AWS S3 is properly configured"""
        return bool(self.AWS_ACCESS_KEY_ID and self.AWS_SECRET_ACCESS_KEY and self.S3_BUCKET)

    @property
    def email_enabled(self) -> bool:
        """Check if email is properly configured"""
        return bool(self.SMTP_HOST and self.SMTP_USER and self.SMTP_PASSWORD and self.FROM_EMAIL)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# # backend/app/core/config.py
# from pydantic_settings import BaseSettings, SettingsConfigDict
# from typing import List, Optional

# class Settings(BaseSettings):
#     # App
#     ENVIRONMENT: str = "production"
#     SECRET_KEY: str
#     ALGORITHM: str = "HS256"
#     ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
#     REFRESH_TOKEN_EXPIRE_DAYS: int = 7

#     # Captcha
#     RECAPTCHA_SECRET_KEY: str


#     # Database
#     DATABASE_URL: str

#     # Redis
#     REDIS_URL: str = "redis://localhost:6379"

#     # CORS - Made optional to avoid parsing issues
#     ALLOWED_ORIGINS: Optional[str] = None  # Changed from List[str] to Optional[str]
#     ALLOWED_HOSTS: List[str] = ["https://*.vercel.app", "127.0.0.1"]

#     # Email
#     SMTP_HOST: str
#     SMTP_PORT: int = 587
#     SMTP_USER: str
#     SMTP_PASSWORD: str
#     FROM_EMAIL: str

#     # Storage
#     AWS_ACCESS_KEY_ID: str
#     AWS_SECRET_ACCESS_KEY: str
#     AWS_REGION: str = "us-east-1"
#     S3_BUCKET: str
#     CLOUDFRONT_URL: str = ""

#     # Security
#     MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB
#     ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]

#     # Rate Limiting
#     RATE_LIMIT_PER_MINUTE: int = 60

#     # URLs
#     FRONTEND_URL: str = "https://marketa-web.vercel.app"

#     model_config = SettingsConfigDict(
#         env_file=".env",
#         env_file_encoding="utf-8",
#         extra="ignore"  # Ignore extra environment variables
#     )

# settings = Settings()