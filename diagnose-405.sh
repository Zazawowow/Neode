#!/bin/bash

echo "============================================"
echo "Diagnosing 405 Error Source"
echo "============================================"
echo ""

# Test 1: Direct to backend container
echo "Test 1: Backend container (direct)"
echo "-----------------------------------"
docker exec neode-backend wget -qO- --post-data='{"method":"server.echo","params":{"message":"test"}}' --header='Content-Type: application/json' http://localhost:5959/rpc/v1 2>&1
echo ""

# Test 2: Frontend to backend (internal)
echo "Test 2: Frontend → Backend (internal)"
echo "--------------------------------------"
docker exec neode-web wget -qO- --post-data='{"method":"server.echo","params":{"message":"test"}}' --header='Content-Type: application/json' http://neode-backend:5959/rpc/v1 2>&1
echo ""

# Test 3: Host to frontend container (bypassing reverse proxy)
echo "Test 3: Host → Container Port 8100"
echo "-----------------------------------"
curl -s -X POST http://localhost:8100/rpc/v1 \
  -H "Content-Type: application/json" \
  -d '{"method":"server.echo","params":{"message":"test"}}'
echo ""
echo ""

# Test 4: Through reverse proxy (where the error likely is)
echo "Test 4: Through Reverse Proxy (neode.l484.com)"
echo "------------------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST https://neode.l484.com/rpc/v1 \
  -H "Content-Type: application/json" \
  -d '{"method":"server.echo","params":{"message":"test"}}')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE")

echo "Status Code: $HTTP_CODE"
echo "Response Body: $BODY"
echo ""

if [ "$HTTP_CODE" = "405" ]; then
    echo "⚠️  405 ERROR CONFIRMED from reverse proxy!"
    echo ""
    echo "The problem is in your reverse proxy configuration, not the containers."
    echo ""
    echo "Possible causes:"
    echo "1. Cloudflare Tunnel blocking POST requests"
    echo "2. Traefik middleware blocking POST"
    echo "3. nginx reverse proxy in front of Portainer"
    echo "4. WAF (Web Application Firewall) rules"
    echo ""
elif [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Success! No 405 error."
else
    echo "⚠️  Unexpected status code: $HTTP_CODE"
fi

# Test 5: Check response headers from reverse proxy
echo ""
echo "Test 5: Response Headers from Reverse Proxy"
echo "--------------------------------------------"
curl -s -I -X POST https://neode.l484.com/rpc/v1 \
  -H "Content-Type: application/json"
echo ""

# Test 6: Check if it's a Cloudflare Tunnel
echo "Test 6: Checking for Cloudflare"
echo "--------------------------------"
if curl -s -I https://neode.l484.com | grep -i "cloudflare" > /dev/null; then
    echo "✅ Cloudflare detected"
    echo ""
    echo "⚠️  LIKELY CAUSE: Cloudflare may be blocking POST to /rpc/v1"
    echo ""
    echo "Solutions:"
    echo "1. Check Cloudflare WAF rules"
    echo "2. Add Page Rule to allow POST requests to /rpc/*"
    echo "3. Check Cloudflare Firewall events log"
else
    echo "❌ Not using Cloudflare"
fi
echo ""

echo "============================================"
echo "Summary"
echo "============================================"
echo ""
echo "If Test 1-3 succeed but Test 4 fails with 405:"
echo "  → The problem is in your reverse proxy/tunnel"
echo "  → NOT in the Docker containers"
echo ""
echo "If Test 1-3 also fail:"
echo "  → The problem is in the backend code"
echo "  → Need to fix mock-backend.js"
echo ""
echo "If all tests succeed:"
echo "  → The problem might be browser CORS"
echo "  → Check browser console for CORS errors"
echo ""

