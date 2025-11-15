# 🐳 Running Real Apps with Docker

The mock backend can run **actual** Docker containers for your apps, not just simulate them!

## Current Status

Check the banner when starting the mock backend:

```
🐳 Available (apps will run for real!)     ← Docker is running, apps will work!
⚠️  Not available (simulated mode)         ← Docker off, apps simulated only
```

## Setup for Real Apps

### 1. Start Docker Desktop

Make sure Docker Desktop is running:

```bash
# Check if Docker daemon is running
docker ps

# If you see: "Cannot connect to the Docker daemon..."
# → Open Docker Desktop application
```

### 2. Build Your App Docker Images

For each app you want to run, you need a Docker image built with the exact name and version:

**For k484:**
```bash
# Assuming you have k484-package/ directory with a Dockerfile
cd ~/k484-package
docker build -t k484:0.1.0 .
```

**For atob:**
```bash
# Assuming you have atob-package/ directory with a Dockerfile
cd ~/atob-package
docker build -t atob:0.1.0 .
```

**For amin:**
```bash
cd ~/amin-package
docker build -t amin:0.1.0 .
```

### 3. Restart the Dev Server

```bash
npm stop
npm start
```

You should now see: `🐳 Available (apps will run for real!)`

### 4. Install Apps in the UI

Visit http://localhost:8100, go to Marketplace, and install apps.

You'll see logs like:
```
[Package] 📦 Installing k484...
[Package] 🐳 Docker available, attempting to run container...
[Package] 🐳 Docker container running on port 8103
[Package] ✅ k484 installed and RUNNING at http://localhost:8103
```

### 5. Launch Apps

Click "Launch" on any installed app - it will open at:
- **atob**: http://localhost:8102
- **k484**: http://localhost:8103  
- **amin**: http://localhost:8104

---

## Port Mapping

The mock backend uses fixed ports for known apps:

| App | Port | Container Name |
|-----|------|----------------|
| atob | 8102 | atob-test |
| k484 | 8103 | k484-test |
| amin | 8104 | amin-test |
| Other apps | 8105+ | {id}-test |

---

## Docker Image Requirements

Each app needs a Docker image with:
- **Name**: `{app-id}:0.1.0`
- **Port**: Expose port 80 inside container
- **Format**: Standard web app serving HTTP

Example Dockerfile:
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Troubleshooting

### "Docker image not found"

**Problem**: App installs but logs show:
```
[Package] ℹ️  Docker image k484:0.1.0 not found, using simulation mode
```

**Solution**: Build the Docker image first:
```bash
cd ~/k484-package
docker build -t k484:0.1.0 .
```

### "Port is already allocated"

**Problem**:
```
Bind for 0.0.0.0:8103 failed: port is already allocated
```

**Solution**: Stop the existing container:
```bash
docker stop k484-test
docker rm k484-test
```

Or use the UI to uninstall the app first, which will clean up the container.

### "Cannot connect to Docker daemon"

**Problem**:
```
⚠️  Not available (simulated mode)
```

**Solution**:
1. Open Docker Desktop
2. Wait for it to fully start (whale icon in menu bar should be steady)
3. Restart dev server: `npm stop && npm start`

### App appears installed but Launch doesn't work

**Simulated mode**: The app is only simulated in the database, no real container is running.

**Check the logs** when installing to see if Docker was used:
```
# Docker mode (good):
[Package] 🐳 Docker container running on port 8103
[Package] ✅ k484 installed and RUNNING at http://localhost:8103

# Simulated mode (no container):
[Package] ℹ️  Docker not available, using simulation mode
[Package] ✅ k484 installed (simulated - no Docker container)
```

---

## Checking Running Containers

```bash
# List all running containers
docker ps

# Check specific container
docker ps --filter name=k484-test

# View container logs
docker logs k484-test

# Stop a container
docker stop k484-test

# Remove a container
docker rm k484-test
```

---

## Benefits of Docker Mode

✅ **Real apps** - Actually test your applications  
✅ **Full functionality** - All features work (not just UI)  
✅ **Integration testing** - Test API calls, WebSocket, etc.  
✅ **Realistic development** - Matches production environment

## Benefits of Simulated Mode

✅ **No Docker required** - Lightweight development  
✅ **Fast startup** - No containers to build/start  
✅ **UI testing** - Perfect for frontend-only work  
✅ **Lower resource usage** - No Docker overhead

---

## Auto-Detection

The mock backend automatically:
1. Checks if Docker daemon is running
2. Checks if image exists for the app
3. Tries to start container if possible
4. Falls back to simulation if Docker unavailable

This means you can develop with or without Docker, and the system adapts automatically!

---

## Uninstalling Apps

When you uninstall an app through the UI:
- **Docker mode**: Stops and removes the container
- **Simulated mode**: Just removes from database

Both clean up properly - no manual cleanup needed!

---

## Quick Reference

```bash
# Start Docker Desktop first
open -a Docker

# Build images (one-time setup)
cd ~/k484-package && docker build -t k484:0.1.0 .
cd ~/atob-package && docker build -t atob:0.1.0 .

# Start dev servers
cd neode-ui
npm start

# Should see: 🐳 Available (apps will run for real!)

# Install apps via UI at http://localhost:8100
# Apps will actually run at their ports!

# Stop everything when done
npm stop
```

---

Happy coding! 🚀🐳

