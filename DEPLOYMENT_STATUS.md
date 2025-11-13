# Neode Deployment Status

## Current State: ✅ Working Locally, ⏳ Production Pending

### What's Working

- ✅ **Portainer Stack Deployed**: Running on `neode_neode-network`
- ✅ **neode-web**: Accessible at `http://localhost:9991` or `http://10.144.116.223:9991`
- ✅ **neode-backend**: Healthy, running mock RPC server
- ✅ **Health Checks**: Fixed (uses `/` instead of `/health`)
- ✅ **ATOB App**: Installs and runs on port 8102
- ✅ **Marketplace**: Real Docker-based install/uninstall works
- ✅ **Local Development**: Fully functional

### What's Pending (For Network Admin)

- ⏳ **Production HTTPS Access**: `https://neode.l484.com` returns 502
- ⏳ **SSL Termination**: Currently handled by unknown OpenResty proxy
- ⏳ **DNS Configuration**: Points to `iawarehouse.duckdns.org` → `70.121.119.250`

---

## Clean Up Steps (Run on Server)

To ensure clean separation from k484-frontend, disconnect neode containers:

```bash
# Disconnect neode containers from k484 network (we connected them during troubleshooting)
sudo docker network disconnect k484_k484-network neode-web 2>/dev/null || true
sudo docker network disconnect k484_k484-network neode-backend 2>/dev/null || true

# Verify they're only on their own network
sudo docker inspect neode-web | grep -A 10 "Networks"
sudo docker inspect neode-backend | grep -A 10 "Networks"
```

Expected output: Only `neode_neode-network` should be listed.

---

## Local Access (Current Working State)

### Access Neode UI
```
http://localhost:9991
http://10.144.116.223:9991
```

### Access ATOB (After Installing from Marketplace)
```
http://localhost:8102
http://10.144.116.223:8102
```

### Check Container Status
```bash
sudo docker ps | grep neode
```

Both should show `(healthy)`.

---

## For Production Deployment (With Network Admin)

### Issue Discovered

The response header shows `server: openresty` but:
- ❌ No OpenResty found on host
- ❌ No OpenResty container found
- ❌ k484-frontend runs regular nginx
- ✅ Server public IP matches DNS (70.121.119.250)

### Likely Scenarios

1. **External Reverse Proxy**: ISP/network-level OpenResty proxy
2. **Cloudflare/CDN**: Service in front of the server
3. **Hardware Load Balancer**: Enterprise network appliance
4. **VPN/Tailscale Gateway**: Routing through another server

### What Needs to Be Done

The network admin needs to configure the **upstream OpenResty proxy** to route `neode.l484.com` → `localhost:9991` on this server.

#### Config Needed (For Their Proxy)

```nginx
# Add to the OpenResty/Nginx config
server {
    listen 443 ssl http2;
    server_name neode.l484.com;
    
    ssl_certificate /path/to/cert;
    ssl_certificate_key /path/to/key;
    
    location / {
        proxy_pass http://10.144.116.223:9991;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_buffering off;
    }
}

server {
    listen 80;
    server_name neode.l484.com;
    return 301 https://$server_name$request_uri;
}
```

### Alternative: Expose Neode on Different Port

If configuring the upstream proxy is complex, expose Neode on a unique HTTPS port:

1. Add SSL termination to neode-web container
2. Expose port 9443 or similar
3. Access via `https://neode.l484.com:9443`

---

## What We Tried (For Reference)

### Attempt 1: Add Config to k484-frontend
- Created nginx config for neode.l484.com
- Connected containers to k484_k484-network
- k484-frontend could reach neode-web internally
- **Result**: Still got 502 with "openresty" header
- **Conclusion**: k484-frontend isn't the SSL terminator

### Attempt 2: Search for OpenResty
- Checked host processes: None found
- Checked Docker containers: None found
- Checked systemd services: None found
- **Conclusion**: OpenResty is external to this server

### Key Discovery
```bash
$ nslookup neode.l484.com
neode.l484.com  canonical name = iawarehouse.duckdns.org.
Name:   iawarehouse.duckdns.org
Address: 70.121.119.250

$ curl -4 ifconfig.me
70.121.119.250
```

Server IP matches DNS, so the OpenResty proxy is likely:
- At the network edge (ISP/data center level)
- A hardware appliance
- Part of the network infrastructure

---

## Network Diagram

### Current Architecture

```
Internet
    ↓
??? OpenResty Proxy (Unknown Location) ???
    ↓ (Returns 502 for neode.l484.com)
    ↓
Server: 70.121.119.250 (10.144.116.223)
    ├─ k484-frontend (Ports 80/443) → k484.com works
    └─ neode-web (Port 9991) → localhost:9991 works
        └─ neode-backend (Port 5959) → Mock backend works
            └─ Docker Socket → ATOB containers (Port 8102)
```

### What Needs to Happen

```
Internet
    ↓
OpenResty Proxy (Network Admin Configures)
    ├─ k484.com → localhost:80/443
    └─ neode.l484.com → localhost:9991 (NEW)
        ↓
Server: 70.121.119.250
    └─ neode-web (Port 9991)
        └─ neode-backend + ATOB
```

---

## Files for Network Admin

Share these with your network admin:

1. **This file**: Explains the situation
2. **`CREATE_NGINX_CONFIG.sh`**: Auto-creates the proxy config
3. **`NGINX_SETUP_INSTRUCTIONS.md`**: Detailed nginx guide
4. **`portainer-stack-vue.yml`**: Current stack configuration

### Key Information for Network Admin

- **Service**: Neode UI
- **Internal Port**: 9991 (HTTP)
- **Internal IP**: 10.144.116.223
- **Domain**: neode.l484.com
- **Current Status**: Works locally, needs proxy routing
- **Required**: HTTPS termination and proxy to port 9991

---

## Testing Checklist

### ✅ Local Development (Working)
- [ ] `http://localhost:9991` loads Neode login
- [ ] `http://10.144.116.223:9991` loads from local network
- [ ] Marketplace installs ATOB
- [ ] ATOB launches at `localhost:8102`
- [ ] Containers show as `(healthy)`

### ⏳ Production (Pending Network Admin)
- [ ] `https://neode.l484.com` loads (not 502)
- [ ] SSL certificate is valid
- [ ] WebSocket connects
- [ ] ATOB works over HTTPS

---

## Next Steps

1. **Now**: Use local development at `localhost:9991`
2. **Soon**: Meet with network admin
3. **Show Them**: This file + nginx config examples
4. **They Configure**: Upstream proxy to route neode.l484.com → port 9991
5. **Test**: `https://neode.l484.com` should work

---

## Quick Commands Reference

```bash
# Check Neode status
sudo docker ps | grep neode

# Access locally
curl http://localhost:9991

# View logs
sudo docker logs neode-web --tail 50
sudo docker logs neode-backend --tail 50

# Restart stack (if needed)
sudo docker restart neode-web neode-backend

# Check what's listening
sudo ss -tlnp | grep 9991
```

---

**Status**: Ready for local development, waiting on network admin for production deployment.

**Contact**: Share this document with network admin to configure the upstream OpenResty proxy.

