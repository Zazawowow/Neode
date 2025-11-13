# Backend Setup Guide - Real vs Mock

## TL;DR - Quick Start

### Option 1: Real Backend (Recommended for Full Testing)
```bash
# Terminal 1: Start real backend
cd /Users/tx1138/Code/Neode
./start-real-backend.sh

# Terminal 2: Start UI
cd neode-ui
npm run dev
```

### Option 2: Mock Backend (Quick UI Development)
```bash
# Single command (starts both):
cd /Users/tx1138/Code/Neode/neode-ui
npm run dev:mock
```

---

## Comparison

| Feature | Real Backend | Mock Backend |
|---------|-------------|--------------|
| **Startup Time** | 5-10 min first build | Instant |
| **Dependencies** | Rust, PostgreSQL, Docker | Node.js only |
| **Marketplace** | Real apps from Start9 | 4 fake apps |
| **Package Install** | Actually works | Fake response |
| **WebSocket** | Real-time updates | Simulated updates |
| **Best For** | Integration testing | UI development |

---

## Real Backend Setup

### Prerequisites

1. **Rust** (for building)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **PostgreSQL** (for data storage)
   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14
   
   # Linux
   sudo apt-get install postgresql
   ```

3. **Docker** (for running packages)
   - macOS: Install Docker Desktop
   - Linux: `curl -fsSL https://get.docker.com | sh`

### First Time Setup

```bash
cd /Users/tx1138/Code/Neode

# 1. Create database
createdb startos

# 2. Build backend (takes 5-10 minutes)
cd core
cargo build --release

# 3. Start backend
./target/release/startos
```

### Quick Start (After First Build)

```bash
# Use the convenience script:
cd /Users/tx1138/Code/Neode
./start-real-backend.sh
```

Or manually:
```bash
cd /Users/tx1138/Code/Neode/core
./target/release/startos
```

### What You Get

✅ **Real marketplace** - Browse actual apps from Start9 registry  
✅ **Package installation** - Install and run real containerized apps  
✅ **WebSocket updates** - Real-time state synchronization  
✅ **Full API** - All RPC methods work correctly  
✅ **Authentication** - Proper security and sessions  

### Configuration

Create `~/.config/startos/config.yaml`:

```yaml
datadir: ~/.local/share/startos
db-path: ~/.local/share/startos/db
secret-store: postgresql://localhost/startos
bind-rpc: 0.0.0.0:5959
```

---

## Mock Backend Setup

### Prerequisites

Just Node.js (already have it if you're running the UI)

### Quick Start

```bash
cd /Users/tx1138/Code/Neode/neode-ui

# Option A: Mock backend + UI together
npm run dev:mock

# Option B: Just mock backend (UI separately)
npm run backend:mock
```

### What You Get

✅ **4 mock apps** - Bitcoin, Lightning, Nextcloud, BTCPay  
✅ **Instant startup** - No build time  
✅ **No dependencies** - Just Node.js  
✅ **Fast iteration** - Perfect for UI work  
⚠️ **Fake data** - Nothing actually installs  

### Mock Credentials

- **Password:** `password123`

### Customizing Mock Data

Edit `neode-ui/mock-backend.js`:

```javascript
const mockApps = [
  {
    id: 'your-app',
    title: 'Your App',
    description: 'Your description',
    version: '1.0.0',
    // ...
  },
]
```

---

## Development Workflows

### UI-Only Development (Mock Backend)

**Use when:**
- Working on layout/styling
- Building new components
- Don't need real data

**Workflow:**
```bash
cd neode-ui
npm run dev:mock
# Visit: http://localhost:8100
# Login with: password123
```

### Full Integration Testing (Real Backend)

**Use when:**
- Testing actual functionality
- Installing packages
- Testing marketplace integration
- Before deployment

**Workflow:**
```bash
# Terminal 1: Real backend
cd /Users/tx1138/Code/Neode
./start-real-backend.sh

# Terminal 2: UI
cd neode-ui
npm run dev

# Visit: http://localhost:8100
```

### Backend Development

**Working on backend code:**
```bash
cd /Users/tx1138/Code/Neode/core

# Quick compile and run
cargo run

# Or with auto-reload:
cargo install cargo-watch
cargo watch -x run
```

---

## Troubleshooting

### Real Backend Issues

#### "Database connection failed"
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Start it if needed
brew services start postgresql@14

# Create database if missing
createdb startos
```

#### "Port 5959 already in use"
```bash
# Find what's using it
lsof -i :5959

# Kill it
kill <PID>

# Or kill mock backend specifically
pkill -f "mock-backend.js"
```

#### "Rust not found"
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Reload shell
source $HOME/.cargo/env
```

#### "Build failed"
```bash
# Update Rust
rustup update stable

# Clean and rebuild
cargo clean
cargo build --release
```

### Mock Backend Issues

#### "Cannot find module"
```bash
cd neode-ui
npm install
```

#### "Port 5959 already in use"
```bash
# Stop mock backend
pkill -f "mock-backend.js"

# Or stop real backend
pkill startos
```

---

## Portainer Deployment

### Mock Backend (for Portainer)

The `portainer-stack-vue.yml` uses the **mock backend** by default. This is intentional because:

- ✅ No build dependencies needed
- ✅ Runs anywhere with Docker
- ✅ Perfect for demos/previews
- ✅ Quick deployment

To deploy with mock backend:
```bash
docker stack deploy -c portainer-stack-vue.yml neode
```

### Real Backend (for Production)

For production deployment, you'll want the real backend. Create `portainer-stack-real.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: startos
      POSTGRES_PASSWORD: your-secure-password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - neode-network

  neode-backend:
    build:
      context: https://github.com/Zazawowow/Neode.git
      dockerfile: Dockerfile.backend
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://postgres:your-secure-password@postgres/startos
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - backend-data:/data
    networks:
      - neode-network
    ports:
      - "5959:5959"

  neode-web:
    build:
      context: https://github.com/Zazawowow/Neode.git
      dockerfile: Dockerfile.portainer
    depends_on:
      - neode-backend
    ports:
      - "8100:80"
    networks:
      - neode-network

volumes:
  postgres-data:
  backend-data:

networks:
  neode-network:
```

---

## Switching Between Backends

### Switch to Real Backend

```bash
# Stop mock backend
pkill -f "mock-backend.js"

# Start real backend
cd /Users/tx1138/Code/Neode
./start-real-backend.sh
```

### Switch to Mock Backend

```bash
# Stop real backend
pkill startos

# Start mock backend
cd /Users/tx1138/Code/Neode/neode-ui
npm run backend:mock
```

The UI doesn't need to restart - just refresh the page!

---

## Testing Checklist

### With Mock Backend
- [ ] Login works (password123)
- [ ] Dashboard loads
- [ ] Marketplace shows 4 apps
- [ ] No crashes or errors
- [ ] UI looks correct

### With Real Backend
- [ ] Login works (real password)
- [ ] Dashboard shows real data
- [ ] Marketplace loads from Start9
- [ ] Can install packages
- [ ] WebSocket updates work
- [ ] Package management works

---

## Summary

**For Quick UI Work:** Use mock backend (`npm run dev:mock`)  
**For Full Testing:** Use real backend (`./start-real-backend.sh`)  
**For Portainer:** Mock backend is already configured  
**For Production:** Use real backend with proper config

Both backends work with the same UI - just point to port 5959!

---

## Quick Commands Reference

```bash
# Mock Backend
npm run dev:mock              # UI + mock backend
npm run backend:mock          # Just mock backend

# Real Backend  
./start-real-backend.sh       # Automated startup
cd core && cargo run          # Manual startup

# UI Only (backend must be running separately)
npm run dev                   # Development server
npm run build                 # Production build

# Backend Management
lsof -i :5959                 # Check what's on 5959
pkill startos                 # Stop real backend
pkill -f "mock-backend.js"    # Stop mock backend
```

