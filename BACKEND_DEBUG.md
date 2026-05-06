# Backend Connection Debugging

## 🔍 Testing Backend Connection

### 1. Test Backend Health Endpoint
```bash
curl https://linker-on-vps.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### 2. Test Backend Root Endpoint
```bash
curl https://linker-on-vps.onrender.com/
```

Expected response:
```json
{
  "message": "Marketplace API is running",
  "version": "1.0.0",
  "environment": "production"
}
```

### 3. Test API Documentation
```bash
curl https://linker-on-vps.onrender.com/api/docs
```

Should return HTML documentation page.

### 4. Test Registration Endpoint (Direct)
```bash
curl -X POST https://linker-on-vps.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "captcha_token": "dev-bypass-token"
  }'
```

Expected response:
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user_id": "uuid-here"
}
```

## 🐛 Common Issues and Solutions

### Issue 1: CORS Errors
**Symptoms**: Browser console shows CORS errors
**Solution**: Check that frontend URL is in allowed origins

### Issue 2: Backend Not Responding
**Symptoms**: Connection timeout or 503 errors
**Solution**: Check Render logs for startup errors

### Issue 3: Database Connection Issues
**Symptoms**: 500 errors with database messages
**Solution**: Verify DATABASE_URL environment variable

### Issue 4: CAPTCHA Verification Failed
**Symptoms**: 400 error "CAPTCHA verification failed"
**Solution**: Check that captcha.py bypass is working

### Issue 5: Email Already Registered
**Symptoms**: 400 error "Email already registered"
**Solution**: Use a different email address

## 📋 Frontend Debugging

### Check Environment Variables
```javascript
// In browser console:
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

### Check API Configuration
```javascript
// In browser console:
console.log('API Base URL:', 'https://linker-on-vps.onrender.com/api/v1');
```

### Test API Call Directly
```javascript
// In browser console:
fetch('https://linker-on-vps.onrender.com/health')
  .then(r => r.json())
  .then(console.log);
```

## 🔧 Backend Configuration Check

### Required Environment Variables (Render):
- `SECRET_KEY` - JWT signing key
- `DATABASE_URL` - PostgreSQL connection string
- `RECAPTCHA_SECRET_KEY` - reCAPTCHA secret (can be dummy for now)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `FROM_EMAIL` - Email settings
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET` - S3 settings

### CORS Configuration:
- Frontend URL: `https://marketa-web.vercel.app`
- Should be in allowed origins

## 🧪 Testing Registration Flow

### Step 1: Test Backend Health
```bash
curl https://linker-on-vps.onrender.com/health
```

### Step 2: Test Registration
```bash
curl -X POST https://linker-on-vps.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test123@example.com",
    "password": "TestPass123",
    "captcha_token": "dev-bypass-token"
  }'
```

### Step 3: Check Response
- Should return 201 status
- Should contain success message
- Should contain user_id

### Step 4: Test Login (if email verification is disabled)
```bash
curl -X POST https://linker-on-vps.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test123@example.com",
    "password": "TestPass123"
  }'
```

## 🚨 Error Messages and Solutions

### "Network Error"
- **Cause**: Backend not accessible
- **Solution**: Check backend status and CORS configuration

### "CAPTCHA verification failed"
- **Cause**: CAPTCHA not properly bypassed
- **Solution**: Verify captcha.py changes are deployed

### "Email already registered"
- **Cause**: Email already in database
- **Solution**: Use different email address

### "Invalid email or password"
- **Cause**: Wrong credentials or email not verified
- **Solution**: Check email verification status

### "Please verify your email before logging in"
- **Cause**: Email verification required
- **Solution**: Complete email verification process

## 📊 Monitoring

### Check Render Logs:
1. Go to Render dashboard
2. Select your backend service
3. View logs for any errors

### Check Browser Console:
1. Open browser DevTools
2. Go to Console tab
3. Look for CORS or network errors

### Check Network Tab:
1. Open browser DevTools
2. Go to Network tab
3. Look for failed requests

## ✅ Success Criteria

Backend is working correctly when:
- ✅ Health endpoint returns healthy status
- ✅ Registration endpoint returns 201 status
- ✅ No CORS errors in browser console
- ✅ Email verification is sent
- ✅ Login works with verified credentials