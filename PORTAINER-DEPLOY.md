# Portainer Deployment Quick Guide

## 🚀 Deploy in Portainer

### Step 1: Add Stack
1. Go to **Stacks** → **Add Stack**
2. **Name**: `neode`
3. **Build method**: ✅ Repository

### Step 2: Repository Settings
- **Repository URL**: `https://github.com/Zazawowow/Neode`
- **Repository reference**: `refs/heads/master`
- **Compose path**: `portainer-stack-vue.yml`

### Step 3: Deploy
1. Click **Deploy the stack**
2. ⏳ **Wait 2-3 minutes** for everything to initialize

### Step 4: Access
- 🌐 Open: `http://your-server-ip:8100`
- 🔑 Login with: `password123`

---

## ⏱️ Startup Timeline

| Time | What's Happening |
|------|------------------|
| 0s | Containers starting |
| 10-30s | Backend: Installing git, wget, cloning repo |
| 30-60s | Backend: Installing npm dependencies |
| 60-90s | Backend: Starting mock server ✅ |
| 90-120s | Frontend: Building Docker image |
| 120s+ | Frontend: Ready ✅ |

**Total wait time**: ~2-3 minutes

---

## 🩺 Health Checks

### Quick Status Check
```bash
docker ps --filter "name=neode"
```

Look for:
- `neode-backend` - Status: `Up X minutes (healthy)`
- `neode-web` - Status: `Up X minutes (healthy)`

### Backend Status
```bash
docker logs neode-backend --tail 20
```

**Good sign**: You see this:
```
╔════════════════════════════════════════════════════════════╗
║   🚀 Neode Mock Backend Server                            ║
║   Password: password123                                    ║
╚════════════════════════════════════════════════════════════╝
```

**Bad sign**: Errors about npm install or git clone failures

### Frontend Status
```bash
docker logs neode-web --tail 20
```

**Good sign**: No error messages, just access logs

**Bad sign**: "upstream connect error" or "502 Bad Gateway"

---

## 🐛 If You Get 502 Error

### The Problem
The frontend (nginx) can't reach the backend.

### Quick Fix
**Option 1: Wait longer**
- The backend needs 90+ seconds to start
- Check `docker ps` - wait for `(healthy)` status

**Option 2: Restart**
```bash
# In Portainer UI
1. Stop the stack
2. Wait 10 seconds
3. Start the stack
4. Wait 2 minutes
```

**Option 3: Check backend is running**
```bash
# Test backend directly
docker exec neode-backend wget -qO- http://localhost:5959/health
```
Should return: `healthy`

**Option 4: Test connectivity**
```bash
# Test from frontend to backend
docker exec neode-web wget -qO- http://neode-backend:5959/health
```
Should return: `healthy`

If this fails → DNS/network issue → restart stack

---

## 📋 Diagnostic Commands

### Get All Logs
```bash
# Backend logs (last 50 lines)
docker logs neode-backend --tail 50

# Frontend logs (last 50 lines)
docker logs neode-web --tail 50

# Follow logs in real-time
docker logs -f neode-backend
```

### Check Network
```bash
docker network inspect neode_neode-network
```

Both containers should be in the "Containers" section.

### Check Ports
```bash
docker ps --filter "name=neode" --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
```

Should show:
- `neode-backend`: `5959/tcp` (internal only)
- `neode-web`: `0.0.0.0:8100->80/tcp`

### Test API
```bash
# From your host machine
curl -X POST http://localhost:8100/rpc/v1 \
  -H "Content-Type: application/json" \
  -d '{"method":"server.echo","params":{"message":"test"}}'
```

Expected: `{"result":"test"}`

---

## 🔄 Update/Redeploy

### To update to latest code:

**Method 1: In Portainer UI**
1. Go to your `neode` stack
2. Click **Editor**
3. Click **Pull and redeploy** (button at bottom)
4. Wait 2-3 minutes

**Method 2: Command line**
```bash
# Stop and remove
docker stop neode-backend neode-web
docker rm neode-backend neode-web

# Pull latest images
docker pull node:22-alpine
docker pull nginx:alpine

# Restart stack in Portainer
# (It will rebuild from latest GitHub code)
```

---

## 📊 What Each Container Does

### neode-backend
- **Image**: `node:22-alpine`
- **Purpose**: Mock backend API server
- **Exposes**: Port 5959 (internal only)
- **Health**: Responds to `/health` endpoint
- **Provides**:
  - RPC API at `/rpc/v1`
  - WebSocket at `/ws/db`
  - Mock authentication
  - Mock server data

### neode-web
- **Image**: Custom build from GitHub
- **Purpose**: Vue.js frontend + nginx reverse proxy
- **Exposes**: Port 8100 → host
- **Health**: Responds to `/health` endpoint
- **Provides**:
  - Static Vue.js app
  - Proxies `/rpc/v1` → backend
  - Proxies `/ws` → backend
  - Proxies `/public` → backend
  - Proxies `/rest` → backend

---

## 🔐 Security Notes

### Current Setup (Development)
- ⚠️ Mock backend with hardcoded password
- ⚠️ No HTTPS
- ⚠️ Exposed on port 8100

### For Production
Replace mock backend with real Rust backend:
- Real authentication
- Database persistence
- SSL/TLS termination
- Proper secrets management

---

## 📞 Still Having Issues?

1. **Check the full logs** of both containers
2. **Wait the full 2-3 minutes** after deployment
3. **Restart the stack** in Portainer
4. **Check DEPLOYMENT.md** for detailed troubleshooting
5. **Verify port 8100** isn't already in use

---

## ✅ Success Checklist

- [ ] Stack deployed in Portainer
- [ ] Waited 2+ minutes
- [ ] Both containers show `(healthy)` status
- [ ] Can access http://your-ip:8100
- [ ] Login page loads
- [ ] Can login with `password123`
- [ ] Dashboard appears after login

If all checked ✅ → **You're done!** 🎉

---

**Need more help?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting.

