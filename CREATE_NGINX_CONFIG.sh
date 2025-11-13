#!/bin/bash
# Create Nginx/OpenResty configuration for Neode

echo "=== Creating Nginx Config for Neode ==="
echo ""

# Detect nginx type and config directory
if command -v openresty &> /dev/null; then
    NGINX_CMD="openresty"
    CONFIG_DIR="/usr/local/openresty/nginx/conf"
elif command -v nginx &> /dev/null; then
    NGINX_CMD="nginx"
    CONFIG_DIR="/etc/nginx"
else
    echo "❌ Neither nginx nor openresty found"
    exit 1
fi

echo "Detected: $NGINX_CMD"
echo "Config directory: $CONFIG_DIR"
echo ""

# Find where to put the config
if [ -d "$CONFIG_DIR/conf.d" ]; then
    CONFIG_FILE="$CONFIG_DIR/conf.d/neode.conf"
elif [ -d "$CONFIG_DIR/sites-available" ]; then
    CONFIG_FILE="$CONFIG_DIR/sites-available/neode.l484.com"
else
    CONFIG_FILE="$CONFIG_DIR/neode.conf"
    echo "⚠️  Creating config in: $CONFIG_DIR/neode.conf"
    echo "You may need to include this in your main nginx.conf"
fi

echo "Will create: $CONFIG_FILE"
echo ""

# Check for SSL certificates
if [ -f "/etc/letsencrypt/live/neode.l484.com/fullchain.pem" ]; then
    SSL_CERT="/etc/letsencrypt/live/neode.l484.com/fullchain.pem"
    SSL_KEY="/etc/letsencrypt/live/neode.l484.com/privkey.pem"
    echo "✓ Found Let's Encrypt certificates"
elif [ -f "/etc/ssl/certs/neode.l484.com.crt" ]; then
    SSL_CERT="/etc/ssl/certs/neode.l484.com.crt"
    SSL_KEY="/etc/ssl/private/neode.l484.com.key"
    echo "✓ Found SSL certificates in /etc/ssl"
else
    echo "⚠️  No SSL certificates found. Config will be HTTP only."
    echo "Run certbot to get HTTPS: sudo certbot --nginx -d neode.l484.com"
    SSL_CERT=""
fi

echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled"
    exit 1
fi

# Create the config
sudo tee "$CONFIG_FILE" > /dev/null <<'EOF'
# Neode Configuration
# WebSocket connection upgrade map
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

EOF

if [ -n "$SSL_CERT" ]; then
    # HTTPS Configuration
    sudo tee -a "$CONFIG_FILE" > /dev/null <<EOF
# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name neode.l484.com;
    
    # SSL Configuration
    ssl_certificate $SSL_CERT;
    ssl_certificate_key $SSL_KEY;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Max upload size
    client_max_body_size 100M;
    
    # Proxy to Neode container
    location / {
        proxy_pass http://localhost:9991;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$connection_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering off;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name neode.l484.com;
    return 301 https://\$server_name\$request_uri;
}
EOF
else
    # HTTP Only Configuration
    sudo tee -a "$CONFIG_FILE" > /dev/null <<'EOF'
# HTTP Server (Get SSL certificate for production!)
server {
    listen 80;
    listen [::]:80;
    server_name neode.l484.com;
    
    # Max upload size
    client_max_body_size 100M;
    
    # Proxy to Neode container
    location / {
        proxy_pass http://localhost:9991;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering off;
    }
}
EOF
fi

echo ""
echo "✓ Config created: $CONFIG_FILE"
echo ""

# Enable site if using sites-available/sites-enabled pattern
if [ -d "$CONFIG_DIR/sites-enabled" ]; then
    sudo ln -sf "$CONFIG_FILE" "$CONFIG_DIR/sites-enabled/"
    echo "✓ Enabled site"
fi

# Test configuration
echo "Testing nginx configuration..."
sudo $NGINX_CMD -t

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Configuration valid!"
    echo ""
    read -p "Reload nginx now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo $NGINX_CMD -s reload
        echo ""
        echo "✅ Done!"
        echo ""
        if [ -n "$SSL_CERT" ]; then
            echo "Test at: https://neode.l484.com"
        else
            echo "Test at: http://neode.l484.com"
            echo ""
            echo "To enable HTTPS, run:"
            echo "  sudo certbot --nginx -d neode.l484.com"
        fi
    fi
else
    echo ""
    echo "❌ Configuration test failed"
    echo "Removing config file..."
    sudo rm "$CONFIG_FILE"
    echo "Please check the errors above"
fi

