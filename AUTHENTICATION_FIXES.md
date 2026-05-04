# Authentication Issues and Fixes

## Issues Found:

### 1. **CORS Configuration** ❌
- **Problem**: Backend CORS doesn't include Vercel frontend URL
- **Impact**: Frontend cannot make requests to backend
- **Fix**: Added `https://marketa-web.vercel.app` and `https://*.vercel.app` to allowed origins

### 2. **Email Verification Required** ⚠️
- **Problem**: Login endpoint requires email verification before allowing login
- **Impact**: Users cannot login until they verify their email
- **Status**: This is intentional security feature, but users need to be informed

### 3. **reCAPTCHA Configuration** ⚠️
- **Problem**: reCAPTCHA site key might not be configured for production
- **Impact**: Registration might fail if reCAPTCHA verification fails
- **Fix**: Ensure `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set in Vercel environment variables

## Configuration Updates Needed:

### Backend (Render):
1. ✅ **CORS Configuration**: Updated to include Vercel domains
2. ✅ **Environment Variables**: Ensure all required env vars are set

### Frontend (Vercel):
1. ✅ **API URL**: Set to `https://linker-on-vps.onrender.com/api/v1`
2. ⚠️ **reCAPTCHA Site Key**: Need to set `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`

## Authentication Flow:

### Registration Flow:
1. User fills registration form
2. reCAPTCHA verification (if configured)
3. Backend creates user with `UserRole.USER`
4. Backend sends verification email
5. User must click verification link
6. User can then login

### Login Flow:
1. User enters credentials
2. Backend validates email/password
3. Backend checks email verification status
4. If verified, returns access and refresh tokens
5. Frontend stores tokens in localStorage
6. Frontend redirects to dashboard or home

## Next Steps:

1. **Deploy Backend Changes**: Push CORS fix to Render
2. **Configure Vercel Environment Variables**:
   - `NEXT_PUBLIC_API_URL=https://linker-on-vps.onrender.com/api/v1`
   - `NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key`
3. **Test Registration**: Register a new user and check email verification
4. **Test Login**: Login with verified credentials
5. **Test Token Refresh**: Check if token refresh works properly

## Common Issues:

### Login Fails:
- Check if email is verified
- Check CORS configuration
- Check API URL is correct
- Check browser console for errors

### Registration Fails:
- Check reCAPTCHA configuration
- Check password requirements (8+ chars, uppercase, lowercase, number)
- Check if email already exists
- Check CORS configuration

### Token Issues:
- Check if tokens are stored in localStorage
- Check if token refresh logic is working
- Check if tokens are expired
- Check CORS configuration

## Security Notes:

- Email verification is **required** before login
- reCAPTCHA v3 is used for bot protection
- JWT tokens are used for authentication
- Token refresh is automatic on 401 errors
- Passwords are hashed using bcrypt