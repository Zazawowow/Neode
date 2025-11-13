#!/bin/bash

echo "==================================="
echo "Neode Portainer Deployment Tester"
echo "==================================="
echo ""

# Check if containers are running
echo "1. Checking container status..."
docker ps --filter "name=neode" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Check backend health
echo "2. Testing backend health..."
BACKEND_HEALTH=$(docker exec neode-backend wget -qO- http://localhost:5959/health 2>&1)
if [ "$BACKEND_HEALTH" = "healthy" ]; then
    echo "✅ Backend health check: OK"
else
    echo "❌ Backend health check: FAILED"
    echo "   Response: $BACKEND_HEALTH"
fi
echo ""

# Check backend RPC endpoint
echo "3. Testing backend RPC directly..."
BACKEND_RPC=$(docker exec neode-backend wget -qO- --post-data='{"method":"server.echo","params":{"message":"test"}}' --header='Content-Type: application/json' http://localhost:5959/rpc/v1 2>&1)
if echo "$BACKEND_RPC" | grep -q '"result":"test"'; then
    echo "✅ Backend RPC: OK"
else
    echo "❌ Backend RPC: FAILED"
    echo "   Response: $BACKEND_RPC"
fi
echo ""

# Check frontend to backend connectivity
echo "4. Testing frontend → backend connectivity..."
FRONTEND_TO_BACKEND=$(docker exec neode-web wget -qO- http://neode-backend:5959/health 2>&1)
if [ "$FRONTEND_TO_BACKEND" = "healthy" ]; then
    echo "✅ Frontend can reach backend: OK"
else
    echo "❌ Frontend cannot reach backend: FAILED"
    echo "   Response: $FRONTEND_TO_BACKEND"
fi
echo ""

# Check nginx configuration
echo "5. Checking nginx configuration..."
docker exec neode-web nginx -t 2>&1
echo ""

# Check if /rpc/v1 location exists in nginx config
echo "6. Verifying nginx proxy configuration..."
if docker exec neode-web cat /etc/nginx/nginx.conf | grep -q "location.*rpc/v1"; then
    echo "✅ RPC proxy location found in nginx config"
    docker exec neode-web cat /etc/nginx/nginx.conf | grep -A 5 "location.*rpc/v1"
else
    echo "❌ RPC proxy location NOT found in nginx config"
fi
echo ""

# Test external RPC endpoint
echo "7. Testing external RPC endpoint..."
EXTERNAL_RPC=$(curl -s -X POST http://localhost:8100/rpc/v1 \
  -H "Content-Type: application/json" \
  -d '{"method":"server.echo","params":{"message":"test"}}')
if echo "$EXTERNAL_RPC" | grep -q '"result":"test"'; then
    echo "✅ External RPC: OK"
    echo "   Response: $EXTERNAL_RPC"
else
    echo "❌ External RPC: FAILED"
    echo "   Response: $EXTERNAL_RPC"
fi
echo ""

# Check backend logs for any errors
echo "8. Recent backend logs:"
docker logs neode-backend --tail 10
echo ""

# Check frontend logs for any errors
echo "9. Recent frontend logs:"
docker logs neode-web --tail 10 2>&1 | grep -i error || echo "   No errors found"
echo ""

echo "==================================="
echo "Diagnosis Complete"
echo "==================================="

