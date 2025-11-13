#!/bin/bash
# Diagnose 502 Bad Gateway error

echo "=== Neode 502 Diagnostic ==="
echo ""

echo "1. Checking if containers are running..."
docker ps | grep neode

echo ""
echo "2. Checking container health status..."
docker ps --format "table {{.Names}}\t{{.Status}}" | grep neode

echo ""
echo "3. Checking if port 9991 is accessible from host..."
curl -I http://localhost:9991 2>&1 | head -5

echo ""
echo "4. Checking neode-web logs (last 30 lines)..."
docker logs neode-web --tail 30

echo ""
echo "5. Checking neode-backend logs (last 30 lines)..."
docker logs neode-backend --tail 30

echo ""
echo "6. Testing connection from inside neode-web container..."
docker exec neode-web wget -O- http://localhost/health 2>&1 | head -5

echo ""
echo "7. Checking what's listening on port 9991..."
sudo netstat -tlnp | grep 9991 || sudo lsof -i :9991

echo ""
echo "=== Diagnostic Complete ==="

