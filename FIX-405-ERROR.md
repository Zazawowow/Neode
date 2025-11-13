# Fix for 405 Method Not Allowed Error

## 🐛 The Problem

POST requests to `/rpc/v1` are returning **405 Method Not Allowed** error.

## 🔍 Root Causes

1. **CORS configuration** was too restrictive (only allowed `localhost:8100`)
2. **OPTIONS preflight** requests were not handled
3. **Nginx proxy configuration** was not properly forwarding POST requests

## ✅ What Was Fixed

### 1. Backend (mock-backend.js)

**Fixed CORS to allow all origins:**
```javascript
const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    callback(null, true)  // Allow all origins
  }
}
```

**Added OPTIONS handler:**
```javascript
app.options('/rpc/v1', (req, res) => {
  res.status(200).end()
})
```

### 2. Frontend (nginx-with-backend.conf)

**Changed location matching from exact to prefix:**
```nginx
# OLD (problematic):
location = /rpc/v1 {
    proxy_pass http://neode-backend:5959/rpc/v1;
}

# NEW (fixed):
location /rpc/ {
    proxy_pass http://neode-backend:5959;
}
```

**Added explicit method and header forwarding:**
```nginx
proxy_method $request_method;
proxy_set_header Content-Type $content_type;
proxy_pass_request_headers on;
```

## 🚀 How to Deploy the Fix

### Step 1: Commit and Push

```bash
cd /Users/tx1138/Code/Neode

# Add all changes
git add neode-ui/mock-backend.js
git add docker/nginx-with-backend.conf
git add test-portainer-deploy.sh
git add FIX-405-ERROR.md

# Commit
git commit -m "Fix 405 error: update CORS, OPTIONS handler, and nginx proxy config"

# Push to GitHub
git push origin master
```

### Step 2: Redeploy in Portainer

**⚠️ Important: Must completely remove and redeploy**

1. In Portainer, go to **Stacks**
2. Find your `neode` stack
3. Click **Remove** (don't just stop it)
4. Wait 10 seconds
5. Click **Add Stack** and redeploy with same settings:
   - Repository: `https://github.com/Zazawowow/Neode`
   - Reference: `refs/heads/master`
   - Compose path: `portainer-stack-vue.yml`
6. Click **Deploy**
7. **⏳ Wait 2-3 minutes** for everything to initialize

### Step 3: Test the Deployment

Run the diagnostic script:

```bash
chmod +x test-portainer-deploy.sh
./test-portainer-deploy.sh
```

This will check:
- ✅ Container status
- ✅ Backend health
- ✅ Backend RPC endpoint
- ✅ Frontend → Backend connectivity
- ✅ Nginx configuration
- ✅ External RPC endpoint

### Step 4: Manual Tests

**Test from command line:**
```bash
# Test OPTIONS (preflight)
curl -X OPTIONS http://neode.l484.com/rpc/v1 -v

# Test POST (actual request)
curl -X POST http://neode.l484.com/rpc/v1 \
  -H "Content-Type: application/json" \
  -d '{"method":"server.echo","params":{"message":"test"}}'
```

Expected response:
```json
{"result":"test"}
```

**Test in browser:**
1. Open https://neode.l484.com
2. Open browser DevTools (F12) → Network tab
3. Try to login with password: `password123`
4. Check Network tab - POST to `/rpc/v1` should return **200 OK** (not 405)

## 🩺 Troubleshooting

### Still Getting 405?

**Check 1: Verify latest code is deployed**
```bash
# Check nginx config
docker exec neode-web cat /etc/nginx/nginx.conf | grep -A 10 "location /rpc/"
```

Should show:
```nginx
location /rpc/ {
    proxy_pass http://neode-backend:5959;
    ...
}
```

**Check 2: Verify backend is responding**
```bash
docker logs neode-backend --tail 20
```

Should see:
```
🚀 Neode Mock Backend Server
Password: password123
```

**Check 3: Test backend directly**
```bash
docker exec neode-backend wget -qO- --post-data='{"method":"server.echo","params":{"message":"test"}}' --header='Content-Type: application/json' http://localhost:5959/rpc/v1
```

Should return: `{"result":"test"}`

**Check 4: Test nginx proxy**
```bash
docker exec neode-web wget -qO- --post-data='{"method":"server.echo","params":{"message":"test"}}' --header='Content-Type: application/json' http://neode-backend:5959/rpc/v1
```

Should return: `{"result":"test"}`

### If backend isn't running:

```bash
# Check why backend failed
docker logs neode-backend

# Common issues:
# - Git clone failed (network)
# - npm install failed (check logs)
# - Port 5959 already in use (unlikely)
```

### If nginx can't reach backend:

```bash
# Check network
docker network inspect neode_neode-network

# Both containers should be in the network
# Try restarting the stack
```

## 📊 Expected Results

### Before Fix ❌
```
POST /rpc/v1
Status: 405 Method Not Allowed
```

### After Fix ✅
```
POST /rpc/v1
Status: 200 OK
Response: {"result": ...}
```

## 🎯 Success Checklist

After deploying, verify:

- [ ] Both containers running and healthy
- [ ] Backend shows "🚀 Neode Mock Backend Server" in logs
- [ ] `./test-portainer-deploy.sh` shows all ✅
- [ ] Browser console shows no 405 errors
- [ ] Can login with `password123`
- [ ] Dashboard loads after login

## 📝 Files Changed

| File | What Changed |
|------|--------------|
| `neode-ui/mock-backend.js` | Fixed CORS, added OPTIONS handler |
| `docker/nginx-with-backend.conf` | Changed location match, added proper headers |
| `test-portainer-deploy.sh` | **NEW** - Diagnostic script |
| `FIX-405-ERROR.md` | **NEW** - This guide |

## 🔗 Related Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - General deployment guide
- [PORTAINER-DEPLOY.md](./PORTAINER-DEPLOY.md) - Portainer quick start
- [CODING_STANDARDS.md](./CODING_STANDARDS.md) - Project coding standards

---

**Still having issues?** Run `./test-portainer-deploy.sh` and share the output!

