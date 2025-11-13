#!/bin/bash
# Update OpenResty/Nginx configuration for Neode

echo "=== Finding OpenResty/Nginx Config ==="

# Find where neode.l484.com is configured
echo "Searching for neode.l484.com in nginx configs..."
CONFIG_FILE=$(sudo grep -rl "neode.l484.com" /etc/nginx/ /usr/local/openresty/nginx/conf/ /opt/nginx/conf/ 2>/dev/null | head -1)

if [ -z "$CONFIG_FILE" ]; then
    echo "❌ Could not find neode.l484.com in nginx config"
    echo ""
    echo "Please manually find your config:"
    echo "  sudo find /etc /usr/local /opt -name '*.conf' -exec grep -l 'neode.l484.com' {} \;"
    exit 1
fi

echo "✓ Found config: $CONFIG_FILE"
echo ""

# Backup
echo "Creating backup..."
sudo cp "$CONFIG_FILE" "${CONFIG_FILE}.backup.$(date +%s)"
echo "✓ Backup created"
echo ""

# Show current proxy_pass
echo "Current configuration:"
sudo grep -A5 "server_name.*neode.l484.com" "$CONFIG_FILE" | grep proxy_pass
echo ""

# Ask for confirmation
echo "This script will update proxy_pass to: http://localhost:9991"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled"
    exit 1
fi

# Update the config
echo "Updating proxy_pass to port 9991..."
sudo sed -i.bak 's|proxy_pass http://localhost:[0-9]*|proxy_pass http://localhost:9991|g' "$CONFIG_FILE"

echo "✓ Config updated"
echo ""

# Test config
echo "Testing nginx configuration..."
sudo nginx -t 2>&1 || sudo openresty -t 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Configuration valid!"
    echo ""
    read -p "Reload nginx now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo nginx -s reload 2>/dev/null || sudo openresty -s reload 2>/dev/null
        echo "✓ Nginx reloaded!"
        echo ""
        echo "✅ Done! Test at: https://neode.l484.com"
    fi
else
    echo ""
    echo "❌ Config test failed. Restoring backup..."
    sudo cp "${CONFIG_FILE}.backup."* "$CONFIG_FILE"
    echo "Backup restored. Please check the errors above."
fi

