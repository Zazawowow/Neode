# K484 Integration Guide

## Overview

K484 is now a complete POS and Administration system with a splash screen that lets users choose between two modes:
- **POS Mode**: Point of Sale interface for transactions
- **Admin Mode**: Administration panel for management

## Package Structure

### K484 Package (`~/k484-package/`)
- **Version**: 0.1.0
- **Port**: 8103
- **URL**: http://localhost:8103 (self-hosted splash screen)
- **Docker Image**: `k484:0.1.0` ✅

## Features

### Splash Screen
When you launch K484, you see a beautiful gradient splash screen with two options:
- **POS Button** - Opens the Point of Sale interface
- **Admin Button** - Opens the Administration panel

### POS Mode
- Product catalog and inventory management
- Quick checkout and payment processing
- Receipt printing and email
- Real-time sales tracking
- Customer management

### Admin Mode
- User and role management
- System configuration
- Reports and analytics
- Inventory oversight
- Financial summaries
- Backup and maintenance

## Files Structure

```
~/k484-package/
├── manifest.yaml              # S9PK manifest
├── LICENSE.md                 # MIT License
├── INSTRUCTIONS.md            # User instructions
├── Dockerfile                 # Docker build config
├── index.html                 # ✨ NEW: Splash screen with POS/Admin
├── icon.png                   # App icon
└── scripts/
    ├── deps.ts
    └── procedures/
        └── main.ts
```

## Integration Points

### 1. Marketplace (`neode-ui/src/views/Marketplace.vue`)
- K484 listed as "Point of Sale and Admin system for Neode"
- Updated description to reflect POS and Admin functionality
- **Amin removed** - now just one unified K484 app

### 2. Mock Backend (`neode-ui/mock-backend.js`)
- K484 port: **8103**
- **Amin removed** from port mappings
- Docker container management for k484-test

### 3. Apps View (`neode-ui/src/views/Apps.vue`)
- K484 launches to localhost:8103 (self-hosted)
- **Amin removed** from URL mappings
- Launch opens splash screen in new tab

### 4. App Details (`neode-ui/src/views/AppDetails.vue`)
- K484 launch button opens splash screen
- **Amin removed** from URL mappings

## Testing Locally

### 1. Container Status
```bash
# Check if k484 is running
docker ps | grep k484

# Should show:
# k484-test ... Up ... 0.0.0.0:8103->80/tcp
```

### 2. Test the Splash Screen
```bash
# Open directly
open http://localhost:8103
```

You should see:
1. **Splash Screen** with purple gradient
2. **K484** logo
3. **POS** and **Admin** buttons
4. Click each to see the respective interfaces

### 3. Install from Marketplace
```bash
cd /Users/tx1138/Code/Neode/neode-ui
npm run dev:mock
```

Then:
1. Navigate to **Marketplace**
2. Find **K484** (Point of Sale and Admin system)
3. Click **Install**
4. Go to **Apps**
5. Click **Launch** on K484
6. Splash screen opens in new tab
7. Choose **POS** or **Admin**

## How It Works

### Splash Screen Technology
- **Self-contained HTML** - No external dependencies
- **Pure CSS** - Beautiful gradients and animations
- **Vanilla JavaScript** - Simple page routing
- **Responsive Design** - Works on all screen sizes

### Page Routing
```javascript
// Click POS button
showPage('pos') → Shows POS interface

// Click Admin button  
showPage('admin') → Shows Admin interface

// Click Back button
showSplash() → Returns to splash screen
```

### URL Behavior
- **Development**: Opens `http://localhost:8103`
- **Production**: Opens `http://localhost:8103` (self-hosted container)
- **No external URLs** - Everything runs in the container

## Port Allocation

| App  | Port | Container | Status |
|------|------|-----------|--------|
| ATOB | 8102 | atob-test | ✅ Working |
| K484 | 8103 | k484-test | ✅ Working (NEW splash screen) |

## Rebuilding

If you need to update the splash screen:

```bash
# Edit the splash screen
nano ~/k484-package/index.html

# Rebuild Docker image
cd ~/k484-package
docker build -t k484:0.1.0 .

# Restart container
docker stop k484-test && docker rm k484-test
docker run -d --name k484-test -p 8103:80 k484:0.1.0

# Test
open http://localhost:8103
```

## Customization

### Change Splash Screen Design
Edit `~/k484-package/index.html`:
- Colors: Change gradient in `background` CSS
- Buttons: Update `.mode-button` styles
- Layout: Modify HTML structure

### Add More Modes
Add a new button to the splash screen:
```html
<button class="mode-button" onclick="showPage('reports')">
    Reports
</button>
```

Then add the corresponding page:
```html
<div id="reports-page" class="page">
    <!-- Your content here -->
</div>
```

## What Changed

### ✅ Completed
- Created beautiful splash screen with POS/Admin options
- Removed Amin as separate app
- K484 is now one unified app with two modes
- Fixed URL issue (no more "k484.app not found")
- Rebuilt Docker image with new splash screen
- Updated marketplace description
- Updated launch URLs in Apps.vue and AppDetails.vue
- Removed Amin from all UI components
- Removed Amin from mock backend

### ❌ Removed
- Amin package (no longer needed)
- Amin marketplace entry
- Amin port mapping (8104)
- Amin URL references
- External k484.app URL (now self-hosted)

## Summary

✅ **K484 Unified App** - Single app with POS and Admin modes  
✅ **Beautiful Splash Screen** - Purple gradient with mode selection  
✅ **Self-Hosted** - No external URLs, all in container  
✅ **Amin Removed** - Functionality merged into K484  
✅ **Port 8103** - Single port for entire K484 system  
✅ **Launch Working** - Opens splash screen correctly  

The K484 app is now ready with a professional splash screen that lets users choose their mode! 🚀

