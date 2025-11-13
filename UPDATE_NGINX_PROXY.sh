#!/bin/bash
# Update external nginx to proxy to new Caddy ports

echo "Updating nginx configuration for Neode..."

# Backup existing config
sudo cp /etc/nginx/sites-available/neode.l484.com /etc/nginx/sites-available/neode.l484.com.backup 2>/dev/null || true

# Create updated config
sudo tee /etc/nginx/sites-available/neode.l484.com > /dev/null <<'EOF'
# Neode Nginx Proxy Configuration
# Proxies to Caddy running in Docker on alternative ports

map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name neode.l484.com;
    
    # SSL Configuration (update paths to your certificates)
    ssl_certificate /etc/letsencrypt/live/neode.l484.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/neode.l484.com/privkey.pem;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Max upload size
    client_max_body_size 100M;
    
    # Proxy to Caddy on port 8443 (HTTPS)
    location / {
        proxy_pass https://localhost:8443;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        
        # SSL verification for backend
        proxy_ssl_verify off;
        
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
    server_name neode.l484.com;
    return 301 https://$server_name$request_uri;
}

# ATOB Proxy
server {
    listen 8102 ssl http2;
    server_name neode.l484.com;
    
    ssl_certificate /etc/letsencrypt/live/neode.l484.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/neode.l484.com/privkey.pem;
    
    location / {
        proxy_pass https://localhost:8102;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_ssl_verify off;
    }
}
EOF

# Test nginx config
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuration valid. Reloading nginx..."
    sudo nginx -s reload
    echo "✅ Done! Neode should now be accessible at https://neode.l484.com"
else
    echo "❌ Configuration error. Restoring backup..."
    sudo mv /etc/nginx/sites-available/neode.l484.com.backup /etc/nginx/sites-available/neode.l484.com 2>/dev/null
    echo "Please check the SSL certificate paths in the config."
fi

