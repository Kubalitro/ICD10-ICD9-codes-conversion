from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # API Settings
    PROJECT_NAME: str = "ICD Code Converter API"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://icd_user:icd_password@localhost:5432/icd_db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-secret-key-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # Stripe
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    
    # Rate Limiting by Subscription Tier
    FREE_TIER_DAILY_LIMIT: int = 100
    BASIC_TIER_DAILY_LIMIT: int = 1000
    PRO_TIER_DAILY_LIMIT: int = 10000
    ENTERPRISE_TIER_DAILY_LIMIT: int = 100000
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
