@echo off
echo ========================================
echo Login/Register System Debug Script
echo ========================================
echo.

echo [1/7] Testing Backend Health...
echo ----------------------------------------
curl -s https://linker-on-vps.onrender.com/health
echo.
echo.

echo [2/7] Testing Configuration...
echo ----------------------------------------
curl -s https://linker-on-vps.onrender.com/debug/config
echo.
echo.

echo [3/7] Testing Database Connection...
echo ----------------------------------------
curl -s https://linker-on-vps.onrender.com/debug/database
echo.
echo.

echo [4/7] Testing User Creation...
echo ----------------------------------------
curl -s https://linker-on-vps.onrender.com/debug/test-user
echo.
echo.

echo [5/7] Testing Registration...
echo ----------------------------------------
set TIMESTAMP=%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set TEST_EMAIL=test%TIMESTAMP%@example.com

echo Testing with email: %TEST_EMAIL%
curl -X POST https://linker-on-vps.onrender.com/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"%TEST_EMAIL%\", \"password\": \"TestPass123\", \"captcha_token\": \"dev-bypass-token\"}"
echo.
echo.

echo [6/7] Testing Login with Debug User...
echo ----------------------------------------
curl -X POST https://linker-on-vps.onrender.com/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"debug@test.com\", \"password\": \"TestPass123\"}"
echo.
echo.

echo [7/7] Testing Login with New User...
echo ----------------------------------------
curl -X POST https://linker-on-vps.onrender.com/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"%TEST_EMAIL%\", \"password\": \"TestPass123\"}"
echo.
echo.

echo ========================================
echo Debug Complete!
echo ========================================
echo.
echo 📋 Next Steps:
echo 1. Check the responses above
echo 2. Look for any error messages
echo 3. Check Render logs if any tests fail
echo 4. Look for verification URLs in logs
echo.
echo 🔗 Useful Links:
echo - Backend: https://linker-on-vps.onrender.com
echo - API Docs: https://linker-on-vps.onrender.com/api/docs
echo - Health: https://linker-on-vps.onrender.com/health
echo - Config: https://linker-on-vps.onrender.com/debug/config
echo.
pause