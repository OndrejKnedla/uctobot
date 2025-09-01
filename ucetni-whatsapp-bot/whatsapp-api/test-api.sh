#!/bin/bash

echo "🧪 Testing WhatsApp Business API"
echo "================================"

API_URL="http://localhost:3001"

# Test 1: Health check
echo "✅ Test 1: Health check"
curl -s "$API_URL/api/health" | head -c 50
echo -e "\n"

# Test 2: Basic stats
echo "✅ Test 2: Basic stats"
curl -s "$API_URL/api/stats" | head -c 100
echo -e "\n"

# Test 3: Webhook verification
echo "✅ Test 3: Webhook verification"
curl -s "$API_URL/api/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=uctobot-test-verify-token-2024"
echo -e "\n"

# Test 4: Send test message
echo "✅ Test 4: Send test WhatsApp message"
cat > test_msg.json << EOF
{
  "entry": [
    {
      "id": "test_entry",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "+420123456789",
              "phone_number_id": "test_phone_number_id"
            },
            "messages": [
              {
                "from": "+420111222333",
                "to": "+420123456789", 
                "id": "test_msg_$(date +%s)",
                "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
                "type": "text",
                "text": {
                  "body": "Testovací zpráva pro API"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
EOF

curl -s -X POST -H "Content-Type: application/json" -d @test_msg.json "$API_URL/api/webhook"
echo -e "\nMessage sent!"

# Test 5: Check user stats
echo "✅ Test 5: Check user stats"
curl -s "$API_URL/api/users/+420111222333/stats" | head -c 100
echo -e "\n"

# Test 6: CRON jobs status
echo "✅ Test 6: CRON jobs status"
curl -s "$API_URL/api/admin/jobs" | head -c 100
echo -e "\n"

rm -f test_msg.json

echo "🎉 Testing completed!"
echo "📊 Server is running at: $API_URL"
echo "📋 View logs with: docker-compose logs -f whatsapp-api"