# backend/app/services/email.py


import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import settings

async def send_email(to_email: str, subject: str, html_body: str):
    """Send email via SMTP"""
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = settings.FROM_EMAIL
    msg['To'] = to_email
    
    html_part = MIMEText(html_body, 'html')
    msg.attach(html_part)
    
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
            print(f"✅ Email sent successfully to {to_email}")
    except Exception as e:
        print(f"❌ Email failed: {str(e)}")
        # Still log the verification URL for development
        print(f"📧 To: {to_email}, Subject: {subject}")

async def send_verification_email(to_email: str, token: str):
    """Send email verification link"""
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    
    print(f"🔗 Verification URL: {verification_url}")  # Keep for debugging
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                       color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9fafb; padding: 30px; }}
            .button {{ 
                display: inline-block;
                padding: 14px 28px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white !important;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                margin: 20px 0;
            }}
            .footer {{ background: #e5e7eb; padding: 20px; text-align: center; 
                       font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }}
            .link {{ color: #667eea; word-break: break-all; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1> Hello Welcome to Linker!</h1>
            </div>
            <div class="content">
                <h2>Verify Your Email Address</h2>
                <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
                <center>
                    <a href="{verification_url}" class="button">Verify Email Address</a>
                </center>
                <p style="margin-top: 30px;">Or copy and paste this link in your browser:</p>
                <p class="link">{verification_url}</p>
                <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                    ⏰ This link will expire in 24 hours.
                </p>
            </div>
            <div class="footer">
                <p>If you didn't create an account, please ignore this email.</p>
                <p>© 2026 Marketplace. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    await send_email(to_email, "Verify Your Email - Linker", html)

async def send_password_reset_email(to_email: str, token: str):
    """Send password reset link"""
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    print(f"🔗 Password Reset URL: {reset_url}")
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); 
                       color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9fafb; padding: 30px; }}
            .button {{ 
                display: inline-block;
                padding: 14px 28px;
                background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
                color: white !important;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                margin: 20px 0;
            }}
            .footer {{ background: #e5e7eb; padding: 20px; text-align: center; 
                       font-size: 12px; color: #6b7280; border-radius: 0 0 10px 10px; }}
            .link {{ color: #f59e0b; word-break: break-all; }}
            .warning {{ background: #fef3c7; border-left: 4px solid #f59e0b; 
                        padding: 15px; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
                <h2>Reset Your Password</h2>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <center>
                    <a href="{reset_url}" class="button">Reset Password</a>
                </center>
                <p style="margin-top: 30px;">Or copy and paste this link in your browser:</p>
                <p class="link">{reset_url}</p>
                <div class="warning">
                    <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour for your security.
                </div>
            </div>
            <div class="footer">
                <p>If you didn't request a password reset, please ignore this email or contact support if you're concerned.</p>
                <p>© 2026 Marketplace. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    await send_email(to_email, "Reset Your Password - Marketplace", html)









# backend/app/services/email.py



# import smtplib
# from email.mime.text import MIMEText
# from email.mime.multipart import MIMEMultipart

# from app.core.config import settings

# async def send_email(to_email: str, subject: str, html_body: str):
#     """
#     Send email via SMTP
#     """
#     msg = MIMEMultipart('alternative')
#     msg['Subject'] = subject
#     msg['From'] = settings.FROM_EMAIL
#     msg['To'] = to_email
    
#     html_part = MIMEText(html_body, 'html')
#     msg.attach(html_part)
    
#     try:
#         with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
#             server.starttls()
#             server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
#             server.send_message(msg)
#             print(f"✅ Email sent to {to_email}")
#     except Exception as e:
#         # For development, just print the error and continue
#         print(f"⚠️ Email not sent (SMTP not configured): {str(e)}")
#         print(f"📧 Would have sent to: {to_email}")
#         print(f"📧 Subject: {subject}")
#         # Don't raise the exception - let registration continue
#         # raise


# async def send_verification_email(to_email: str, token: str):
#     """
#     Send email verification link
#     """
#     verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    
#     # Print for development
#     print(f"🔗 Verification URL: {verification_url}")
    
#     html = f"""
#     <!DOCTYPE html>
#     <html>
#     <head>
#         <style>
#             body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
#             .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
#             .button {{ 
#                 display: inline-block;
#                 padding: 12px 24px;
#                 background-color: #4F46E5;
#                 color: white;
#                 text-decoration: none;
#                 border-radius: 6px;
#                 margin: 20px 0;
#             }}
#         </style>
#     </head>
#     <body>
#         <div class="container">
#             <h2>Verify Your Email</h2>
#             <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
#             <a href="{verification_url}" class="button">Verify Email</a>
#             <p>Or copy and paste this link in your browser:</p>
#             <p>{verification_url}</p>
#             <p>This link will expire in 24 hours.</p>
#             <p>If you didn't create an account, please ignore this email.</p>
#         </div>
#     </body>
#     </html>
#     """
    
#     await send_email(to_email, "Verify Your Email", html)


# async def send_password_reset_email(to_email: str, token: str):
#     """
#     Send password reset link
#     """
#     reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
#     # Print for development
#     print(f"🔗 Password Reset URL: {reset_url}")
    
#     html = f"""
#     <!DOCTYPE html>
#     <html>
#     <head>
#         <style>
#             body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
#             .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
#             .button {{ 
#                 display: inline-block;
#                 padding: 12px 24px;
#                 background-color: #4F46E5;
#                 color: white;
#                 text-decoration: none;
#                 border-radius: 6px;
#                 margin: 20px 0;
#             }}
#         </style>
#     </head>
#     <body>
#         <div class="container">
#             <h2>Reset Your Password</h2>
#             <p>We received a request to reset your password. Click the button below to create a new password:</p>
#             <a href="{reset_url}" class="button">Reset Password</a>
#             <p>Or copy and paste this link in your browser:</p>
#             <p>{reset_url}</p>
#             <p>This link will expire in 1 hour.</p>
#             <p>If you didn't request a password reset, please ignore this email.</p>
#         </div>
#     </body>
#     </html>
#     """
    
#     await send_email(to_email, "Reset Your Password", html)












# # backend/app/services/email.py









# import smtplib
# from email.mime.text import MIMEText
# from email.mime.multipart import MIMEMultipart

# from app.core.config import settings

# async def send_email(to_email: str, subject: str, html_body: str):
#     """
#     Send email via SMTP
#     """
#     msg = MIMEMultipart('alternative')
#     msg['Subject'] = subject
#     msg['From'] = settings.FROM_EMAIL
#     msg['To'] = to_email
    
#     html_part = MIMEText(html_body, 'html')
#     msg.attach(html_part)
    
#     try:
#         with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
#             server.starttls()
#             server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
#             server.send_message(msg)
#     except Exception as e:
#         print(f"Failed to send email: {str(e)}")
#         raise


# async def send_verification_email(to_email: str, token: str):
#     """
#     Send email verification link
#     """
#     verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    
#     html = f"""
#     <!DOCTYPE html>
#     <html>
#     <head>
#         <style>
#             body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
#             .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
#             .button {{ 
#                 display: inline-block;
#                 padding: 12px 24px;
#                 background-color: #4F46E5;
#                 color: white;
#                 text-decoration: none;
#                 border-radius: 6px;
#                 margin: 20px 0;
#             }}
#         </style>
#     </head>
#     <body>
#         <div class="container">
#             <h2>Verify Your Email</h2>
#             <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
#             <a href="{verification_url}" class="button">Verify Email</a>
#             <p>Or copy and paste this link in your browser:</p>
#             <p>{verification_url}</p>
#             <p>This link will expire in 24 hours.</p>
#             <p>If you didn't create an account, please ignore this email.</p>
#         </div>
#     </body>
#     </html>
#     """
    
#     await send_email(to_email, "Verify Your Email", html)


# async def send_password_reset_email(to_email: str, token: str):
#     """
#     Send password reset link
#     """
#     reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
#     html = f"""
#     <!DOCTYPE html>
#     <html>
#     <head>
#         <style>
#             body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
#             .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
#             .button {{ 
#                 display: inline-block;
#                 padding: 12px 24px;
#                 background-color: #4F46E5;
#                 color: white;
#                 text-decoration: none;
#                 border-radius: 6px;
#                 margin: 20px 0;
#             }}
#         </style>
#     </head>
#     <body>
#         <div class="container">
#             <h2>Reset Your Password</h2>
#             <p>We received a request to reset your password. Click the button below to create a new password:</p>
#             <a href="{reset_url}" class="button">Reset Password</a>
#             <p>Or copy and paste this link in your browser:</p>
#             <p>{reset_url}</p>
#             <p>This link will expire in 1 hour.</p>
#             <p>If you didn't request a password reset, please ignore this email.</p>
#         </div>
#     </body>
#     </html>
#     """
    
#     await send_email(to_email, "Reset Your Password", html)
