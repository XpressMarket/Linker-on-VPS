# backend/app/services/captcha.py
"""
CAPTCHA verification service using Google reCAPTCHA v3
Includes score-based verification and bypass for development
"""

import httpx
from app.core.config import settings
from typing import Tuple


async def verify_captcha(token: str, remote_ip: str, action: str = "submit") -> Tuple[bool, float]:
    """
    Verify CAPTCHA token with Google reCAPTCHA v3
    
    Args:
        token: The reCAPTCHA token from frontend
        remote_ip: User's IP address
        action: The action name (e.g., 'login', 'register')
    
    Returns:
        Tuple[bool, float]: (is_valid, score)
        - is_valid: True if CAPTCHA passed
        - score: reCAPTCHA score (0.0 to 1.0, higher is better)
    """
    # Bypass CAPTCHA in development mode
    if settings.ENVIRONMENT == "development":
        print(f"🤖 CAPTCHA: Bypassed in development mode (action: {action})")
        return True, 1.0
    
    # Validate token exists
    if not token:
        print("❌ CAPTCHA: No token provided")
        return False, 0.0
    
    # Verify with Google reCAPTCHA API
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                'https://www.google.com/recaptcha/api/siteverify',
                data={
                    'secret': settings.RECAPTCHA_SECRET_KEY,
                    'response': token,
                    'remoteip': remote_ip
                }
            )
            
            result = response.json()
            
            # Debug logging
            print(f"🔐 CAPTCHA Response: {result}")
            
            # Check if verification was successful
            success = result.get('success', False)
            score = result.get('score', 0.0)
            action_verified = result.get('action', '') == action
            
            # reCAPTCHA v3 uses scores (0.0 - 1.0)
            # 0.0 = very likely a bot
            # 1.0 = very likely a human
            # Recommended threshold: 0.5
            
            # Additional checks
            if not success:
                error_codes = result.get('error-codes', [])
                print(f"❌ CAPTCHA Failed: {error_codes}")
                return False, 0.0
            
            if not action_verified:
                print(f"❌ CAPTCHA: Action mismatch (expected: {action}, got: {result.get('action')})")
                return False, score
            
            # Apply score threshold
            threshold = 0.5
            is_valid = score >= threshold
            
            if is_valid:
                print(f"✅ CAPTCHA Passed: score={score}, action={action}")
            else:
                print(f"⚠️ CAPTCHA: Low score ({score} < {threshold})")
            
            return is_valid, score
            
    except httpx.TimeoutException:
        print("❌ CAPTCHA: Timeout connecting to Google")
        return False, 0.0
    except Exception as e:
        print(f"❌ CAPTCHA Error: {str(e)}")
        return False, 0.0


async def verify_captcha_simple(token: str, remote_ip: str) -> bool:
    """
    Simple boolean CAPTCHA verification (backward compatible)
    """
    is_valid, _ = await verify_captcha(token, remote_ip)
    return is_valid


# # backend/app/services/captcha.py
# import httpx
# from app.core.config import settings


# async def verify_captcha(token: str, remote_ip: str) -> bool:
#     """
#     Verify CAPTCHA token with Google reCAPTCHA v3
#     """
#     # For development, bypass CAPTCHA
#     if settings.ENVIRONMENT == "development":
#         print("🤖 CAPTCHA: Bypassed in development mode")
#         return True
    
#     async with httpx.AsyncClient() as client:
#         response = await client.post(
#             'https://www.google.com/recaptcha/api/siteverify',
#             data={
#                 'secret': settings.RECAPTCHA_SECRET_KEY,
#                 'response': token,
#                 'remoteip': remote_ip
#             }
#         )
        
#         return True
#         result = response.json()
        
#         # For reCAPTCHA v3, check score
#         return result.get('success', False) and result.get('score', 0) >= 0.5






# backend/app/services/captcha.py
# import httpx
# from app.core.config import settings

# async def verify_captcha(token: str, remote_ip: str) -> bool:
#     """
#     Verify CAPTCHA token with Google reCAPTCHA v3
#     """

#     # Dev bypass (intentional)
#     if settings.ENVIRONMENT == "development":
#         print("🤖 CAPTCHA: Bypassed in development mode")
#         return True

#     async with httpx.AsyncClient(timeout=5) as client:
#         response = await client.post(
#             "https://www.google.com/recaptcha/api/siteverify",
#             data={
#                 "secret": settings.RECAPTCHA_SECRET_KEY,
#                 "response": token,
#                 "remoteip": remote_ip,
#             },
#         )

#     result = response.json()

#     # Defensive logging (recommended)
#     if not result.get("success"):
#         print("❌ CAPTCHA failed:", result)

#     # v3 score-based verification
#     return result.get("success", False) and result.get("score", 0) >= 0.5





