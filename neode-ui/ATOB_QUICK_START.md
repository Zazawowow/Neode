# ATOB Quick Start Guide

## 🚀 See ATOB in Action (30 seconds)

### Step 1: Start the Dev Server
```bash
cd /Users/tx1138/Code/Neode/neode-ui
npm run dev
```

### Step 2: Login
- Open: http://localhost:8100
- Password: `password123`

### Step 3: View ATOB
- Click "Apps" in the sidebar
- See ATOB pre-installed and running
- Click the **"Launch"** button (gradient blue)
- ATOB web app opens in new tab!

## 📦 What's Pre-Installed

ATOB comes pre-loaded in the mock backend with:
- ✅ Status: Running
- ✅ Version: 0.1.0  
- ✅ Icon: Blue ATOB logo
- ✅ Launch button: Opens https://app.atobitcoin.io
- ✅ Start/Stop/Restart: Full controls

## 🎯 Features to Test

### In Apps List
1. See ATOB card with icon
2. Status badge shows "running" (green)
3. Launch button appears (gradient)
4. Click Launch → opens web app

### In App Details
1. Click on ATOB card
2. See full description
3. Big Launch button at top
4. Action buttons below
5. Back to Apps link

### Actions Available
- **Launch**: Opens ATOB web app
- **Stop**: Simulates stopping (mock)
- **Restart**: Simulates restart (mock)
- Click card → View details

## 🎨 Visual Elements

```
┌─────────────────────────────────────────────┐
│  Apps                                       │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  [ATOB Icon]  A to B Bitcoin       │   │
│  │               Tools and services     │   │
│  │               [running] v0.1.0      │   │
│  │                                     │   │
│  │  [Launch] [Stop]                   │   │ ← Launch button!
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  [Bitcoin Icon] Bitcoin Core       │   │
│  │  ...                               │   │
└─────────────────────────────────────────────┘
```

## 📋 Mock Data Structure

ATOB is defined in `neode-ui/mock-backend.js`:

```javascript
'atob': {
  title: 'A to B Bitcoin',
  version: '0.1.0',
  status: 'running',      // ← Shows as running
  state: 'installed',     // ← Already installed
  manifest: {
    id: 'atob',
    interfaces: {
      main: {
        ui: true,         // ← Makes Launch button appear
      }
    }
  }
}
```

## 🔧 Troubleshooting

### Launch Button Not Showing?
- Check app state is 'running'
- Verify manifest has `interfaces.main.ui: true`
- Restart dev server

### ATOB Not in Apps List?
- Check mock-backend.js has atob entry
- Verify WebSocket connection
- Check browser console for errors

### Launch Opens Wrong URL?
- Check Apps.vue launchApp() function
- Should open: https://app.atobitcoin.io

## 🎁 Bonus: Production Package

A complete s9pk package is also available at:
`~/atob-package/atob.s9pk` (23MB)

Install on real Neode server:
```bash
start-cli package.install ~/atob-package/atob.s9pk
```

## 📖 More Info

- **Full Integration Guide**: `/Users/tx1138/Code/Neode/ATOB_INTEGRATION.md`
- **S9PK Installation**: `~/atob-package/INSTALLATION.md`
- **Marketplace Guide**: `neode-ui/MARKETPLACE_SETUP.md`

---

## ✨ That's It!

ATOB is fully integrated and ready to use in both:
1. **Development** (mock backend - works now!)
2. **Production** (s9pk package - ready to deploy!)

**Enjoy launching ATOB from your Neode server!** 🚀

