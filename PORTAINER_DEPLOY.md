# Deploying Neode to Portainer with ATOB Installation

## Prerequisites

- Portainer instance running
- GitHub repository access
- Docker socket access on Portainer host

## Setup Steps

### 1. Update Portainer Stack

1. **Go to Portainer** → **Stacks**
2. **Select your Neode stack** (or create new)
3. **Update the stack configuration** with `portainer-stack-vue.yml`
4. **Deploy**

### 2. What the Stack Does

The updated stack will:

✅ **Install Docker CLI** in the backend container  
✅ **Mount Docker socket** (`/var/run/docker.sock`)  
✅ **Build ATOB image** (`atob:0.1.0`) on startup  
✅ **Expose port 8102** for ATOB containers  

### 3. Port Mappings

| Service | Host Port | Container Port | Purpose |
|---------|-----------|----------------|---------|
| Neode UI | 8100 | 80 | Main web interface |
| Backend | - | 5959 | Mock backend (internal) |
| ATOB | 8102 | - | ATOB app containers |

### 4. First Deployment

When you first deploy/update the stack:

1. **Wait 2-3 minutes** for:
   - Git clone
   - npm install
   - Docker image build
   
2. **Check logs**:
   ```
   docker logs neode-backend
   ```
   
   You should see:
   ```
   Building atob:0.1.0 image...
   Successfully built...
   Starting mock backend on port 5959...
   ```

3. **Verify Docker access**:
   ```
   docker exec neode-backend docker ps
   ```

### 5. Testing Installation

1. **Open Neode** at `http://your-server:8100`
2. **Login** with `password123`
3. **Go to Marketplace**
4. **Click Install** on ATOB
5. **Wait ~5 seconds** for installation
6. **Auto-redirect** to Apps page
7. **Click Launch** → Opens ATOB

### 6. Accessing ATOB

After installation, ATOB will be available at:
```
http://your-server:8102
```

The container will be named: `atob-test`

### 7. Troubleshooting

#### "Installation timeout"

**Check Docker access:**
```bash
docker exec neode-backend docker ps
```

**Check if ATOB image exists:**
```bash
docker exec neode-backend docker images | grep atob
```

**Rebuild ATOB image manually:**
```bash
docker exec neode-backend sh -c 'cd /app/atob-package-build && docker build -t atob:0.1.0 .'
```

#### "Cannot connect to Docker daemon"

The Docker socket mount might not be working. Verify:

```bash
docker exec neode-backend ls -la /var/run/docker.sock
```

If missing, check Portainer permissions and volume mounts.

#### Port 8102 not accessible

Make sure the port is exposed in the stack and not blocked by firewall:

```bash
# Check if port is listening
netstat -tulpn | grep 8102

# Check firewall (if using ufw)
sudo ufw allow 8102
```

#### Container fails to start

Check backend logs:
```bash
docker logs neode-backend --tail 50
```

Look for errors during:
- Docker CLI installation
- Image build
- Container start

### 8. Updating the Stack

To update Neode with new changes:

1. **In Portainer**: Go to your stack
2. **Click "Update stack"**
3. **Enable "Pull latest image"** (if using pre-built images)
4. **Re-deploy**

The backend will:
- Pull latest code from GitHub
- Rebuild ATOB image
- Restart services

### 9. Production Considerations

#### Security

- ✅ Docker socket is mounted **read-only** (`:ro`)
- ⚠️ Backend can still start containers (by design)
- 🔒 Consider using Docker-in-Docker for full isolation

#### Performance

- First startup: ~2-3 minutes (image build)
- Subsequent restarts: ~30 seconds (image cached)
- ATOB installation: ~5 seconds

#### Persistence

Add volumes for persistent data:

```yaml
services:
  neode-backend:
    volumes:
      - neode-data:/app/data
      - /var/run/docker.sock:/var/run/docker.sock:ro

volumes:
  neode-data:
    driver: local
```

### 10. GitHub Integration

The stack automatically pulls from GitHub on startup:

**Repository**: `https://github.com/Zazawowow/Neode.git`  
**Branch**: `master`

To use a different branch:

```yaml
git clone -b your-branch https://github.com/Zazawowow/Neode.git .
```

### 11. Environment Variables

Configure in Portainer stack:

```yaml
environment:
  - NODE_ENV=production
  - BACKEND_URL=http://neode-backend:5959
  - DOCKER_HOST=unix:///var/run/docker.sock
```

### 12. Monitoring

**Check backend health:**
```bash
curl http://localhost:5959/health
```

**Check frontend health:**
```bash
curl http://localhost:8100/health
```

**List running app containers:**
```bash
docker ps --filter name=test
```

### 13. Cleaning Up

**Remove ATOB container:**
```bash
docker exec neode-backend docker rm -f atob-test
```

**Remove ATOB image:**
```bash
docker exec neode-backend docker rmi atob:0.1.0
```

**Full stack cleanup:**
1. Stop stack in Portainer
2. Remove volumes (if needed)
3. Clean up orphaned containers

---

## Quick Reference

### Commands

```bash
# View backend logs
docker logs -f neode-backend

# View frontend logs
docker logs -f neode-web

# Restart backend only
docker restart neode-backend

# Access backend shell
docker exec -it neode-backend sh

# Check Docker access from backend
docker exec neode-backend docker ps

# Manual ATOB install (testing)
docker exec neode-backend docker run -d --name atob-test -p 8102:80 atob:0.1.0
```

### URLs

- **Neode UI**: `http://your-server:8100`
- **ATOB** (after install): `http://your-server:8102`
- **Backend health**: `http://your-server:5959/health`

---

**🎉 Your Neode stack is now ready with full Docker integration!**

