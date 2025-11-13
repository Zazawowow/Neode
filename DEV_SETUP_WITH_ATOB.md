# Neode Development Setup with ATOB Container

## Overview

This setup runs Neode in development mode with ATOB as a **real containerized service**, just like it would work in production!

## What's Included

- ✅ **ATOB Container** - Real nginx container serving ATOB interface
- ✅ **Mock Backend** - API with ATOB pre-installed  
- ✅ **Vite Dev Server** - Hot module reloading for UI development
- ✅ **Local Launch** - Click "Launch" to open local ATOB instance

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser (localhost:8100)                          │
│  ┌──────────────────────────────────────────┐     │
│  │  Neode UI                                 │     │
│  │  - Apps: Bitcoin, Lightning, ATOB        │     │
│  │  - Click "Launch" on ATOB ──────────┐   │     │
│  └──────────────────────────────────────┘   │     │
└─────────────────────────────────────────────┼─────┘
                                               │
                                               │ Opens
                                               ↓
                          ┌────────────────────────────┐
                          │  ATOB Container            │
                          │  localhost:8101           │
                          │  (nginx serving ATOB)      │
                          └────────────────────────────┘
```

## Quick Start

### Option 1: Stop Your Current Servers and Use Docker Compose

```bash
# Stop current npm processes (Ctrl+C in both terminals)

# Start all services with Docker Compose
cd /Users/tx1138/Code/Neode
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Option 2: Add ATOB Container to Your Existing Setup

If you want to keep running Vite and mock-backend locally:

```bash
# Start just the ATOB container
docker run -d \
  --name neode-atob \
  -p 8101:80 \
  -v $(pwd)/neode-ui/docker/atob-nginx.conf:/etc/nginx/conf.d/default.conf:ro \
  -v $(pwd)/neode-ui/docker/atob-html:/usr/share/nginx/html:ro \
  nginx:alpine

# Continue running your local dev servers as usual
cd neode-ui && npm run dev:mock
```

## Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Neode UI** | http://localhost:8100 | Main Neode dashboard |
| **ATOB** | http://localhost:8101 | ATOB container (direct access) |
| **Mock Backend** | http://localhost:5959 | RPC/WebSocket backend |

## Using ATOB

1. **Access Neode**: Go to http://localhost:8100
2. **Login**: Password is `password123`
3. **Go to Apps**: Click "Apps" in sidebar
4. **See ATOB**: You'll see 3 installed apps including ATOB
5. **Launch ATOB**: Click the "Launch" button on ATOB card
6. **Opens Local Container**: A new tab opens to http://localhost:8101
7. **Running Locally**: ATOB is served from your local Docker container!

## Development Workflow

### Make Changes to ATOB Container

Edit the ATOB interface:
```bash
# Edit the HTML
vim neode-ui/docker/atob-html/index.html

# Restart container to see changes
docker restart neode-atob

# Or if using docker-compose
docker-compose -f docker-compose.dev.yml restart atob
```

### Make Changes to Neode UI

The Vite dev server has HMR, so changes are instant:
```bash
# Edit any Vue file
vim neode-ui/src/views/Apps.vue

# Browser auto-refreshes with changes!
```

### Make Changes to Mock Backend

```bash
# Edit mock backend
vim neode-ui/mock-backend.js

# Restart backend container
docker-compose -f docker-compose.dev.yml restart neode-backend

# Or restart local process if not using Docker
```

## Production Simulation

This setup simulates the production environment where:

1. **Each app runs in its own container**
2. **Apps are isolated** from each other
3. **Neode proxies** access to apps
4. **Launch button** opens the app's interface
5. **Apps can be** started/stopped/restarted

## Ports Summary

- `8100` - Neode UI (Vite dev server)
- `8101` - ATOB container
- `5959` - Mock backend (RPC + WebSocket)

## Troubleshooting

### ATOB Container Won't Start
```bash
# Check if port 8101 is in use
lsof -i :8101

# View container logs
docker logs neode-atob

# Recreate container
docker rm -f neode-atob
docker-compose -f docker-compose.dev.yml up -d atob
```

### Launch Button Opens Wrong URL
```bash
# Check that you're in dev mode
# Edit neode-ui/src/views/Apps.vue
# Verify: const atobUrl = isDev ? 'http://localhost:8101' : ...
```

### Can't Access ATOB Directly
```bash
# Test ATOB container
curl http://localhost:8101/health

# Should return: "healthy"
```

## Benefits of This Setup

✅ **Real Environment**: Tests actual container behavior  
✅ **Isolation**: Each app in its own container like production  
✅ **Fast Development**: Vite HMR for instant UI updates  
✅ **Easy Testing**: Launch apps with one click  
✅ **Production-Ready**: Same architecture as deployment  

## Next Steps

1. **Try it now**: Run `docker-compose -f docker-compose.dev.yml up`
2. **Access Neode**: http://localhost:8100
3. **Launch ATOB**: Click the Launch button!
4. **Add more apps**: Follow the same pattern for other services

## Clean Up

```bash
# Stop all services
docker-compose -f docker-compose.dev.yml down

# Remove volumes (fresh start)
docker-compose -f docker-compose.dev.yml down -v

# Remove images (complete cleanup)
docker-compose -f docker-compose.dev.yml down --rmi all
```

---

**Now you have a full local development environment that works exactly like production!** 🚀

