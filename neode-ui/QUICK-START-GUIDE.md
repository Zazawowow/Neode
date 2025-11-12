# 🚀 Quick Start Guide - Neode UI Development

## ✅ Problem Solved!

The **HTTP 500 error** you were seeing was because:
1. The backend server wasn't running on port 5959
2. Your Vue UI was trying to proxy requests to a non-existent backend

**Solution:** I've created a mock backend server that simulates the StartOS API.

---

## 🎯 How to Run (Two Options)

### Option 1: Run Everything Together (Recommended)
```bash
cd /Users/tx1138/Code/Neode/neode-ui
npm run dev:mock
```

This starts:
- ✅ Mock backend on http://localhost:5959
- ✅ Vite dev server on http://localhost:8100

### Option 2: Run Separately

**Terminal 1 - Start Mock Backend:**
```bash
cd /Users/tx1138/Code/Neode/neode-ui
npm run backend:mock
```

**Terminal 2 - Start UI:**
```bash
cd /Users/tx1138/Code/Neode/neode-ui
npm run dev
```

---

## 🔑 Login Credentials

To login to the UI, use:
- **Password:** `password123`

---

## ✅ What's Working Now

The mock backend provides responses for:

- ✅ `auth.login` - Login with password
- ✅ `auth.logout` - Logout
- ✅ `server.echo` - Echo test
- ✅ `server.time` - Current time
- ✅ `server.metrics` - System metrics
- ✅ `package.*` - Package operations (install, start, stop, etc.)
- ✅ WebSocket at `/ws/db` - Real-time updates

---

## 🎨 Current Setup

```
┌──────────────────┐
│  Your Browser    │
│  localhost:8100  │
│                  │
│  Vue 3 UI        │
└────────┬─────────┘
         │ proxy
         ↓
┌──────────────────┐
│  Vite Server     │
│  localhost:8100  │
└────────┬─────────┘
         │ forward
         ↓
┌──────────────────┐
│  Mock Backend    │
│  localhost:5959  │
│                  │
│  (Simulates      │
│   StartOS API)   │
└──────────────────┘
```

---

## 🔧 Troubleshooting

### Still seeing HTTP 500?

1. **Check if backend is running:**
   ```bash
   lsof -ti:5959
   ```
   If nothing returns, the backend isn't running.

2. **Start the backend manually:**
   ```bash
   cd /Users/tx1138/Code/Neode/neode-ui
   node mock-backend.js
   ```

3. **Check for errors:**
   Look for console output in the terminal where you started the backend.

### Port already in use?

```bash
# Kill process on port 5959
lsof -ti:5959 | xargs kill -9

# Kill process on port 8100
lsof -ti:8100 | xargs kill -9
```

### Login not working?

1. Make sure you're using password: `password123`
2. Check browser console (F12) for specific errors
3. Verify backend is responding:
   ```bash
   curl -X POST http://localhost:5959/rpc/v1 \
     -H "Content-Type: application/json" \
     -d '{"method":"server.echo","params":{"message":"test"}}'
   ```
   Should return: `{"result":"test"}`

---

## 📝 Next Steps

1. **Try logging in** with password `password123`
2. **Explore the UI** - all API calls will return mock data
3. **Add new features** - the mock backend will respond appropriately
4. **Test real backend** - when ready, update `vite.config.ts` to point to your actual StartOS instance

---

## 🌐 Connecting to Real Backend (Later)

When you have a real StartOS instance running, update `neode-ui/vite.config.ts`:

```typescript
server: {
  proxy: {
    '/rpc': {
      target: 'http://YOUR_STARTOS_IP',  // Change this
      changeOrigin: true,
    },
    // ...
  },
}
```

---

## 📚 More Documentation

- See `README-MOCK-BACKEND.md` for detailed mock backend documentation
- See `README.md` for general project information
- See `QUICK_START.md` for Vue + Vite specifics

---

## ✨ Happy Coding!

Your development environment is now ready. The HTTP 500 error should be gone, and you can login with `password123`.

If you have any issues, check:
1. Both servers are running (ports 5959 and 8100)
2. No firewall blocking the ports
3. Browser console for specific errors

**Current Status:**
- ✅ Mock backend running on port 5959
- ✅ Vite dev server should be running on port 8100
- ✅ Login ready with password: `password123`

