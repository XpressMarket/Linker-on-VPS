# Render Deployment Fixes

## ✅ Issues Fixed:

### 1. **Configuration Parsing Error** ✅
- **Problem**: `ALLOWED_ORIGINS` was trying to parse a JSON array from environment variable, but the variable was empty or invalid
- **Error**: `json.decoder.JSONDecodeError: Expecting value: line 1 column 1 (char 0)`
- **Fix**: 
  - Changed `ALLOWED_ORIGINS` from `List[str]` to `Optional[str]` in config.py
  - Added `extra="ignore"` to SettingsConfigDict to ignore extra environment variables
  - Defined allowed origins directly in main.py instead of using environment variable

### 2. **CORS Configuration** ✅
- **Problem**: CORS wasn't properly configured for Vercel frontend
- **Fix**: Added explicit CORS origins in main.py:
  - `http://localhost:3000`
  - `https://chi-seems-few-hero.trycloudflare.com`
  - `https://*.trycloudflare.com`
  - `https://marketa-web.vercel.app`
  - `https://*.vercel.app`

## 📋 Configuration Changes:

### backend/app/core/config.py:
```python
# Changed from:
ALLOWED_ORIGINS: List[str] = ["https://marketa-web.vercel.app"]

# To:
ALLOWED_ORIGINS: Optional[str] = None  # Made optional to avoid parsing issues

# Added:
model_config = SettingsConfigDict(
    env_file=".env",
    env_file_encoding="utf-8",
    extra="ignore"  # Ignore extra environment variables
)
```

### backend/app/main.py:
```python
# Define allowed origins directly
allowed_origins = [
    "http://localhost:3000",
    "https://chi-seems-few-hero.trycloudflare.com",
    "https://*.trycloudflare.com",
    "https://marketa-web.vercel.app",
    "https://*.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
```

## 🚀 Next Steps:

### 1. **Deploy Backend Changes**:
- Push the configuration fixes to Render
- Monitor the deployment logs for any errors

### 2. **Verify Environment Variables**:
Make sure these are set in Render:
- `SECRET_KEY` (required)
- `DATABASE_URL` (required)
- `RECAPTCHA_SECRET_KEY` (required)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `FROM_EMAIL` (required for email)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET` (required for file uploads)

### 3. **Test Backend**:
- Check if backend starts successfully
- Test health endpoint: `https://linker-on-vps.onrender.com/health`
- Test API docs: `https://linker-on-vps.onrender.com/api/docs`

### 4. **Configure Vercel Frontend**:
Set these environment variables in Vercel:
- `NEXT_PUBLIC_API_URL=https://linker-on-vps.onrender.com/api/v1`
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key`

### 5. **Test Authentication Flow**:
- Test registration with email verification
- Test login with verified credentials
- Test token refresh mechanism
- Test CORS between frontend and backend

## 🔍 Troubleshooting:

### If Backend Still Fails:
1. Check Render logs for specific error messages
2. Verify all required environment variables are set
3. Check database connection string format
4. Verify Python version compatibility (3.14)

### If CORS Issues Persist:
1. Check browser console for CORS errors
2. Verify frontend URL matches allowed origins
3. Check if credentials are being sent correctly
4. Test API endpoints directly with curl/Postman

### If Authentication Fails:
1. Check if email verification is working
2. Verify reCAPTCHA configuration
3. Check JWT token generation and validation
4. Test token refresh mechanism

## 📝 Notes:

- The backend now uses hardcoded CORS origins for reliability
- Environment variable parsing is more lenient with `extra="ignore"`
- Email verification is required before login
- reCAPTCHA v3 is used for bot protection
- JWT tokens are used for authentication with automatic refresh

## ✅ Expected Behavior:

After deployment, you should see:
- Backend starts successfully without configuration errors
- Health endpoint returns `{"status": "healthy", "database": "connected"}`
- Frontend can communicate with backend via CORS
- Registration sends verification emails
- Login works with verified credentials
- Token refresh happens automatically on 401 errors