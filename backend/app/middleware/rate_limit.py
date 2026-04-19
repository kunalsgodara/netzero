"""
Rate limiting middleware for API endpoints.
"""
import time
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import threading


class RateLimiter:
    """Simple in-memory rate limiter using sliding window."""
    
    def __init__(self, requests: int, window: int):
        """
        Args:
            requests: Maximum number of requests allowed
            window: Time window in seconds
        """
        self.requests = requests
        self.window = window
        self.clients: Dict[str, list] = defaultdict(list)
        self.lock = threading.Lock()
    
    def is_allowed(self, client_id: str) -> Tuple[bool, int]:
        """
        Check if request is allowed for client.
        
        Returns:
            Tuple of (is_allowed, retry_after_seconds)
        """
        now = time.time()
        
        with self.lock:
            # Remove expired timestamps
            self.clients[client_id] = [
                ts for ts in self.clients[client_id]
                if now - ts < self.window
            ]
            
            # Check if limit exceeded
            if len(self.clients[client_id]) >= self.requests:
                oldest = self.clients[client_id][0]
                retry_after = int(self.window - (now - oldest)) + 1
                return False, retry_after
            
            # Add current timestamp
            self.clients[client_id].append(now)
            return True, 0


# Rate limiters for different endpoint categories
auth_limiter = RateLimiter(requests=5, window=60)  # 5 requests per minute
otp_limiter = RateLimiter(requests=3, window=300)  # 3 requests per 5 minutes
csv_upload_limiter = RateLimiter(requests=10, window=3600)  # 10 requests per hour
deadlines_limiter = RateLimiter(requests=100, window=60)  # 100 requests per minute


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware to apply rate limiting to specific routes."""
    
    async def dispatch(self, request: Request, call_next):
        # Get client identifier (IP address)
        client_ip = request.client.host if request.client else "unknown"
        
        # Define rate-limited endpoints
        auth_endpoints = [
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/forgot-password",
        ]
        
        otp_endpoints = [
            "/api/auth/resend-otp",
            "/api/auth/verify-email",
            "/api/auth/verify-reset-otp",
            "/api/auth/reset-password",
        ]
        
        csv_upload_endpoints = [
            "/api/imports/bulk-csv",
        ]
        
        deadlines_endpoints = [
            "/api/deadlines",
            "/api/deadlines/next",
        ]
        
        path = request.url.path
        
        # Apply rate limiting
        if path in auth_endpoints:
            allowed, retry_after = auth_limiter.is_allowed(client_ip)
            if not allowed:
                raise HTTPException(
                    status_code=429,
                    detail=f"Too many requests. Please try again in {retry_after} seconds."
                )
        
        elif path in otp_endpoints:
            allowed, retry_after = otp_limiter.is_allowed(client_ip)
            if not allowed:
                raise HTTPException(
                    status_code=429,
                    detail=f"Too many OTP requests. Please try again in {retry_after} seconds."
                )
        
        elif path in csv_upload_endpoints:
            allowed, retry_after = csv_upload_limiter.is_allowed(client_ip)
            if not allowed:
                raise HTTPException(
                    status_code=429,
                    detail=f"CSV upload limit exceeded. Please try again in {retry_after} seconds."
                )
        
        elif any(path.startswith(endpoint) for endpoint in deadlines_endpoints):
            allowed, retry_after = deadlines_limiter.is_allowed(client_ip)
            if not allowed:
                raise HTTPException(
                    status_code=429,
                    detail=f"Too many deadline requests. Please try again in {retry_after} seconds."
                )
        
        response = await call_next(request)
        return response
