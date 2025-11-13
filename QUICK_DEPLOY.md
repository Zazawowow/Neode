# Quick Deploy Guide - Neode with Caddy

## Problem

Port 80 and 443 are already in use by your external nginx, so Caddy can't bind to them.

## Solution

We'll use **two-tier proxy**:
- **External Nginx** (ports 80/443) → **Caddy in Docker** (ports 8080/8443)
- Caddy handles WebSocket internally, nginx just passes traffic through

## Deployment Steps

### 1. Deploy Portainer Stack

In Portainer:
1. Go to **Stacks** → **Neode**
2. Click **"Update the stack"**
3. ✅ Enable **"Pull and redeploy"**
4. ✅ Enable **"Re-pull image"**
5. Click **"Update"**

The stack will now use:
- Port **9080** for HTTP (instead of 80)
- Port **9443** for HTTPS (instead of 443)
- Port **8100** for legacy access
- Port **8102** for ATOB

### 2. Update External Nginx (One Command)

On your server, run the update script:

```bash
# Download and run the script
cd /Users/tx1138/Code/Neode
./UPDATE_NGINX_PROXY.sh
```

This script:
- ✅ Backs up your current nginx config
- ✅ Creates new config that proxies to Caddy on port 9443
- ✅ Tests the config
- ✅ Reloads nginx automatically

### 3. Verify

```bash
# Check all services are running
docker ps | grep neode

# Check nginx is proxying correctly
curl -I https://neode.l484.com

# Should see: HTTP/2 200
```

### 4. Test in Browser

1. Open: `https://neode.l484.com`
2. Should see: Neode login (no port in URL!)
3. Check console: WebSocket should connect
4. Test all tabs: Apps, Marketplace, Server, Settings

## Architecture

```
Internet (HTTPS/WSS)
    ↓
External Nginx (Ports 80/443)
    ↓
Caddy in Docker (Ports 9080/9443)
    ↓
Neode Web Container (Port 80)
    ↓
Mock Backend (Port 5959)
```

## Alternative: Direct Access (No Nginx Update)

If you can't update nginx right now, you can access Neode directly via alternative ports:

1. **Open**: `https://neode.l484.com:9443`
2. **Or**: `https://neode.l484.com:8100`

⚠️ **Note**: SSL certificate might show a warning since Caddy is using a self-signed cert. To fix this, you need to configure Let's Encrypt in the Caddyfile.

## Troubleshooting

### "Still getting port 80 error"

Make sure you've updated the Portainer stack after pulling the latest changes:

```bash
cd /Users/tx1138/Code/Neode
git pull origin master
```

Then redeploy in Portainer.

### "Nginx config error"

Check your SSL certificate paths in the script:

```bash
# View your certificates
sudo ls -la /etc/letsencrypt/live/neode.l484.com/

# Or update the paths in UPDATE_NGINX_PROXY.sh
# Lines 23-24:
ssl_certificate /path/to/your/fullchain.pem;
ssl_certificate_key /path/to/your/privkey.pem;
```

### "WebSocket still failing"

```bash
# Check Caddy logs
docker logs neode-caddy

# Check nginx error log
sudo tail -f /var/log/nginx/error.log

# Test direct connection to Caddy
curl -k https://localhost:9443
```

## Rollback

If anything goes wrong:

```bash
# Restore nginx backup
sudo cp /etc/nginx/sites-available/neode.l484.com.backup /etc/nginx/sites-available/neode.l484.com
sudo nginx -s reload

# Rollback Portainer stack
# In Portainer: Stacks → Neode → Editor → Revert changes
```

## Manual Nginx Update

If you prefer to manually update nginx, add this to your config:

```nginx
# Inside your server block for neode.l484.com
location / {
    proxy_pass https://localhost:9443;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_ssl_verify off;
    proxy_buffering off;
}
```

Then reload:

```bash
sudo nginx -t
sudo nginx -s reload
```

---

## Summary

1. ✅ Deploy Portainer stack (uses ports 9080/9443)
2. ✅ Run `./UPDATE_NGINX_PROXY.sh` on your server
3. ✅ Access `https://neode.l484.com` (standard ports!)
4. ✅ Everything works including WebSocket

**Total time**: ~2 minutes

