# Login/Register System Debugging Guide

## 🔍 Step-by-Step Debugging Process

### Step 1: Test Backend Health
```bash
curl https://linker-on-vps.onrender.com/health
```

**Expected Response:**
```json
{"status": "healthy", "database": "connected"}
```

**If this fails:**
- Backend is not running or not accessible
- Check Render logs for startup errors
- Verify deployment was successful

### Step 2: Check Configuration
```bash
curl https://linker-on-vps.onrender.com/debug/config
```

**Expected Response:**
```json
{
  "environment": "production",
  "database_url": "postgresql+asyncpg://...",
  "secret_key": "...",
  "allowed_origins": ["https://marketa-web.vercel.app", ...],
  "email_enabled": false,
  "aws_enabled": false,
  "frontend_url": "https://marketa-web.vercel.app"
}
```

**What to Check:**
- `database_url` should be set (not null)
- `secret_key` should be set (not null)
- `allowed_origins` should include your Vercel URL
- `email_enabled` can be false (that's OK for testing)
- `aws_enabled` can be false (that's OK for testing)

### Step 3: Test Database Connection
```bash
curl https://linker-on-vps.onrender.com/debug/database
```

**Expected Response:**
```json
{"status": "connected", "result": 1}
```

**If this fails:**
- Database URL is incorrect
- Database is not accessible
- Check DATABASE_URL format

### Step 4: Test User Creation
```bash
curl https://linker-on-vps.onrender.com/debug/test-user
```

**Expected Response:**
```json
{
  "status": "created",
  "email": "debug@test.com",
  "id": "some-uuid-here"
}
```

**If this fails:**
- Database schema issue
- Permission issue
- Check backend logs for specific error

### Step 5: Test Registration
```bash
curl -X POST https://linker-on-vps.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123",
    "captcha_token": "dev-bypass-token"
  }'
```

**Expected Response:**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user_id": "some-uuid-here"
}
```

**Common Errors:**
- `400 Bad Request`: Validation error (check password requirements)
- `409 Conflict`: Email already registered
- `500 Internal Server Error`: Database or configuration issue

### Step 6: Test Login
```bash
curl -X POST https://linker-on-vps.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Common Errors:**
- `401 Unauthorized`: Invalid email or password
- `403 Forbidden`: Account disabled or email not verified
- `500 Internal Server Error`: Database or configuration issue

## 🐛 Common Issues and Solutions

### Issue 1: "Network Error" in Frontend
**Symptoms:**
- Frontend shows "Network Error"
- Browser console shows CORS errors
- No response from backend

**Solutions:**
1. Check backend health: `curl https://linker-on-vps.onrender.com/health`
2. Check CORS configuration in backend logs
3. Verify frontend URL is in allowed origins
4. Check browser console for specific CORS errors

### Issue 2: "500 Internal Server Error"
**Symptoms:**
- Backend returns 500 error
- Registration or login fails
- Error in backend logs

**Solutions:**
1. Check Render logs for specific error
2. Test database connection: `curl https://linker-on-vps.onrender.com/debug/database`
3. Check configuration: `curl https://linker-on-vps.onrender.com/debug/config`
4. Verify all required environment variables are set

### Issue 3: "Email already registered"
**Symptoms:**
- Registration returns 400 error
- Message: "Email already registered"

**Solutions:**
1. Use a different email address
2. Check database for existing users
3. Clear test users from database

### Issue 4: "Invalid email or password"
**Symptoms:**
- Login returns 401 error
- Message: "Invalid email or password"

**Solutions:**
1. Verify email is correct
2. Verify password is correct
3. Check if user exists in database
4. Check if user is email verified

### Issue 5: "Please verify your email before logging in"
**Symptoms:**
- Login returns 403 error
- Message about email verification

**Solutions:**
1. Check backend logs for verification URL
2. Use verification URL to verify email
3. Or use debug test user (auto-verified)

## 📋 Required Environment Variables

### Backend (Render) - MUST HAVE:
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/dbname
SECRET_KEY=your-secret-key-here
```

### Optional Variables (have defaults):
```bash
# Email (optional, will work without)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com

# AWS (optional, will work without)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET=

# CAPTCHA (optional, has default)
RECAPTCHA_SECRET_KEY=dev-bypass-key
```

### Frontend (Vercel) - OPTIONAL:
```bash
NEXT_PUBLIC_API_URL=https://linker-on-vps.onrender.com/api/v1
```

## 🔧 How to Find Verification URLs

### Check Backend Logs:
1. Go to Render dashboard
2. Select your backend service
3. Click "Logs" tab
4. Look for lines like:
   ```
   🔗🔗🔗 VERIFICATION URL: https://marketa-web.vercel.app/verify-email?token=abc123
   📧 Email: testuser@example.com
   🎫 Token: abc123
   ```

### Manual Verification:
1. Copy the verification URL from logs
2. Paste in browser
3. Email will be verified
4. You can then login

## 🧪 Complete Testing Flow

### 1. Test Backend Health:
```bash
curl https://linker-on-vps.onrender.com/health
```

### 2. Test Configuration:
```bash
curl https://linker-on-vps.onrender.com/debug/config
```

### 3. Test Database:
```bash
curl https://linker-on-vps.onrender.com/debug/database
```

### 4. Test User Creation:
```bash
curl https://linker-on-vps.onrender.com/debug/test-user
```

### 5. Test Registration:
```bash
curl -X POST https://linker-on-vps.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123","captcha_token":"dev-bypass-token"}'
```

### 6. Test Login:
```bash
curl -X POST https://linker-on-vps.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'
```

## 📊 What to Check in Render Logs

### Startup Messages:
```
Starting up...
✅ Database connected successfully!
✅ Database tables created/verified!
```

### Registration Messages:
```
🤖 CAPTCHA: TEMPORARILY DISABLED (action: register)
🔗🔗🔗 VERIFICATION URL: https://marketa-web.vercel.app/verify-email?token=abc123
📧 Email: test@example.com
🎫 Token: abc123
⚠️ Email not configured - User can verify using URL above
```

### Login Messages:
```
⚠️ User test@example.com logging in without email verification (testing mode)
```

## 🚨 If Nothing Works

### 1. Check Deployment Status:
- Go to Render dashboard
- Check if backend is deployed
- Check if deployment was successful
- Look for deployment errors

### 2. Check Environment Variables:
- Verify DATABASE_URL is set correctly
- Verify SECRET_KEY is set correctly
- Check for any typos in variable names

### 3. Check Database:
- Verify database is accessible
- Test database connection manually
- Check database permissions

### 4. Check Code:
- Verify latest code is deployed
- Check for any syntax errors
- Check for any import errors

### 5. Check Network:
- Verify backend URL is correct
- Check for any network issues
- Test with curl commands

## ✅ Success Criteria

System is working when:
- ✅ Backend health check passes
- ✅ Configuration check shows all required vars
- ✅ Database connection works
- ✅ Registration returns 201 status
- ✅ Login returns tokens
- ✅ No errors in backend logs
- ✅ No errors in browser console

## 📞 Getting Help

### Provide This Information:
1. Backend health response
2. Configuration check response
3. Database check response
4. Registration error message
5. Login error message
6. Backend logs (last 20 lines)
7. Browser console errors

### Common Debug Commands:
```bash
# Test all endpoints
curl https://linker-on-vps.onrender.com/health
curl https://linker-on-vps.onrender.com/debug/config
curl https://linker-on-vps.onrender.com/debug/database
curl https://linker-on-vps.onrender.com/debug/test-user

# Test registration
curl -X POST https://linker-on-vps.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123","captcha_token":"dev-bypass-token"}'

# Test login
curl -X POST https://linker-on-vps.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'
```

## 🎯 Quick Fix Checklist

- [ ] Backend is deployed and running
- [ ] DATABASE_URL is set correctly
- [ ] SECRET_KEY is set correctly
- [ ] Backend health check passes
- [ ] Database connection works
- [ ] Registration works via curl
- [ ] Login works via curl
- [ ] No errors in backend logs
- [ ] No CORS errors in browser
- [ ] Frontend can connect to backend

Run these commands in order to identify where the issue is!