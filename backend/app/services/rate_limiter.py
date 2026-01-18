
# backend/app/services/rate_limiter.py
from fastapi import Request, HTTPException
from datetime import datetime, timedelta
import redis.asyncio as redis

from app.core.config import settings

class RateLimiter:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    async def check_rate_limit(
        self,
        request: Request,
        max_requests: int = 60,
        window_seconds: int = 60
    ) -> bool:
        """
        Check if request is within rate limit
        Returns True if allowed, raises HTTPException if exceeded
        """
        client_ip = request.client.host
        key = f"rate_limit:{client_ip}"
        
        current = await self.redis.get(key)
        
        if current is None:
            await self.redis.setex(key, window_seconds, 1)
            return True
        
        current_count = int(current)
        
        if current_count >= max_requests:
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again later."
            )
        
        await self.redis.incr(key)
        return True