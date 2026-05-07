# Quick Start Guide - Backend & Frontend Integration

## 🎯 What's Been Fixed

### ✅ Backend Now Works With:
- **Only 1 Required Variable**: `DATABASE_URL`
- **No AWS/S3 Needed**: Uses local storage
- **No Email Config Needed**: Logs verification URLs
- **No CAPTCHA Config Needed**: Always passes
- **No Secret Key Needed**: Has default for testing

### ✅ Frontend Configuration:
- **API URL**: `https://linker-on-vps.onrender.com/api/v1`
- **CORS**: Configured for Vercel frontend
- **CAPTCHA**: Disabled with bypass token

## 🚀 Quick Testing

### 1. Test Backend Health:
```bash
curl https://linker-on-vps.onrender.com/health
```

### 2. Test Registration:
```bash
curl -X POST https://linker-on-vps.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123","captcha_token":"dev-bypass-token"}'
```

### 3. Test Login:
```bash
curl -X POST https://linker-on-vps.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'
```

## 📋 Required Environment Variables

### Backend (Render) - ONLY 1 REQUIRED:
```bash
DATABASE_URL=postgresql://user:pass@host:port/dbname
```

### Frontend (Vercel) - OPTIONAL:
```bash
NEXT_PUBLIC_API_URL=https://linker-on-vps.onrender.com/api/v1
```

## 🔍 How to Find Verification URLs

### Check Backend Logs:
1. Go to Render dashboard
2. Select your backend service
3. Click "Logs" tab
4. Look for lines like:
   ```
   🔗🔗🔗 VERIFICATION URL: https://marketa-web.vercel.app/verify-email?token=abc123
   ```

### Manual Verification:
1. Copy the verification URL from logs
2. Paste in browser
3. Email will be verified
4. You can then login

## 🧪 Testing Flow

### Complete Test:
1. **Register User** → Use frontend or curl
2. **Check Logs** → Find verification URL
3. **Verify Email** → Use URL from logs
4. **Login User** → Use frontend or curl
5. **Test Features** → Create products, upload images

## 📊 Current Features Status

### ✅ Working:
- User registration
- User login (without email verification)
- Token management
- Local file uploads
- CAPTCHA bypass
- Email URL logging
- CORS configuration

### ⚠️ Testing Mode:
- Email verification not required
- CAPTCHA verification disabled
- Email sending disabled
- Local storage only

## 🔄 Enabling Production Features

### When Ready for Production:

#### 1. Enable Email Verification:
In [backend/app/api/v1/auth.py](backend/app/api/v1/auth.py):
```python
# Uncomment this line:
raise HTTPException(status_code=403, detail="Please verify your email...")
```

#### 2. Enable CAPTCHA:
In [backend/app/services/captcha.py](backend/app/services/captcha.py):
```python
# Remove the bypass code at the beginning
# Uncomment the original verification logic
```

#### 3. Configure Email:
Set these environment variables in Render:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
```

#### 4. Configure AWS/S3:
Set these environment variables in Render:
```bash
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name
```

## 🐛 Common Issues

### "Network Error" in Frontend:
- **Cause**: Backend not accessible
- **Fix**: Check backend health endpoint
- **Check**: `https://linker-on-vps.onrender.com/health`

### "Email already registered":
- **Cause**: Email already in database
- **Fix**: Use different email address

### "Invalid email or password":
- **Cause**: Wrong credentials
- **Fix**: Check email and password are correct

### "CAPTCHA verification failed":
- **Cause**: CAPTCHA bypass not working
- **Fix**: Check captcha.py changes are deployed

## 📞 Getting Help

### If Something Doesn't Work:

1. **Check Backend Logs**:
   - Render dashboard → Backend service → Logs
   - Look for error messages

2. **Test Backend Directly**:
   - Use curl commands above
   - Check responses

3. **Check Browser Console**:
   - Open DevTools (F12)
   - Look for network/CORS errors

4. **Verify Environment Variables**:
   - DATABASE_URL is set in Render
   - NEXT_PUBLIC_API_URL is set in Vercel

## ✅ Success Checklist

- [ ] Backend health check passes
- [ ] Registration works via curl
- [ ] Login works via curl
- [ ] Frontend can connect to backend
- [ ] No CORS errors in browser
- [ ] Verification URLs appear in logs
- [ ] File uploads work locally

## 🎉 You're Ready to Test!

Your backend is now configured to work seamlessly with minimal setup. Just:

1. **Deploy** the changes to Render
2. **Set** only the DATABASE_URL
3. **Test** registration and login
4. **Check** logs for verification URLs
5. **Enjoy** seamless development!