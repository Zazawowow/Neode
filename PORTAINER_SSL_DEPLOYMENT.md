# Neode Portainer Deployment with Automatic HTTPS

## Overview

This deployment uses **Caddy** as a reverse proxy to provide:
- ✅ **Automatic HTTPS** with Let's Encrypt certificates
- ✅ **WebSocket support** (fixes wss:// connection issues)
- ✅ **No external nginx configuration needed**
- ✅ **Self-contained in Portainer stack**

## Architecture

```
Internet (HTTPS/WSS)
    ↓
Caddy (Auto SSL + Reverse Proxy)
    ├── Port 443 → neode-web:80 (Main UI)
    ├── Port 8100 → neode-web:80 (Legacy)
    └── Port 8102 → atob-test:80 (ATOB App)
          ↓
    neode-web (Internal Nginx)
          ↓
    neode-backend (Mock Backend + Docker)
          ↓
    Docker Socket (Package Management)
```

## Prerequisites

### 1. DNS Configuration

Point your domain to your server:

```bash
# Check DNS propagation
dig neode.l484.com +short
# Should return your server's IP
```

### 2. Firewall Rules

Open required ports:

```bash
# Allow HTTP (for Let's Encrypt challenge)
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Allow ATOB HTTPS
sudo ufw allow 8102/tcp

# Optional: Legacy HTTPS port
sudo ufw allow 8100/tcp

# Check status
sudo ufw status
```

### 3. Remove Conflicting Nginx

If you have nginx running on ports 80/443:

```bash
# Stop nginx
sudo systemctl stop nginx

# Disable nginx (optional)
sudo systemctl disable nginx

# Verify ports are free
sudo netstat -tlnp | grep -E ':80|:443'
```

## Deployment Steps

### Step 1: Update Portainer Stack

1. **Go to Portainer** → **Stacks** → **Neode**
2. **Click "Editor"**
3. **The stack is already configured** with Caddy!
4. **Scroll to bottom** and set environment variable:

```yaml
DOMAIN=neode.l484.com
```

5. ✅ Enable "Pull and redeploy"
6. ✅ Enable "Re-pull image"
7. **Click "Update stack"**

### Step 2: Wait for Let's Encrypt

Caddy will automatically obtain SSL certificates:

```bash
# Watch logs
docker logs -f neode-caddy

# You should see:
# "certificate obtained successfully"
```

This takes 1-3 minutes on first deployment.

### Step 3: Verify Deployment

**Check all containers are running:**

```bash
docker ps | grep neode
```

You should see:
- `neode-caddy` (reverse proxy)
- `neode-web` (UI)
- `neode-backend` (API)

**Check Caddy logs:**

```bash
docker logs neode-caddy --tail 50
```

Look for:
- ✅ "Starting Caddy..."
- ✅ "Serving HTTPS on..."
- ✅ No errors about SSL

### Step 4: Test in Browser

1. **Open**: `https://neode.l484.com`
2. **Should see**: Neode login page with valid SSL certificate
3. **Check console** (F12): No WebSocket errors
4. **Login** with password: `password123`

## Testing Checklist

### ✅ HTTPS Working
- [ ] `https://neode.l484.com` loads
- [ ] Green padlock icon in browser
- [ ] No SSL warnings

### ✅ WebSocket Connected
- [ ] Open browser console (F12)
- [ ] Should see: `WebSocket connected`
- [ ] Should see: `[Mock Backend] Received initial data`
- [ ] No `wss:// failed` errors

### ✅ Navigation Works
- [ ] Click "Apps" tab - loads without 404
- [ ] Click "Marketplace" tab - loads without 404
- [ ] Click "Server" tab - loads without 404
- [ ] Click "Settings" tab - loads without 404

### ✅ ATOB Installation
- [ ] Go to Marketplace
- [ ] Click "Install" on A to B Bitcoin
- [ ] Wait for installation progress
- [ ] Should appear in Apps tab
- [ ] Click "Launch"
- [ ] Should open `https://neode.l484.com:8102`
- [ ] ATOB app loads with valid SSL

## Troubleshooting

### Issue 1: "Connection Not Private" Error

**Symptom**: Browser shows SSL warning

**Cause**: Let's Encrypt hasn't issued certificate yet

**Solution**:
```bash
# Wait 2-3 minutes, then check logs
docker logs neode-caddy | grep -i certificate

# Force certificate renewal
docker exec neode-caddy caddy reload --config /etc/caddy/Caddyfile
```

### Issue 2: WebSocket Still Failing

**Symptom**: `wss:// connection failed` in console

**Solution**:
```bash
# Check Caddy is listening
docker exec neode-caddy netstat -tlnp | grep :443

# Check backend is reachable
docker exec neode-caddy wget -O- http://neode-web:80/health

# Restart Caddy
docker restart neode-caddy
```

### Issue 3: Server/Settings Pages 404

**Symptom**: `Failed to load resource: 404`

**Solution**:
```bash
# Force rebuild to regenerate JS chunks
# In Portainer:
# Stacks → Neode → Update → Enable "Re-pull image" → Update
```

### Issue 4: ATOB Won't Launch

**Symptom**: Port 8102 shows "ATOB not running"

**Solution**:
```bash
# Check if ATOB container exists
docker ps -a | grep atob

# Check backend logs
docker logs neode-backend | grep -i atob

# Manually verify network
docker network inspect neode-network | grep atob-test

# Reinstall ATOB from Marketplace
```

### Issue 5: Port Already in Use

**Symptom**: `bind: address already in use`

**Solution**:
```bash
# Find what's using the port
sudo lsof -i :443

# If nginx, stop it
sudo systemctl stop nginx

# Restart stack
```

## Configuration

### Custom Domain

To use a different domain, update the environment variable in Portainer:

```yaml
environment:
  - DOMAIN=your-domain.com
```

### SSL Certificate Details

Caddy stores certificates in Docker volume `caddy_data`:

```bash
# View certificates
docker exec neode-caddy ls -la /data/caddy/certificates

# Certificate location
/data/caddy/certificates/acme-v02.api.letsencrypt.org-directory/
```

### Customize Caddyfile

The Caddyfile is generated inline in the Portainer stack. To modify:

1. Edit `portainer-stack-vue.yml`
2. Find the `caddy:` service
3. Edit the `command:` section where Caddyfile is created
4. Update the stack in Portainer

## Maintenance

### Certificate Renewal

Caddy auto-renews certificates before expiry. No manual intervention needed!

To force renewal:

```bash
docker exec neode-caddy caddy reload --config /etc/caddy/Caddyfile
```

### View Caddy Config

```bash
# View generated Caddyfile
docker exec neode-caddy cat /etc/caddy/Caddyfile

# View Caddy JSON config (internal)
docker exec neode-caddy caddy config
```

### Update Stack

When code changes are pushed to GitHub:

1. Go to Portainer → Stacks → Neode
2. Click "Update the stack"
3. ✅ Enable "Pull and redeploy"
4. ✅ Enable "Re-pull image"
5. Click "Update"

## Performance

### SSL Handshake Time

Caddy's automatic HTTPS adds minimal overhead:
- First request: ~50-100ms (TLS handshake)
- Subsequent requests: ~1-5ms (session resumption)

### WebSocket Latency

Caddy proxies WebSocket with no buffering:
- Typical latency: <5ms
- Max concurrent connections: 10,000+

## Security

### Automatic Security Features

Caddy enables by default:
- ✅ TLS 1.2 and 1.3 only
- ✅ Strong cipher suites
- ✅ OCSP stapling
- ✅ HTTP/2 support
- ✅ Auto-redirect HTTP → HTTPS

### Additional Hardening

For production, add to Caddyfile:

```caddyfile
{
  # Global options
  email admin@neode.l484.com
  
  # Security headers
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    X-Content-Type-Options "nosniff"
    X-Frame-Options "DENY"
    Referrer-Policy "no-referrer-when-downgrade"
  }
}
```

## Monitoring

### Health Checks

All containers have health checks configured:

```bash
# View health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Should show "healthy" for all containers
```

### Logs

```bash
# Caddy logs (HTTPS/WebSocket)
docker logs -f neode-caddy

# Backend logs (RPC/API)
docker logs -f neode-backend

# Web logs (nginx)
docker logs -f neode-web
```

### Access Logs

Caddy outputs JSON logs to stdout:

```bash
docker logs neode-caddy | jq '.'
```

## Backup

### Certificate Backup

```bash
# Backup Caddy data volume (includes certificates)
docker run --rm \
  -v neode_caddy_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/caddy-data-backup.tar.gz /data
```

### Restore Certificates

```bash
# Restore from backup
docker run --rm \
  -v neode_caddy_data:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd / && tar xzf /backup/caddy-data-backup.tar.gz"
```

## Migration from External Nginx

If you previously used external nginx:

1. **Stop external nginx**:
   ```bash
   sudo systemctl stop nginx
   ```

2. **Deploy Portainer stack** (with Caddy)

3. **Test everything works**

4. **Remove nginx config** (optional):
   ```bash
   sudo rm /etc/nginx/sites-enabled/neode.l484.com
   ```

5. **Keep nginx disabled**:
   ```bash
   sudo systemctl disable nginx
   ```

## Advanced Configuration

### Multiple Domains

To serve Neode on multiple domains, edit Caddyfile:

```caddyfile
neode.l484.com, neode.example.com {
  # ... config ...
}
```

### Custom Port Mapping

To expose ATOB on a different port:

```yaml
# In portainer-stack-vue.yml
caddy:
  ports:
    - "9000:9000"  # Custom ATOB port
```

Then update Caddyfile:

```caddyfile
{$DOMAIN}:9000 {
  reverse_proxy atob-test:80
}
```

## Support

### Check Status

```bash
# Full health check
docker ps
docker logs neode-caddy --tail 20
docker logs neode-backend --tail 20
docker logs neode-web --tail 20

# Network connectivity
docker exec neode-caddy ping -c2 neode-web
docker exec neode-web ping -c2 neode-backend
```

### Debug Mode

Enable verbose Caddy logging:

Edit Caddyfile `log` section:

```caddyfile
log {
  output stdout
  level DEBUG  # Change from INFO to DEBUG
}
```

---

## Quick Reference

```bash
# View all Neode containers
docker ps | grep neode

# Restart everything
docker restart neode-caddy neode-web neode-backend

# View Caddy config
docker exec neode-caddy cat /etc/caddy/Caddyfile

# Check SSL certificate
echo | openssl s_client -servername neode.l484.com -connect neode.l484.com:443 2>/dev/null | openssl x509 -noout -dates

# Force rebuild
# Portainer → Stacks → Neode → Update → ✅ Re-pull → Update
```

---

**Summary**: The Portainer stack now includes Caddy for automatic HTTPS and WebSocket support. No external nginx configuration needed! 🎉

