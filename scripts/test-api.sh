#!/bin/bash
set -e

echo "🧪 Testování ÚčetníBot API..."
echo "================================"

API_URL="http://localhost:8000"

# Test 1: Health check
echo -n "1. Health check: "
HEALTH_RESPONSE=$(curl -s $API_URL/health)
if echo $HEALTH_RESPONSE | grep -q "running\|healthy"; then
    echo "✅ OK"
else
    echo "❌ FAIL: $HEALTH_RESPONSE"
fi

# Test 2: Basic API endpoint
echo -n "2. Basic API endpoint: "
API_RESPONSE=$(curl -s $API_URL/api)
if echo $API_RESPONSE | grep -q "aktivní"; then
    echo "✅ OK"
else
    echo "❌ FAIL: $API_RESPONSE"
fi

# Test 3: Static files
echo -n "3. Static files serving: "
STATIC_RESPONSE=$(curl -s -I $API_URL/static/placeholder-logo.svg | head -1)
if echo $STATIC_RESPONSE | grep -q "200"; then
    echo "✅ OK"
else
    echo "❌ FAIL: $STATIC_RESPONSE"
fi

# Test 4: Frontend zdraví
echo -n "4. Frontend accessibility: "
FRONTEND_RESPONSE=$(curl -s -I http://localhost:3000 | head -1)
if echo $FRONTEND_RESPONSE | grep -q "200"; then
    echo "✅ OK"
else
    echo "❌ FAIL: $FRONTEND_RESPONSE"
fi

# Test 5: CORS headers
echo -n "5. CORS configuration: "
CORS_RESPONSE=$(curl -s -H "Origin: http://localhost:3000" -I $API_URL/api | grep -i "access-control-allow")
if [ ! -z "$CORS_RESPONSE" ]; then
    echo "✅ OK"
else
    echo "❌ FAIL: No CORS headers"
fi

# Test 6: Database connection (indirect)
echo -n "6. Database (SQLite): "
if [ -f "/home/asznee/mvp-ucetni/ucetni-whatsapp-bot/ucetni_bot.db" ]; then
    echo "✅ OK - Database file exists"
else
    echo "❌ FAIL: Database file not found"
fi

# Test 7: Environment variables
echo -n "7. Environment variables: "
ENV_CHECK=0
if grep -q "GROQ_API_KEY=gsk_" /home/asznee/mvp-ucetni/ucetni-whatsapp-bot/.env; then
    ((ENV_CHECK++))
fi
if grep -q "TWILIO_ACCOUNT_SID=AC" /home/asznee/mvp-ucetni/ucetni-whatsapp-bot/.env; then
    ((ENV_CHECK++))
fi
if grep -q "STRIPE_SECRET_KEY=sk_test_" /home/asznee/mvp-ucetni/ucetni-whatsapp-bot/.env; then
    ((ENV_CHECK++))
fi

if [ $ENV_CHECK -eq 3 ]; then
    echo "✅ OK - All key APIs configured"
else
    echo "⚠️  PARTIAL - $ENV_CHECK/3 API keys configured"
fi

# Test 8: API Documentation
echo -n "8. API Documentation: "
DOCS_RESPONSE=$(curl -s -I $API_URL/docs | head -1)
if echo $DOCS_RESPONSE | grep -q "200"; then
    echo "✅ OK - Swagger docs available"
else
    echo "❌ FAIL: $DOCS_RESPONSE"
fi

# Test 9: WhatsApp endpoint (mock test)
echo -n "9. WhatsApp webhook endpoint: "
WEBHOOK_RESPONSE=$(curl -s -X POST $API_URL/webhook/whatsapp \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "Body=test&From=whatsapp:+420777123456&To=whatsapp:+14155238886" \
    2>/dev/null)
# Just check if endpoint responds (it will likely fail without proper auth, but shouldn't crash)
if [ $? -eq 0 ]; then
    echo "✅ OK - Endpoint responding"
else
    echo "❌ FAIL - Endpoint not accessible"
fi

echo ""
echo "📊 Testování dokončeno!"
echo ""
echo "📋 Rychlé odkazy:"
echo "🌐 Frontend:     http://localhost:3000"
echo "🔧 Backend API:  http://localhost:8000"
echo "📚 API Docs:     http://localhost:8000/docs"
echo "❤️  Health:       http://localhost:8000/health"
echo ""
echo "🔍 Pro monitoring spusť: ./scripts/monitor.sh"