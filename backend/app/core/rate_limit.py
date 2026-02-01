# backend/app/core/rate_limit.py
"""
Rate limiting middleware to prevent DDOS attacks
Uses in-memory storage (can be upgraded to Redis for production)
"""

from fastapi import Request, HTTPException
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, Tuple
import asyncio


class RateLimiter:
    """
    Simple in-memory rate limiter
    For production, use Redis-backed rate limiting
    """
    
    def __init__(self):
        # Store: {ip: [(timestamp, endpoint), ...]}
        self.requests: Dict[str, list] = defaultdict(list)
        self.lock = asyncio.Lock()
        
        # Rate limits by endpoint type
        self.limits = {
            'auth': (5, 60),      # 5 requests per minute for auth endpoints
            'api': (30, 60),      # 30 requests per minute for API endpoints
            'upload': (10, 60),   # 10 uploads per minute
        }
    
    async def check_rate_limit(
        self, 
        ip: str, 
        endpoint: str, 
        limit_type: str = 'api'
    ) -> Tuple[bool, int]:
        """
        Check if request is within rate limit
        
        Args:
            ip: Client IP address
            endpoint: Endpoint being accessed
            limit_type: Type of limit ('auth', 'api', 'upload')
        
        Returns:
            Tuple[bool, int]: (is_allowed, retry_after_seconds)
        """
        async with self.lock:
            now = datetime.now()
            max_requests, window_seconds = self.limits.get(limit_type, (30, 60))
            
            # Clean old requests
            cutoff = now - timedelta(seconds=window_seconds)
            self.requests[ip] = [
                (ts, ep) for ts, ep in self.requests[ip] 
                if ts > cutoff
            ]
            
            # Count requests in current window
            current_count = len(self.requests[ip])
            
            if current_count >= max_requests:
                # Calculate retry after
                oldest_request = min(self.requests[ip], key=lambda x: x[0])
                retry_after = int((oldest_request[0] + timedelta(seconds=window_seconds) - now).total_seconds())
                return False, max(retry_after, 1)
            
            # Add this request
            self.requests[ip].append((now, endpoint))
            return True, 0
    
    async def cleanup_old_entries(self):
        """
        Periodic cleanup of old entries (call this in background task)
        """
        while True:
            await asyncio.sleep(300)  # Clean every 5 minutes
            async with self.lock:
                now = datetime.now()
                cutoff = now - timedelta(minutes=10)
                
                # Remove IPs with no recent requests
                to_remove = []
                for ip, requests in self.requests.items():
                    self.requests[ip] = [
                        (ts, ep) for ts, ep in requests 
                        if ts > cutoff
                    ]
                    if not self.requests[ip]:
                        to_remove.append(ip)
                
                for ip in to_remove:
                    del self.requests[ip]
                
                print(f"🧹 Rate limiter cleanup: {len(to_remove)} IPs removed")


# Global rate limiter instance
rate_limiter = RateLimiter()


async def rate_limit_check(request: Request, limit_type: str = 'api'):
    """
    Dependency for rate limiting
    
    Usage:
        @router.post("/login", dependencies=[Depends(lambda r: rate_limit_check(r, 'auth'))])
    """
    client_ip = request.client.host if request.client else "unknown"
    endpoint = request.url.path
    
    is_allowed, retry_after = await rate_limiter.check_rate_limit(
        client_ip, 
        endpoint, 
        limit_type
    )
    
    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests. Please try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)}
        )
