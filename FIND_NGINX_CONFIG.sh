#!/bin/bash
# Find nginx/openresty configuration

echo "=== Searching for Nginx/OpenResty Configuration ==="
echo ""

echo "1. Checking what's listening on port 443..."
sudo netstat -tlnp | grep :443 || sudo lsof -i :443
echo ""

echo "2. Finding nginx/openresty config directory..."
sudo nginx -V 2>&1 | grep -o "conf-path=[^ ]*" || sudo openresty -V 2>&1 | grep -o "conf-path=[^ ]*"
echo ""

echo "3. Searching for ALL nginx config files..."
sudo find / -name "nginx.conf" -o -name "openresty.conf" 2>/dev/null | head -10
echo ""

echo "4. Searching for proxy_pass directives..."
sudo find /etc /usr/local /opt /var -name "*.conf" -exec grep -l "proxy_pass.*localhost" {} \; 2>/dev/null | head -10
echo ""

echo "5. Checking for reverse proxy containers (Traefik, Nginx Proxy Manager)..."
docker ps | grep -iE "proxy|traefik|nginx.*manager|caddy"
echo ""

echo "6. Looking for any config mentioning port 8100 (old port)..."
sudo find /etc /usr/local /opt -name "*.conf" -exec grep -l "8100" {} \; 2>/dev/null | head -5
echo ""

echo "7. Checking OpenResty default config location..."
sudo ls -la /usr/local/openresty/nginx/conf/ 2>/dev/null || echo "Not found"
echo ""

echo "8. Searching for l484.com (parent domain)..."
sudo grep -r "l484.com" /etc /usr/local /opt 2>/dev/null | grep -v ".git" | head -10
echo ""

echo "=== Search Complete ==="

