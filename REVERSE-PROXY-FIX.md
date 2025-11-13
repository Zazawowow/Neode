# Fixing 405 Error with Reverse Proxy

## 🔍 The Real Problem

Since you're accessing via `https://neode.l484.com`, the 405 error is likely coming from your **reverse proxy layer** (Cloudflare Tunnel, Traefik, nginx, etc.), **NOT** from the Neode containers.

## 🩺 Diagnose First

Run this diagnostic script on your Portainer host:

```bash
./diagnose-405.sh
```

This will test 6 different layers to find where the 405 is coming from.

### Expected Results

| Test | What It Checks | Should Return |
|------|----------------|---------------|
| Test 1 | Backend container directly | `{"result":"test"}` ✅ |
| Test 2 | Frontend → Backend internal | `{"result":"test"}` ✅ |
| Test 3 | Host → Container :8100 | `{"result":"test"}` ✅ |
| Test 4 | Through neode.l484.com | **405 ERROR** ❌ |
| Test 5 | Response headers | Shows proxy info |
| Test 6 | Cloudflare detection | Checks if CF is used |

If Tests 1-3 pass but Test 4 fails → **The reverse proxy is blocking it**

---

## 🔧 Solutions by Reverse Proxy Type

### If Using Cloudflare Tunnel

Cloudflare's WAF (Web Application Firewall) may be blocking POST requests to `/rpc/v1` because it looks like an API endpoint.

**Solution 1: Disable WAF for /rpc/* path**

1. Go to Cloudflare Dashboard
2. Your domain → **Security** → **WAF**
3. Click **Create rule**
4. Rule name: `Allow RPC Endpoints`
5. Field: `URI Path`
6. Operator: `starts with`
7. Value: `/rpc`
8. Action: `Skip` → Select `All remaining custom rules`
9. Save

**Solution 2: Create Page Rule**

1. Go to **Rules** → **Page Rules**
2. URL: `neode.l484.com/rpc/*`
3. Add setting: **Security Level** → `Essentially Off`
4. Add setting: **Disable Security**
5. Save

**Solution 3: Check Firewall Events**

1. Go to **Security** → **Events**
2. Look for blocked requests to `/rpc/v1`
3. Click on the event
4. Click **Allow** to create an exception rule

### If Using Traefik

Your `portainer-stack-vue.yml` has Traefik labels. Check if there are middleware rules blocking POST.

**Check Traefik configuration:**

```bash
# Find Traefik container
docker ps | grep traefik

# Check Traefik logs
docker logs <traefik-container-name> | grep -i "405\|rpc"
```

**Solution: Update Traefik labels in portainer-stack-vue.yml**

Add middleware to allow POST:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.neode.rule=Host(`neode.l484.com`)"
  - "traefik.http.routers.neode.entrypoints=websecure"
  - "traefik.http.routers.neode.tls=true"
  - "traefik.http.services.neode.loadbalancer.server.port=80"
  # Add these:
  - "traefik.http.middlewares.neode-headers.headers.customresponseheaders.Access-Control-Allow-Origin=*"
  - "traefik.http.middlewares.neode-headers.headers.customresponseheaders.Access-Control-Allow-Methods=GET,POST,OPTIONS"
  - "traefik.http.routers.neode.middlewares=neode-headers"
```

### If Using nginx Reverse Proxy

If there's an nginx reverse proxy in front of Portainer:

**Check nginx config:**

```bash
# Find nginx config
cat /etc/nginx/sites-enabled/* | grep neode.l484.com -A 20
```

**Required nginx config:**

```nginx
server {
    listen 443 ssl http2;
    server_name neode.l484.com;
    
    # SSL config...
    
    location / {
        proxy_pass http://localhost:8100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CRITICAL: Allow POST and OPTIONS
        proxy_method $request_method;
        proxy_pass_request_headers on;
        
        # Don't limit request methods
        # Remove or comment out any "limit_except" directives
    }
}
```

**Common nginx issues:**

1. **`limit_except GET HEAD`** directive is blocking POST
2. **ModSecurity** or security module blocking RPC endpoints
3. **Rate limiting** triggering on API endpoints

**Fix:**

```bash
# Edit nginx config
sudo nano /etc/nginx/sites-enabled/neode

# Remove or comment out:
# limit_except GET HEAD {
#     deny all;
# }

# Reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

### If Using Cloudflared (Argo Tunnel)

Check your tunnel configuration:

```bash
# Check cloudflared config
cat ~/.cloudflared/config.yml
```

**Required config:**

```yaml
tunnel: your-tunnel-id
credentials-file: /path/to/credentials.json

ingress:
  - hostname: neode.l484.com
    service: http://localhost:8100
    originRequest:
      noTLSVerify: true
      # Add these:
      connectTimeout: 60s
      disableChunkedEncoding: false
  - service: http_status:404
```

---

## 🧪 Testing After Fix

### Test 1: Direct POST
```bash
curl -v -X POST https://neode.l484.com/rpc/v1 \
  -H "Content-Type: application/json" \
  -d '{"method":"server.echo","params":{"message":"test"}}'
```

Should return: `{"result":"test"}` with status **200 OK**

### Test 2: OPTIONS Preflight
```bash
curl -v -X OPTIONS https://neode.l484.com/rpc/v1 \
  -H "Origin: https://neode.l484.com" \
  -H "Access-Control-Request-Method: POST"
```

Should return status **200 OK** or **204 No Content**

### Test 3: Browser
1. Open https://neode.l484.com
2. Open DevTools (F12) → Network tab
3. Try to login with `password123`
4. Check the POST request to `/rpc/v1`:
   - Status should be **200 OK** (not 405)
   - Response should have JSON data

---

## 🎯 Quick Decision Tree

```
Is the error 405?
├─ YES
│  ├─ Run ./diagnose-405.sh
│  │  ├─ Tests 1-3 pass, Test 4 fails?
│  │  │  ├─ YES → Reverse proxy issue (see solutions above)
│  │  │  └─ NO → Docker container issue (check backend logs)
│  │  └─ Cloudflare detected?
│  │     ├─ YES → Add WAF exception for /rpc/*
│  │     └─ NO → Check Traefik/nginx config
│  └─ Direct access to :8100 works?
│     ├─ YES → Definitely reverse proxy blocking it
│     └─ NO → Need to fix containers first
└─ NO (different error) → Check browser console for details
```

---

## 📋 Checklist

Before giving up, verify:

- [ ] Ran `./diagnose-405.sh` to identify the layer causing 405
- [ ] Checked if Cloudflare WAF is blocking `/rpc/v1`
- [ ] Verified direct access to `:8100` works (bypassing reverse proxy)
- [ ] Checked Traefik logs for middleware blocking POST
- [ ] Verified nginx config doesn't have `limit_except` directives
- [ ] Tested OPTIONS preflight request returns 200/204
- [ ] Checked firewall rules aren't blocking API endpoints

---

## 🆘 Still Stuck?

Share the output of:

```bash
./diagnose-405.sh > diagnosis.txt
cat diagnosis.txt
```

This will show exactly which layer is causing the 405 error.

---

## 📝 Summary

**The 405 error is almost certainly from your reverse proxy, not the Docker containers.**

Common culprits:
1. **Cloudflare WAF** blocking POST to `/rpc/v1` (most common)
2. **nginx `limit_except`** directive blocking POST
3. **Traefik middleware** blocking or not forwarding properly
4. **ModSecurity** or other WAF blocking "suspicious" API endpoints

**Quick test:** If `curl -X POST http://localhost:8100/rpc/v1 ...` works but `https://neode.l484.com/rpc/v1` returns 405, it's definitely the reverse proxy.

