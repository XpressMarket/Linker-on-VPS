@echo off
echo 🔍 Backend Connection Test Script
echo ==================================
echo.

echo 📡 Test 1: Backend Health Endpoint
echo ------------------------------------
curl -s https://linker-on-vps.onrender.com/health
echo.
echo.

echo 📡 Test 2: Backend Root Endpoint
echo ------------------------------------
curl -s https://linker-on-vps.onrender.com/
echo.
echo.

echo 📝 Test 3: Registration Endpoint
echo ------------------------------------
set TIMESTAMP=%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set TEST_EMAIL=test%TIMESTAMP%@example.com

echo Testing with email: %TEST_EMAIL%
curl -X POST https://linker-on-vps.onrender.com/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"%TEST_EMAIL%\", \"password\": \"TestPass123\", \"captcha_token\": \"dev-bypass-token\"}"
echo.
echo.

echo 📚 Test 4: API Documentation Check
echo ------------------------------------
curl -s -I https://linker-on-vps.onrender.com/api/docs
echo.
echo.

echo ✅ Tests Complete!
echo.
echo 📋 Next Steps:
echo 1. Check the responses above
echo 2. Look for any error messages
echo 3. Verify all tests return 200 status codes
echo 4. Check Render logs if any tests fail
echo.
echo 🔗 Useful Links:
echo - Backend: https://linker-on-vps.onrender.com
echo - API Docs: https://linker-on-vps.onrender.com/api/docs
echo - Health: https://linker-on-vps.onrender.com/health
echo.
pause