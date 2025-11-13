# OpenResty 502 Bad Gateway Debug Guide

## Problem
Getting "502 Bad Gateway" from openresty when accessing `https://neode.l484.com/`

This means:
- ✅ OpenResty proxy is working
- ✅ DNS is resolving to your server
- ❌ OpenResty cannot connect to the Neode container

---

## Quick Checks

### 1. Verify Container is Running

```bash
docker ps | grep neode-web
```

**Expected output:**
```
neode-web   Up X minutes   0.0.0.0:8100->80/tcp
```

**If not running:**
```bash
# Check why it stopped
docker logs neode-web

# Try starting it
docker start neode-web
```

---

### 2. Check Container Health

```bash
# From the host machine
curl http://localhost:8100/health

# Expected: "healthy"
```

**If this works:** Container is fine, it's a proxy configuration issue.

**If this fails:** Container isn't running properly.

---

### 3. Test Container Directly

```bash
# Get the container's internal IP
docker inspect neode-web | grep IPAddress

# Test directly (replace with actual IP)
curl http://172.17.0.X/health
```

---

## OpenResty Configuration Issues

### Issue 1: Wrong Backend Port

OpenResty might be trying to connect to the wrong port.

**Check your OpenResty/proxy config for:**
```nginx
# Should be pointing to:
upstream neode {
    server localhost:8100;  # Or neode-web:80 if same Docker network
}
```

---

### Issue 2: Docker Network Issue

OpenResty and neode-web might not be on the same Docker network.

**Check networks:**
```bash
# List networks
docker network ls

# Inspect neode-web network
docker inspect neode-web | grep -A 10 Networks

# Inspect openresty container
docker ps | grep openresty
docker inspect <openresty-container> | grep -A 10 Networks
```

**Fix: Connect both to same network**
```bash
# Create a network if needed
docker network create proxy-network

# Connect neode-web to it
docker network connect proxy-network neode-web

# Restart openresty or update its config
```

---

### Issue 3: Traefik Labels Misconfigured

Your `docker-compose.yml` has Traefik labels but they might need updating:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.neode.rule=Host(`neode.l484.com`)"  # ← Update this
  - "traefik.http.routers.neode.entrypoints=web"
  - "traefik.http.services.neode.loadbalancer.server.port=80"  # ← Internal port
```

**If using HTTPS, also add:**
```yaml
  - "traefik.http.routers.neode.entrypoints=websecure"
  - "traefik.http.routers.neode.tls=true"
```

---

### Issue 4: OpenResty Not Finding Backend

Check OpenResty logs:
```bash
# Find openresty container
docker ps | grep openresty

# Check its logs
docker logs <openresty-container> --tail 100

# Look for errors like:
# "connect() failed (111: Connection refused)"
# "no live upstreams while connecting to upstream"
```

---

## Solution Steps

### Step 1: Verify Stack Configuration

Update your Portainer stack to use correct network:

```yaml
version: '3.8'

services:
  neode-web:
    build:
      context: https://github.com/Zazawowow/Neode.git
      dockerfile: Dockerfile
    container_name: neode-web
    ports:
      - "8100:80"
    restart: unless-stopped
    networks:
      - proxy  # ← Use your existing proxy network name
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.neode.rule=Host(`neode.l484.com`)"
      - "traefik.http.routers.neode.entrypoints=websecure"
      - "traefik.http.routers.neode.tls=true"
      - "traefik.http.services.neode.loadbalancer.server.port=80"
      - "traefik.docker.network=proxy"  # ← Important!

networks:
  proxy:
    external: true  # ← Use existing proxy network
```

---

### Step 2: Check if Port 8100 is Exposed

Since you're using a reverse proxy, you might NOT need to expose port 8100 externally.

**Two options:**

**Option A: Use Traefik (recommended)**
```yaml
# Don't expose port, let Traefik handle it
services:
  neode-web:
    # Remove: ports: - "8100:80"
    expose:
      - "80"  # Only expose to Docker network
    networks:
      - proxy
```

**Option B: Direct access**
```yaml
# Keep port exposed for direct access
ports:
  - "8100:80"
```

---

### Step 3: Test Without Proxy

Temporarily bypass OpenResty to isolate the issue:

```bash
# Access container directly
curl http://localhost:8100/

# If this works, the issue is the proxy config
# If this fails, the issue is the container
```

---

### Step 4: Check OpenResty Configuration

If you have access to the OpenResty config files, verify:

```nginx
# Should have something like:
server {
    listen 443 ssl;
    server_name neode.l484.com;

    location / {
        proxy_pass http://neode-web:80;  # Or http://localhost:8100
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Quick Fix: Use External URL

If you can't fix the proxy right away, access it directly:

```
http://your-server-ip:8100
```

This bypasses OpenResty entirely.

---

## Most Likely Cause

Based on the error, the most likely issues are:

1. **Docker network isolation** - OpenResty and neode-web aren't on the same network
2. **Wrong backend configuration** - OpenResty is pointing to wrong port/host
3. **Container not running** - Check with `docker ps`
4. **Traefik misconfiguration** - Labels don't match your setup

---

## Need More Help?

Run these commands and share the output:

```bash
# 1. Container status
docker ps -a | grep neode

# 2. Container logs
docker logs neode-web --tail 50

# 3. Network info
docker network ls
docker inspect neode-web | grep -A 20 Networks

# 4. OpenResty/Traefik logs
docker ps | grep -E "traefik|openresty"
docker logs <proxy-container> --tail 50

# 5. Test internal access
curl -v http://localhost:8100/health
```

These outputs will help diagnose the exact issue.

