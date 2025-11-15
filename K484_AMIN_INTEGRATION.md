# K484 and Amin Integration Guide

## Overview

Two new s9pk packages have been created for Neode: **K484** and **Amin**. Both are installable and uninstallable through the marketplace, just like ATOB.

## Package Structure

### K484 Package (`~/k484-package/`)
- **Version**: 0.1.0
- **Port**: 8103
- **Dev URL**: http://localhost:8103
- **Prod URL**: https://k484.app
- **Docker Image**: `k484:0.1.0`

### Amin Package (`~/amin-package/`)
- **Version**: 0.1.0
- **Port**: 8104
- **Dev URL**: http://localhost:8104
- **Prod URL**: https://amin.app
- **Docker Image**: `amin:0.1.0`

## Files Created

Both packages contain the same structure as ATOB:

```
~/k484-package/                     ~/amin-package/
├── manifest.yaml                   ├── manifest.yaml
├── LICENSE.md                      ├── LICENSE.md
├── INSTRUCTIONS.md                 ├── INSTRUCTIONS.md
├── Dockerfile                      ├── Dockerfile
├── index.html                      ├── index.html
├── icon.png                        ├── icon.png
└── scripts/                        └── scripts/
    ├── deps.ts                         ├── deps.ts
    └── procedures/                     └── procedures/
        └── main.ts                         └── main.ts
```

## Docker Images

Both Docker images have been built:
- `k484:0.1.0` ✅
- `amin:0.1.0` ✅

Both use Nginx Alpine to serve an iframe embedding their respective web apps.

## Integration Points

### 1. Marketplace (`neode-ui/src/views/Marketplace.vue`)
- Added K484 and Amin to the `availableApps` list
- Each app has its own description and s9pk URL
- Apps appear as installable packages in the marketplace

### 2. Mock Backend (`neode-ui/mock-backend.js`)
- Updated port mappings:
  - ATOB: 8102
  - K484: 8103
  - Amin: 8104
- Enhanced package path detection for error messages
- Docker container management for both apps

### 3. Apps View (`neode-ui/src/views/Apps.vue`)
- Updated `launchApp()` function with URL mapping for all three apps
- Supports both development (localhost) and production URLs
- Launch buttons work for all installed apps

### 4. App Details (`neode-ui/src/views/AppDetails.vue`)
- Updated `launchApp()` function with same URL mappings
- Details page launch button works for K484 and Amin

## Testing Locally

### 1. Install from Marketplace
```bash
# Make sure Docker images are built (already done)
docker images | grep -E "k484|amin"

# Start the mock backend and dev server
cd neode-ui
npm run dev:mock
```

### 2. In the UI
1. Navigate to **Marketplace**
2. Click **Install** on K484 or Amin
3. Wait for installation to complete
4. Navigate to **Apps**
5. Click **Launch** to open the app

### 3. Direct Container Access
```bash
# K484
open http://localhost:8103

# Amin
open http://localhost:8104
```

## Port Allocation

| App  | Port | Container | Status |
|------|------|-----------|--------|
| ATOB | 8102 | atob-test | ✅ Working |
| K484 | 8103 | k484-test | ✅ Ready |
| Amin | 8104 | amin-test | ✅ Ready |

## Production URLs

When not in development mode, the apps will open:
- **K484**: https://k484.app (embedded in iframe)
- **Amin**: https://amin.app (embedded in iframe)

Note: Update these URLs if different production URLs are needed.

## Uninstallation

Both apps support uninstallation:
1. Click the trash icon on the app card in the Apps view
2. Confirm the uninstall modal
3. Docker container is stopped and removed
4. App disappears from the installed apps list

## Package Building (if needed)

If you need to rebuild the Docker images:

```bash
# K484
cd ~/k484-package
docker build -t k484:0.1.0 .

# Amin
cd ~/amin-package
docker build -t amin:0.1.0 .
```

## Creating S9PK Files (optional)

To create actual s9pk files:

```bash
# Ensure StartOS SDK is built
cd ~/Code/Neode/core
cargo build --release

# Package K484
cd ~/k484-package
~/Code/Neode/core/target/release/startbox sdk pack

# Package Amin
cd ~/amin-package
~/Code/Neode/core/target/release/startbox sdk pack
```

## Customization

To customize the apps:

### Change Embedded URL
Edit `index.html` in each package:
```html
<iframe src="https://your-custom-url.com" allow="fullscreen"></iframe>
```

### Change App Icon
Replace `icon.png` in each package directory.

### Update Descriptions
Edit the marketplace descriptions in:
`neode-ui/src/views/Marketplace.vue`

## Summary

✅ **K484 Package Created** - Full s9pk structure with Docker image
✅ **Amin Package Created** - Full s9pk structure with Docker image  
✅ **Marketplace Integration** - Both apps available for installation
✅ **Mock Backend Support** - Install/uninstall functionality working
✅ **Launch Functionality** - Both apps open correctly on their ports
✅ **Port Allocation** - K484 (8103), Amin (8104)
✅ **Separate Packages** - Fully independent from each other and ATOB

Both apps are ready for testing and demonstration! 🚀

