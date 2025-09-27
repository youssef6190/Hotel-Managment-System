from pydantic_settings import BaseSettings
import secrets
from typing import Optional

class Settings(BaseSettings):
    # Generate a secure random key if not provided in environment
    JWT_SECRET_KEY: str = secrets.token_urlsafe(32)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10000
    REFRESH_TOKEN_EXPIRE_DAYS: int = 13
    
    # Additional security settings
    TOKEN_BLACKLIST_ENABLED: bool = True
    SECURE_COOKIES: bool = True
    COOKIE_DOMAIN: Optional[str] = None
    COOKIE_MAX_AGE: int = 1800  # 30 minutes in seconds

    class Config:
        env_file = ".env"
        env_prefix = "JWT_"  # Environment variables will be prefixed with JWT_

settings = Settings()
