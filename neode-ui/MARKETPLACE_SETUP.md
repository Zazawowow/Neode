# Marketplace Integration - Quick Start

## Overview

The Neode marketplace is now integrated with the StartOS registry. You can browse, install apps, and sideload local packages directly from the UI.

## What Was Added

### 1. **RPC Client Methods** (`src/api/rpc-client.ts`)
- `getMarketplace(url)` - Fetch apps from a marketplace URL
- `sideloadPackage(manifest, icon)` - Upload local .s9pk packages

### 2. **Store Actions** (`src/stores/app.ts`)
- Connected marketplace methods to Pinia store
- Available throughout the app via `useAppStore()`

### 3. **Marketplace UI** (`src/views/Marketplace.vue`)
- **Browse Apps**: View apps from Start9 Registry or Community Registry
- **Install Apps**: One-click installation from marketplace
- **Sideload Packages**: Upload local .s9pk files
- **App Details**: Modal with full app information
- **Loading/Error States**: Polished UX with proper feedback

## Using the Marketplace

### Testing the UI Locally

```bash
cd /Users/tx1138/Code/Neode/neode-ui
npm run dev
```

Navigate to: `http://localhost:8100/marketplace`

### Development Workflow

1. **Start Backend** (if you have it running locally):
   ```bash
   cd /Users/tx1138/Code/Neode
   # Start your Neode backend on port 5959
   ```

2. **Start Vue Dev Server**:
   ```bash
   cd neode-ui
   npm run dev
   ```

3. **Access Marketplace**: Visit `http://localhost:8100` and login, then navigate to Marketplace

### Marketplace URLs

The UI is preconfigured with:
- **Start9 Registry**: `https://registry.start9.com` (default)
- **Community Registry**: `https://community-registry.start9.com`

You can easily add more marketplaces by editing `Marketplace.vue`:

```typescript
const marketplaces = ref([
  { name: 'Start9 Registry', url: 'https://registry.start9.com' },
  { name: 'Community Registry', url: 'https://community-registry.start9.com' },
  { name: 'My Custom Registry', url: 'https://my-registry.example.com' },
])
```

## Installing Apps

### From Marketplace

1. Navigate to **Marketplace** in the sidebar
2. Browse available apps
3. Click on an app card to see details
4. Click **Install** button
5. Installation will start (job ID logged to console)

### Sideload Local Package

1. Click **Sideload Package** button (top right)
2. Select your `.s9pk` file
3. Upload will begin automatically

**Note**: Full sideload implementation requires parsing the s9pk file format in the browser. For now, use the backend CLI for sideloading (see below).

## Backend CLI Method (Recommended for Development)

For reliable package installation during development:

```bash
# Build the StartOS CLI
cd /Users/tx1138/Code/Neode/core
cargo build --release --bin startos

# Install a package
./target/release/startos package.sideload /path/to/package.s9pk

# List installed packages
./target/release/startos package.list

# Start/stop packages
./target/release/startos package.start <package-id>
./target/release/startos package.stop <package-id>

# Uninstall
./target/release/startos package.uninstall <package-id>
```

## Creating Your First Package

See **`PACKAGING_S9PK_GUIDE.md`** for a complete guide on packaging the nostrdevs/atob project (or any containerized app) as an `.s9pk` file.

Quick overview:
1. Create package directory with manifest.yaml
2. Export Docker image
3. Add icon, license, instructions
4. Pack with `startos pack`
5. Install via UI or CLI

## API Reference

### RPC Methods Available

```typescript
// Fetch marketplace catalog
await rpcClient.getMarketplace('https://registry.start9.com')

// Install from marketplace
await rpcClient.installPackage('bitcoin', 'https://registry.start9.com', '1.0.0')

// Sideload local package
await rpcClient.sideloadPackage(manifestObj, iconBase64)

// Package management
await rpcClient.startPackage('bitcoin')
await rpcClient.stopPackage('bitcoin')
await rpcClient.restartPackage('bitcoin')
await rpcClient.uninstallPackage('bitcoin')
```

### Store Methods

```typescript
import { useAppStore } from '@/stores/app'

const store = useAppStore()

// Marketplace
const apps = await store.getMarketplace('https://registry.start9.com')

// Installation
const jobId = await store.installPackage('bitcoin', marketplaceUrl, '1.0.0')

// Package control
await store.startPackage('bitcoin')
await store.stopPackage('bitcoin')
```

## Architecture

### How It Works

1. **Frontend** (Vue): Makes RPC calls to `/rpc/v1` endpoint
2. **Backend** (Rust): Handles marketplace fetching, package installation
3. **WebSocket** (`/ws/db`): Real-time updates for package status
4. **Registry**: External marketplace servers provide app catalogs

### Data Flow

```
Vue Component
    ↓
Pinia Store
    ↓
RPC Client (fetch /rpc/v1)
    ↓
Backend (Rust startos)
    ↓
Marketplace Registry OR Local S9PK
    ↓
Docker Container Installation
    ↓
WebSocket Update (package status)
    ↓
Vue Component (reactive update)
```

## Customization

### Adding Custom Registries

Edit `src/views/Marketplace.vue`:

```typescript
const marketplaces = ref([
  { name: 'My Registry', url: 'https://my-registry.com' },
])
```

### Styling

All marketplace UI uses the global glassmorphism utilities:
- `.glass-card` - Glass card container
- `.glass-button` - Glass button style
- `.gradient-button` - Gradient button with hover

Modify these in `src/style.css` to change the entire marketplace look.

## Troubleshooting

### Marketplace Not Loading

1. **Check backend is running**: Ensure Neode backend is accessible at port 5959
2. **Check CORS**: Vite proxy should handle this (see `vite.config.ts`)
3. **Check console**: Open browser DevTools and look for RPC errors
4. **Try different registry**: Switch to Community Registry to test

### Installation Fails

1. **Check backend logs**: Look for errors in Neode backend
2. **Verify package format**: Use `startos inspect package.s9pk`
3. **Check disk space**: Ensure sufficient space for package installation
4. **Review dependencies**: Some packages require other packages first

### Sideload Not Working

Currently, browser-based sideload requires s9pk parsing library. Use CLI method:

```bash
cd /Users/tx1138/Code/Neode/core
cargo build --release
./target/release/startos package.sideload /path/to/package.s9pk
```

## Next Steps

1. **Test with Real Backend**: Connect to a running Neode instance
2. **Package ATOB**: Follow `PACKAGING_S9PK_GUIDE.md` to create your first package
3. **Add Installation Progress**: Show progress bars for ongoing installations
4. **Implement Package Updates**: Add update checking and one-click updates
5. **Add Package Search**: Filter/search functionality for large catalogs

## Resources

- **StartOS Registry**: https://registry.start9.com
- **Package Development**: See `PACKAGING_S9PK_GUIDE.md`
- **Backend Source**: `/Users/tx1138/Code/Neode/core/startos/src/`
- **Manifest Schema**: `/Users/tx1138/Code/Neode/core/startos/src/s9pk/manifest.rs`

## Development Tips

### Hot Reload

Vite provides instant hot reload. Save any Vue file and see changes immediately without refresh.

### Mock Data

For UI development without backend:

```typescript
// In Marketplace.vue, temporarily mock data:
async function loadMarketplace() {
  loading.value = false
  apps.value = [
    {
      id: 'bitcoin',
      title: 'Bitcoin Core',
      description: 'A full Bitcoin node',
      version: '25.0.0',
      icon: '/assets/img/bitcoin.png'
    },
    // ... more mock apps
  ]
}
```

### Debug RPC Calls

Add logging to `src/api/rpc-client.ts`:

```typescript
async call<T>(options: RPCOptions): Promise<T> {
  console.log('RPC Call:', options)
  const response = await fetch(/* ... */)
  const data = await response.json()
  console.log('RPC Response:', data)
  return data.result as T
}
```

---

**Happy packaging!** 🎁

If you have questions or run into issues, check the backend logs and browser console for debugging information.

