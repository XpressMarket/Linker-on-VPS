# backend/app/services/captcha.py
import httpx
from app.core.config import settings

async def verify_captcha(token: str, remote_ip: str) -> bool:
    """
    Verify CAPTCHA token with Google reCAPTCHA v3
    """

    # Dev bypass (intentional)
    if settings.ENVIRONMENT == "development":
        print("🤖 CAPTCHA: Bypassed in development mode")
        return True

    async with httpx.AsyncClient(timeout=5) as client:
        response = await client.post(
            "https://www.google.com/recaptcha/api/siteverify",
            data={
                "secret": settings.RECAPTCHA_SECRET_KEY,
                "response": token,
                "remoteip": remote_ip,
            },
        )

    result = response.json()

    # Defensive logging (recommended)
    if not result.get("success"):
        print("❌ CAPTCHA failed:", result)

    # v3 score-based verification
    return result.get("success", False) and result.get("score", 0) >= 0.5






# backend/app/services/captcha.py
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
