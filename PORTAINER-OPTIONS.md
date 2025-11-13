# Portainer Deployment Options

Choose the deployment that fits your needs:

## 🎨 Option 1: Demo (Recommended for Quick Start)

**File:** `portainer-stack-demo.yml`

### What You Get
- ✅ Frontend only (no backend)
- ✅ Login with **any password**
- ✅ ~1 minute deployment
- ✅ Perfect for UI demos

### Use When
- You want to show off the UI
- You need a quick demo
- You don't need functionality
- You're testing responsive design

### Deploy
```
Repository: https://github.com/Zazawowow/Neode
Compose path: portainer-stack-demo.yml
```

**Login:** Type literally anything as password! ✨

📖 [Full Demo Guide →](./DEMO-DEPLOY.md)

---

## 🚀 Option 2: Full Mock Backend

**File:** `portainer-stack-vue.yml`

### What You Get
- ✅ Frontend + Mock backend
- ✅ Real API calls (mocked)
- ✅ WebSocket updates
- ✅ ~2-3 minute deployment

### Use When
- You need full functionality
- You're testing API integration
- You want realistic behavior
- You're doing development

### Deploy
```
Repository: https://github.com/Zazawowow/Neode
Compose path: portainer-stack-vue.yml
```

**Login:** `password123`

📖 [Full Backend Guide →](./PORTAINER-DEPLOY.md)

---

## 📊 Quick Comparison

| Feature | Demo | Full Mock |
|---------|------|-----------|
| **Deployment** | ~1 min | ~2-3 min |
| **Containers** | 1 | 2 |
| **Login** | Any password | `password123` |
| **Backend** | ❌ None | ✅ Mock API |
| **WebSocket** | ❌ | ✅ |
| **Complexity** | Simple | Moderate |
| **Best For** | Quick demos | Development |

---

## 🎯 Which Should You Choose?

### Choose Demo If:
- ✅ You just want to show the UI
- ✅ You need it working NOW
- ✅ You don't care about functionality
- ✅ You want zero config hassle

### Choose Full Mock If:
- ✅ You need realistic API behavior
- ✅ You're testing integrations
- ✅ You want to test full features
- ✅ You don't mind waiting 2-3 minutes

---

## 🚀 Quick Start

### For Demo (Fastest):
1. Portainer → Stacks → Add Stack
2. Name: `neode-demo`
3. Repository method
4. URL: `https://github.com/Zazawowow/Neode`
5. Compose: `portainer-stack-demo.yml`
6. Deploy
7. Wait 1 minute
8. Login with any password!

### For Full Mock:
1. Portainer → Stacks → Add Stack
2. Name: `neode`
3. Repository method
4. URL: `https://github.com/Zazawowow/Neode`
5. Compose: `portainer-stack-vue.yml`
6. Deploy
7. Wait 2-3 minutes
8. Login with `password123`

---

## 📚 Documentation

- **[DEMO-DEPLOY.md](./DEMO-DEPLOY.md)** - Demo version guide
- **[PORTAINER-DEPLOY.md](./PORTAINER-DEPLOY.md)** - Full mock guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment docs
- **[FIX-405-ERROR.md](./FIX-405-ERROR.md)** - Troubleshooting 405 errors

---

## 💡 Recommendation

**Start with Demo** (`portainer-stack-demo.yml`)

Why?
- ✅ Deploys in 1 minute
- ✅ Zero configuration
- ✅ No 405 errors
- ✅ Works instantly
- ✅ Perfect for showing off

You can always switch to the full mock version later if you need API functionality!

---

**Ready?** Pick your option above and deploy! 🚀

