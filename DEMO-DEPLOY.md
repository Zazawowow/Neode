# Neode Demo Deployment (No Backend)

## 🎯 What is This?

This is a **demo-only version** of Neode that runs **frontend only** with no backend required.

### ✨ Features

- ✅ **No backend needed** - All mocked in the browser
- ✅ **Login with any password** - Any password works!
- ✅ **Instant deployment** - Just frontend, no waiting for backend
- ✅ **Full UI demo** - See all pages and interactions
- ✅ **Mock data** - Pre-populated with sample apps and data

### ⚠️ Limitations

- ❌ No real functionality - Everything is mocked
- ❌ No persistence - Data resets on page reload
- ❌ No WebSocket updates - Static mock data
- ❌ Not for production - Demo purposes only

---

## 🚀 Deploy in Portainer

### Step 1: Add Stack

1. Go to **Stacks** → **Add Stack**
2. **Name**: `neode-demo`
3. **Build method**: ✅ Repository

### Step 2: Repository Settings

- **Repository URL**: `https://github.com/Zazawowow/Neode`
- **Repository reference**: `refs/heads/master`
- **Compose path**: `portainer-stack-demo.yml`

### Step 3: Deploy

1. Click **Deploy the stack**
2. ⏳ **Wait ~1 minute** (much faster than full version!)

### Step 4: Access

- 🌐 Open: `http://your-server-ip:8100`
- 🔐 Login with: **ANY PASSWORD** (literally type anything!)
- 🎉 Explore the demo!

---

## 🎮 Using the Demo

### Login

The login screen accepts **any password**:
- `password`
- `123456`
- `demo`
- `asdf`
- Literally anything!

Just type something and click login - it will work! ✅

### What You Can Do

- ✅ Browse all UI pages
- ✅ See the dashboard
- ✅ View mock apps (Bitcoin, Lightning)
- ✅ Navigate between sections
- ✅ See the beautiful glassmorphism design
- ✅ Test mobile responsive layout
- ✅ Click around and explore

### What Doesn't Work

- ❌ Installing real apps
- ❌ Actual server operations
- ❌ Real-time updates
- ❌ Data persistence

**It's a UI demo only!** 🎨

---

## ⏱️ Deployment Timeline

| Time | Status |
|------|--------|
| 0-30s | Building Docker image |
| 30-60s | Starting nginx |
| **60s** | **✅ Ready!** |

Much faster than the full version with backend! ⚡

---

## 🔧 Technical Details

### What Gets Deployed

- **One container**: `neode-demo`
  - Nginx serving static Vue.js app
  - Port 8100 → 80
  - No backend, no database, no API

### How Authentication Works

```typescript
async function login(password: string) {
  // Demo mode - accept any password
  console.log('Demo mode: Logging in with any password')
  isAuthenticated.value = true
  return Promise.resolve()
}
```

It literally accepts anything! 😄

### Mock Data

The demo includes:
- Sample server info
- 2 mock apps (Bitcoin, Lightning)
- Fake metrics
- Demo settings

All stored in browser memory (cleared on reload).

---

## 📊 Comparison: Demo vs Full

| Feature | Demo | Full Version |
|---------|------|--------------|
| **Deployment Time** | ~1 minute | ~2-3 minutes |
| **Containers** | 1 (frontend) | 2 (frontend + backend) |
| **Login** | Any password | `password123` |
| **Functionality** | UI only | Full mock API |
| **Data** | Static | Mock WebSocket updates |
| **Use Case** | Quick demo | Development/testing |

---

## 🐞 Troubleshooting

### Container won't start

**Check logs:**
```bash
docker logs neode-demo
```

**Common issues:**
- Port 8100 already in use
- Build failed (check GitHub is accessible)

**Solution:**
```bash
# Stop any existing neode containers
docker stop neode-web neode-backend neode-demo 2>/dev/null
docker rm neode-web neode-backend neode-demo 2>/dev/null

# Redeploy in Portainer
```

### Can't access the site

**Check if container is running:**
```bash
docker ps | grep neode-demo
```

Should show: `neode-demo` with status `Up` and `(healthy)`

**Test locally:**
```bash
curl http://localhost:8100
```

Should return HTML.

### Login doesn't work

**This shouldn't happen!** Any password should work.

If it doesn't:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Type anything in password field
4. Click login
5. You should see: `Demo mode: Logging in with any password`
6. If you see errors, check the Network tab

---

## 🔄 Update to Latest

To get the latest UI changes:

1. In Portainer, go to your `neode-demo` stack
2. Click **Remove**
3. Wait 10 seconds
4. **Add Stack** again with same settings
5. It will rebuild from latest GitHub code

---

## 🎨 What This Demonstrates

- ✨ Beautiful glassmorphism UI
- 📱 Responsive design (desktop + mobile)
- 🎯 Clean Vue 3 + Vite + Tailwind architecture
- 🚀 Fast loading and smooth animations
- 💎 Professional UX design
- 📊 Dashboard layouts
- 🎮 Interactive components

Perfect for:
- **Showing the UI** to stakeholders
- **Testing designs** quickly
- **Mobile testing** without full backend
- **Quick demos** at presentations

---

## 📝 Files

| File | Purpose |
|------|---------|
| `Dockerfile.demo` | Frontend-only Docker build |
| `portainer-stack-demo.yml` | Demo stack (no backend) |
| `neode-ui/src/stores/app-demo.ts` | Mock store with fake auth |
| `DEMO-DEPLOY.md` | This guide |

---

## 🔗 Other Deployment Options

- **Full Mock Backend**: Use `portainer-stack-vue.yml` (has backend)
- **Local Development**: Use `npm run dev` in `neode-ui/`
- **Production**: Replace mock backend with real Rust backend

---

## ✅ Success Checklist

After deployment:

- [ ] Container `neode-demo` is running
- [ ] Can access http://your-ip:8100
- [ ] Login page loads
- [ ] Can login with any password
- [ ] Dashboard appears
- [ ] Can navigate between pages
- [ ] Mobile logo is centered (from earlier fix!)

**All checked?** 🎉 **You're done!**

---

**Questions?** This is just a UI demo - it's meant to be simple! 😊

