# Neode Deployment Guide

This document explains the different ways to run and deploy Neode.

## 🚀 Quick Start

### Local Development (Recommended)

For local development, simply run the Vue UI with Vite's dev server:

```bash
cd neode-ui
npm install
npm run dev
```

This will start:
- **Frontend**: http://localhost:8100 (with hot module reload)
- **Vite proxy**: Automatically proxies API calls to your backend

#### Optional: Run Mock Backend

If you don't have a real backend running, you can start the mock backend:

```bash
cd neode-ui
npm run dev:mock
```

Or run them separately:

```bash
# Terminal 1 - Backend
cd neode-ui
npm run backend:mock

# Terminal 2 - Frontend
cd neode-ui
npm run dev
```

**Mock credentials**: Password is `password123`

---

## 🐳 Docker Deployments

### 1. Local Docker Testing (Frontend Only)

Use this to test the Docker build locally without a backend:

```bash
docker-compose up --build
```

This builds and runs the frontend on http://localhost:8100

**Note**: This won't have full functionality since there's no backend. It's mainly for testing the Docker build process.

---

### 2. Portainer Stack (Full Deployment)

Use **`portainer-stack-vue.yml`** for full deployments with both frontend and mock backend.

#### In Portainer:

1. Go to **Stacks** → **Add Stack**
2. **Name**: `neode`
3. **Build method**: Repository
4. **Repository URL**: `https://github.com/Zazawowow/Neode`
5. **Repository reference**: `refs/heads/master`
6. **Compose path**: `portainer-stack-vue.yml`
7. Click **Deploy the stack**

#### What gets deployed:

- **neode-backend**: Mock backend server (Node.js + Express)
  - RPC API on port 5959
  - WebSocket on port 5959
  - Mock credentials: `password123`
  
- **neode-web**: Vue UI (Nginx)
  - Frontend on port 8100
  - Proxies API calls to backend
  - Auto-connects to backend via internal network

#### Access:

- Frontend: http://localhost:8100
- Login with: `password123`

---

## 📁 File Structure

```
/Users/tx1138/Code/Neode/
├── Dockerfile                    # Frontend-only Docker build (for local testing)
├── Dockerfile.portainer          # Frontend with backend proxy (for Portainer)
├── docker-compose.yml           # Local Docker testing (frontend only)
├── portainer-stack-vue.yml      # Full Portainer deployment (frontend + backend)
├── docker/
│   ├── nginx.conf               # Basic nginx config (no proxy)
│   └── nginx-with-backend.conf  # Nginx with backend proxy
└── neode-ui/
    ├── mock-backend.js          # Mock backend server
    ├── package.json
    └── src/...
```

---

## 🔧 Configuration

### Frontend Environment

The frontend automatically detects which backend to use:

- **Development (`npm run dev`)**: Vite proxies to `http://localhost:5959`
- **Docker with Portainer**: Nginx proxies to `http://neode-backend:5959`
- **Frontend-only Docker**: No backend (API calls will fail)

### Backend Configuration

The mock backend is configured in `neode-ui/mock-backend.js`:

- Default password: `password123`
- Default port: `5959`
- WebSocket path: `/ws/db`
- RPC endpoint: `/rpc/v1`

---

## 🔐 Authentication

### Mock Backend Credentials

- **Password**: `password123`
- **Session**: Cookie-based (automatically handled)

### Changing the Mock Password

Edit `neode-ui/mock-backend.js`:

```javascript
const MOCK_PASSWORD = 'your-new-password'
```

---

## 🐞 Troubleshooting

### 502 Bad Gateway Error on Login

**Symptom**: Get "Failed to load resource: the server responded with a status of 502 ()" on `/rpc/v1`

**This means nginx can't reach the backend.** Here's how to fix it:

**Step 1: Check if backend is running**
```bash
docker ps | grep neode-backend
```

Should show: `neode-backend` with status `Up` and `(healthy)`

If not healthy yet, wait 90 seconds - the backend needs time to:
1. Install git and wget
2. Clone the repository
3. Install npm dependencies
4. Start the mock server

**Step 2: Check backend logs**
```bash
docker logs neode-backend
```

Should see:
```
🚀 Neode Mock Backend Server
RPC:       http://localhost:5959/rpc/v1
Password: password123
```

**Step 3: Test backend directly**
```bash
docker exec neode-backend wget -qO- http://localhost:5959/health
```

Should return: `healthy`

**Step 4: Check networking**
```bash
docker network inspect neode_neode-network
```

Both `neode-backend` and `neode-web` should be in the same network.

**Step 5: Test from web container**
```bash
docker exec neode-web wget -qO- http://neode-backend:5959/health
```

Should return: `healthy`. If this fails, there's a DNS issue.

**Step 6: Check nginx logs**
```bash
docker logs neode-web | grep error
```

Look for upstream connection errors.

**Step 7: Restart stack**

If all else fails:
1. In Portainer, stop the stack
2. Wait 10 seconds
3. Start the stack again
4. Wait 2 minutes for everything to initialize

**Common causes:**
- Frontend started before backend was ready (fixed with healthcheck)
- Backend failed to install dependencies (check backend logs)
- DNS resolution issue (check network config)
- Port 5959 already in use (unlikely in Portainer)

---

### "Can't login" in Portainer

**Symptom**: Login page shows but password works (no 502 error).

**Solutions**:
1. Check if backend is running:
   ```bash
   docker logs neode-backend
   ```
   Should show: `🚀 Neode Mock Backend Server`

2. Verify password is `password123`

3. Check nginx proxy:
   ```bash
   docker exec neode-web cat /etc/nginx/nginx.conf
   ```
   Should contain `upstream backend` and proxy rules

4. Test API connection:
   ```bash
   curl -X POST http://localhost:8100/rpc/v1 \
     -H "Content-Type: application/json" \
     -d '{"method":"server.echo","params":{"message":"test"}}'
   ```
   Should return: `{"result":"test"}`

### Build fails with "Node.js version" error

**Solution**: The Dockerfiles now use Node.js 22. If you see this error:
- Update `Dockerfile` to use `FROM node:22-alpine`
- Clear Docker build cache: `docker builder prune`

### "Connection refused" errors

**Symptom**: Frontend can't reach backend.

**Solutions**:
1. Verify both containers are on same network:
   ```bash
   docker network inspect neode_neode-network
   ```

2. Check if backend is listening:
   ```bash
   docker exec neode-backend netstat -tuln | grep 5959
   ```

3. Rebuild with:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

---

## 📊 Comparison: Deployment Methods

| Method | Frontend | Backend | Use Case |
|--------|----------|---------|----------|
| `npm run dev` | ✅ Vite (HMR) | ❌ External | **Development** |
| `npm run dev:mock` | ✅ Vite (HMR) | ✅ Mock | **Development with mock data** |
| `docker-compose.yml` | ✅ Docker | ❌ None | **Testing Docker build** |
| `portainer-stack-vue.yml` | ✅ Docker | ✅ Mock | **Full deployment** |

---

## 🚦 Next Steps

1. **For local development**: Use `npm run dev` or `npm run dev:mock`
2. **For Portainer deployment**: Use `portainer-stack-vue.yml`
3. **For production**: Replace mock backend with real Rust backend

---

## 🔗 Related Files

- [CODING_STANDARDS.md](./CODING_STANDARDS.md) - Coding conventions
- [neode-ui/README.md](./neode-ui/README.md) - Vue UI documentation
- [neode-ui/README-MOCK-BACKEND.md](./neode-ui/README-MOCK-BACKEND.md) - Mock backend details

---

**Questions?** Check the troubleshooting section above or review the mock backend logs.

