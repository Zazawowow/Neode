# Nginx Configuration Instructions for Neode Production

## Overview

Your Neode deployment needs TWO nginx configurations:
1. **Internal nginx** (inside Docker container) - ✅ Already configured
2. **External nginx** (on host server) - ⚠️ Needs WebSocket support

## Problem

Currently seeing:
```
WebSocket connection to 'wss://neode.l484.com/ws/db' failed
```

This happens because your external nginx (handling SSL) isn't properly proxying WebSocket connections.

## Solution

### Step 1: Locate Your External Nginx Config

Your external nginx config is likely at:
- `/etc/nginx/sites-available/neode.l484.com`
- `/etc/nginx/conf.d/neode.conf`
- `/etc/nginx/nginx.conf`

Find it with:
```bash
# On your server
grep -r "neode.l484.com" /etc/nginx/
```

### Step 2: Add WebSocket Support

**Option A: If you have a dedicated config file for neode.l484.com**

Replace the entire file with `nginx-external-config.conf` (adjust SSL paths).

**Option B: If neode.l484.com is part of a larger config**

Add these sections to your existing server block:

```nginx
# Add to http block (top of file, outside server blocks)
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

# Add INSIDE your server block for neode.l484.com
server {
    listen 443 ssl http2;
    server_name neode.l484.com;
    
    # ... your existing SSL config ...
    
    # ADD THIS: WebSocket location block
    location /ws {
        proxy_pass http://localhost:8100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
        proxy_buffering off;
    }
    
    # Your existing location / block should already exist
    location / {
        proxy_pass http://localhost:8100;
        # ... existing proxy settings ...
    }
}
```

### Step 3: Test Configuration

```bash
# Test nginx config
sudo nginx -t

# If successful, reload
sudo nginx -s reload

# Or restart
sudo systemctl restart nginx
```

### Step 4: Verify WebSocket

After reloading nginx:

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Refresh Neode** (F5)
3. **Check console** - WebSocket should connect
4. **Test Server/Settings tabs** - Should load now

### Step 5: Check Logs

If still having issues:

```bash
# Check nginx error log
sudo tail -f /var/log/nginx/error.log

# Check for WebSocket errors
sudo tail -f /var/log/nginx/neode-error.log
```

## Common Issues

### Issue 1: WebSocket Still Fails

**Symptom**: `wss://neode.l484.com/ws/db` connection failed

**Check**:
```bash
# Verify nginx is listening on 443
sudo netstat -tlnp | grep :443

# Verify Neode container is running
docker ps | grep neode

# Check if port 8100 is accessible
curl http://localhost:8100/health
```

### Issue 2: 404 on Server/Settings Pages

**Symptom**: `Failed to load resource: 404`

**Solution**: Force rebuild in Portainer (see below)

### Issue 3: Mixed Content Errors

**Symptom**: Browser blocks HTTP content on HTTPS page

**Solution**: Ensure all proxied requests use HTTPS:
```nginx
proxy_set_header X-Forwarded-Proto $scheme;
```

## Portainer Rebuild

After nginx config is updated, force rebuild Neode:

1. **Go to Portainer** → **Stacks** → **Neode**
2. **Click "Update the stack"**
3. ✅ Enable "Pull and redeploy"
4. ✅ Enable "Re-pull image"
5. **Click "Update"**

Wait 3-5 minutes for rebuild.

## Testing

After all changes:

### 1. WebSocket Connection
Open browser console, should see:
```
WebSocket connected
[Mock Backend] Received initial data
```

### 2. Server Tab
Click "Server" in navigation - should load without 404.

### 3. Settings Tab
Click "Settings" in navigation - should load without 404.

### 4. ATOB Launch
- Install ATOB from Marketplace
- Click Launch
- Should open `http://neode.l484.com:8102` (or HTTPS if configured)

## Security Considerations

### SSL/TLS Best Practices

If you want to secure port 8102 (ATOB) with SSL:

```nginx
server {
    listen 8102 ssl http2;
    server_name neode.l484.com;
    
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8102;
        # ... proxy settings ...
    }
}
```

### Firewall Rules

Make sure ports are open:

```bash
# Allow HTTPS
sudo ufw allow 443/tcp

# Allow ATOB (if exposing externally)
sudo ufw allow 8102/tcp

# Check status
sudo ufw status
```

## Architecture Diagram

```
Internet
    ↓
External Nginx (Port 443 - SSL)
    ├── HTTPS → localhost:8100 (Neode Web Container)
    │   └── Internal Nginx → localhost:5959 (Mock Backend)
    │       └── Docker Socket → ATOB Containers
    └── WSS → localhost:8100/ws → localhost:5959/ws/db
```

## Quick Command Reference

```bash
# View current nginx config
sudo nginx -T

# Test config
sudo nginx -t

# Reload nginx
sudo nginx -s reload

# Restart nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/error.log

# Check if WebSocket is being proxied
sudo grep -A10 "location /ws" /etc/nginx/sites-enabled/*

# Test WebSocket from command line
websocat wss://neode.l484.com/ws/db
# or
wscat -c wss://neode.l484.com/ws/db
```

## Need Help?

If you're still having issues after following these steps:

1. **Share your current nginx config**:
   ```bash
   sudo cat /etc/nginx/sites-available/neode.l484.com
   ```

2. **Share nginx error logs**:
   ```bash
   sudo tail -100 /var/log/nginx/error.log
   ```

3. **Share browser console errors**:
   - Open DevTools (F12)
   - Go to Console tab
   - Copy any errors related to WebSocket or 404s

---

**Summary**: Add the WebSocket `/ws` location block to your external nginx config, reload nginx, and force rebuild the Portainer stack. That should fix both the WebSocket connection and the 404 errors!

