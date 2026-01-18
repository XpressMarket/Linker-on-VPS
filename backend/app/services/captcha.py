# backend/app/services/captcha.py
import httpx
from app.core.config import settings

async def verify_captcha(token: str, remote_ip: str) -> bool:
    """
    Verify CAPTCHA token with Google reCAPTCHA v3
    For hCaptcha or Cloudflare Turnstile, adjust accordingly
    """
    # For development, you might want to bypass CAPTCHA
    if settings.ENVIRONMENT == "development":
        return True
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            'https://www.google.com/recaptcha/api/siteverify',
            data={
                'secret': settings.RECAPTCHA_SECRET_KEY,
                'response': token,
                'remoteip': remote_ip
            }
        )
        
        result = response.json()
        
        # For reCAPTCHA v3, check score
        return result.get('success', False) and result.get('score', 0) >= 0.5
