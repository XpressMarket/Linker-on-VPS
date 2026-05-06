#!/bin/bash

echo "🔍 Backend Connection Test Script"
echo "=================================="
echo ""

# Test 1: Backend Health
echo "📡 Test 1: Backend Health Endpoint"
echo "-----------------------------------"
curl -s https://linker-on-vps.onrender.com/health | jq '.' 2>/dev/null || curl -s https://linker-on-vps.onrender.com/health
echo ""
echo ""

# Test 2: Backend Root
echo "📡 Test 2: Backend Root Endpoint"
echo "-----------------------------------"
curl -s https://linker-on-vps.onrender.com/ | jq '.' 2>/dev/null || curl -s https://linker-on-vps.onrender.com/
echo ""
echo ""

# Test 3: Registration Test
echo "📝 Test 3: Registration Endpoint"
echo "-----------------------------------"
TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@example.com"

echo "Testing with email: $TEST_EMAIL"
curl -X POST https://linker-on-vps.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"TestPass123\",
    \"captcha_token\": \"dev-bypass-token\"
  }" | jq '.' 2>/dev/null || curl -X POST https://linker-on-vps.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"TestPass123\",
    \"captcha_token\": \"dev-bypass-token\"
  }"
echo ""
echo ""

# Test 4: API Documentation
echo "📚 Test 4: API Documentation"
echo "-----------------------------------"
curl -s -I https://linker-on-vps.onrender.com/api/docs | head -5
echo ""
echo ""

echo "✅ Tests Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Check the responses above"
echo "2. Look for any error messages"
echo "3. Verify all tests return 200 status codes"
echo "4. Check Render logs if any tests fail"
echo ""
echo "🔗 Useful Links:"
echo "- Backend: https://linker-on-vps.onrender.com"
echo "- API Docs: https://linker-on-vps.onrender.com/api/docs"
echo "- Health: https://linker-on-vps.onrender.com/health"