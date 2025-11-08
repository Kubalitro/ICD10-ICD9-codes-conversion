from datetime import datetime, timedelta
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from . import models
from .config import settings


class RateLimiter:
    """Rate limiter based on user subscription tier"""
    
    @staticmethod
    def get_daily_limit(tier: str) -> int:
        """Get daily limit based on subscription tier"""
        limits = {
            "free": settings.FREE_TIER_DAILY_LIMIT,
            "basic": settings.BASIC_TIER_DAILY_LIMIT,
            "pro": settings.PRO_TIER_DAILY_LIMIT,
            "enterprise": settings.ENTERPRISE_TIER_DAILY_LIMIT
        }
        return limits.get(tier, settings.FREE_TIER_DAILY_LIMIT)
    
    @staticmethod
    def get_usage_today(db: Session, user_id: int) -> int:
        """Get user's usage count for today"""
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        usage = db.query(func.sum(models.UsageLog.request_count)).filter(
            models.UsageLog.user_id == user_id,
            models.UsageLog.timestamp >= today_start
        ).scalar()
        
        return usage or 0
    
    @staticmethod
    def check_rate_limit(db: Session, user: models.User) -> dict:
        """Check if user has exceeded rate limit"""
        # Get user's subscription
        subscription = db.query(models.Subscription).filter(
            models.Subscription.user_id == user.id
        ).first()
        
        tier = subscription.tier if subscription else "free"
        daily_limit = RateLimiter.get_daily_limit(tier)
        current_usage = RateLimiter.get_usage_today(db, user.id)
        
        if current_usage >= daily_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Daily rate limit exceeded. Your {tier} plan allows {daily_limit} requests per day."
            )
        
        return {
            "tier": tier,
            "daily_limit": daily_limit,
            "current_usage": current_usage,
            "remaining": daily_limit - current_usage
        }
    
    @staticmethod
    def log_usage(db: Session, user_id: int, endpoint: str, api_key_id: Optional[int] = None):
        """Log API usage"""
        usage_log = models.UsageLog(
            user_id=user_id,
            api_key_id=api_key_id,
            endpoint=endpoint,
            request_count=1
        )
        db.add(usage_log)
        db.commit()
