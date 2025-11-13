# Neode UI Troubleshooting

## Common Issues and Solutions

### 1. "Method not found: marketplace.get"

**Cause**: The backend isn't running or doesn't have the marketplace API enabled.

**Solutions**:

#### Option A: Start the Backend
```bash
# Ensure the Neode backend is running
cd /Users/tx1138/Code/Neode
# Start your backend service (adjust command as needed)
```

#### Option B: Check Backend Status
```bash
# Test if backend is accessible
curl -X POST http://localhost:5959/rpc/v1 \
  -H "Content-Type: application/json" \
  -d '{"method":"echo","params":{"message":"test"}}'

# Should return: {"result":"test"}
```

#### Option C: Use Mock Mode (Development Only)
Enable mock mode in `src/views/Marketplace.vue` by uncommenting the mock data section (see below).

---

### 2. WebSocket Error: "Cannot read properties of undefined (reading 'length')"

**Cause**: WebSocket patch data is malformed or empty.

**Fixed**: This is now handled gracefully. The app will log a warning but continue working.

**What Changed**:
- Added validation in `src/api/websocket.ts` → `applyDataPatch()`
- Added try/catch in `src/stores/app.ts` → `connectWebSocket()`

If you still see this error:
1. Check browser console for details
2. Verify backend is sending correct patch format
3. The app will continue working without real-time updates

---

### 3. "Please login first to access the marketplace"

**Cause**: You're not authenticated yet.

**Solution**:
1. Navigate to `/login` 
2. Enter your password
3. Return to marketplace

**Check Auth Status**:
```javascript
// In browser console
const store = useAppStore()
console.log('Authenticated:', store.isAuthenticated)
```

---

### 4. "Cannot connect to backend"

**Cause**: Backend isn't running or proxy isn't configured.

**Solutions**:

#### Check Vite Proxy
Verify `vite.config.ts` has:
```typescript
proxy: {
  '/rpc/v1': 'http://localhost:5959',
  '/ws/db': {
    target: 'ws://localhost:5959',
    ws: true
  }
}
```

#### Test Backend Connection
```bash
# Check if backend is listening
lsof -i :5959

# Or use netstat
netstat -an | grep 5959
```

#### Start Backend Manually
```bash
cd /Users/tx1138/Code/Neode/core
cargo run --release --bin startos
```

---

## Development Without Backend

### Enable Mock Mode

If you want to develop the UI without a running backend, you can enable mock mode:

**Edit `src/views/Marketplace.vue`**:

```typescript
async function loadMarketplace() {
  loading.value = true
  error.value = null
  apps.value = []

  // MOCK MODE - Comment out in production
  const MOCK_MODE = true // Set to false when backend is available
  
  if (MOCK_MODE) {
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    apps.value = [
      {
        id: 'bitcoin',
        title: 'Bitcoin Core',
        description: 'A full Bitcoin node implementation. Store, validate, and relay blocks and transactions.',
        version: '25.0.0',
        icon: '/assets/img/bitcoin.png',
      },
      {
        id: 'lightning',
        title: 'Lightning Network',
        description: 'Lightning Network implementation for fast, low-cost Bitcoin payments.',
        version: '0.17.0',
        icon: '/assets/img/lightning.png',
      },
      {
        id: 'nextcloud',
        title: 'Nextcloud',
        description: 'Self-hosted file sync and sharing platform.',
        version: '27.1.0',
        icon: '/assets/img/nextcloud.png',
      },
    ]
    loading.value = false
    return
  }
  // END MOCK MODE

  // Real implementation continues...
  try {
    // ...
  }
}
```

---

## Debugging Tips

### Enable Verbose Logging

**Add to `src/api/rpc-client.ts`**:
```typescript
async call<T>(options: RPCOptions): Promise<T> {
  console.log('🔵 RPC Request:', options) // Add this
  
  const response = await fetch(this.baseUrl, {
    // ...
  })
  
  const data = await response.json()
  console.log('🟢 RPC Response:', data) // Add this
  
  return data.result as T
}
```

### Check WebSocket Status

In browser console:
```javascript
// Check WebSocket connection
const store = useAppStore()
console.log('Connected:', store.isConnected)
console.log('Data:', store.data)
```

### Monitor Network Traffic

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Filter by "WS" for WebSocket
4. Filter by "XHR" for RPC calls
5. Inspect request/response payloads

---

## Backend Build Issues

### Build Rust Backend

```bash
cd /Users/tx1138/Code/Neode/core
cargo build --release

# Binary will be at:
# target/release/startos
```

### Run Backend for Development

```bash
# Run with debug logging
RUST_LOG=debug ./target/release/startos

# Or use cargo run
RUST_LOG=debug cargo run --release
```

---

## Port Conflicts

### Check What's Using Port 5959

```bash
# macOS
lsof -i :5959

# Kill process if needed
kill -9 <PID>
```

### Check What's Using Port 8100 (Vite)

```bash
lsof -i :8100
kill -9 <PID>
```

---

## Authentication Issues

### Clear Session Cookies

In browser DevTools:
1. Application tab → Cookies
2. Delete all cookies for `localhost:8100`
3. Refresh page and login again

### Check Auth Cookie

In browser console:
```javascript
// Check if auth cookie exists
document.cookie
```

---

## WebSocket Connection Fails

### Common Causes

1. **Backend not running**: Start backend on port 5959
2. **CORS issues**: Vite proxy should handle this
3. **Port mismatch**: Check backend is listening on 5959

### Debug WebSocket

**Add to `src/api/websocket.ts`**:
```typescript
this.ws.onopen = () => {
  console.log('✅ WebSocket connected')
  this.reconnectAttempts = 0
  resolve()
}

this.ws.onerror = (error) => {
  console.error('❌ WebSocket error:', error)
  reject(error)
}

this.ws.onmessage = (event) => {
  console.log('📨 WebSocket message:', event.data) // Add this
  try {
    const update = JSON.parse(event.data)
    this.callbacks.forEach((callback) => callback(update))
  } catch (error) {
    console.error('Failed to parse message:', error)
  }
}
```

---

## Build Errors

### TypeScript Errors

```bash
# Type check without building
npm run type-check

# Fix common issues
npm install
rm -rf node_modules package-lock.json
npm install
```

### Vite Build Fails

```bash
# Clear cache and rebuild
rm -rf dist node_modules/.vite
npm run build
```

---

## Performance Issues

### Slow Hot Reload

1. **Check file watchers**:
   ```bash
   # macOS - increase file watcher limit
   ulimit -n 4096
   ```

2. **Clear Vite cache**:
   ```bash
   rm -rf node_modules/.vite
   ```

### High Memory Usage

- Close other tabs/applications
- Restart Vite dev server
- Check for memory leaks in DevTools → Memory

---

## Still Having Issues?

### Collect Debug Information

1. **Browser Console Logs**:
   - Open DevTools → Console
   - Copy all errors

2. **Network Tab**:
   - Check failed requests
   - Copy request/response details

3. **Backend Logs**:
   ```bash
   # If using systemd
   journalctl -u startos -f
   
   # If running manually
   # Check terminal output
   ```

4. **System Info**:
   ```bash
   node --version
   npm --version
   cargo --version
   ```

### Clean Restart

```bash
# Stop everything
# Kill Vite dev server (Ctrl+C)
# Kill backend process

# Clean rebuild
cd /Users/tx1138/Code/Neode/neode-ui
rm -rf dist node_modules/.vite
npm install
npm run dev

# In another terminal, start backend
cd /Users/tx1138/Code/Neode/core
cargo run --release
```

---

## Quick Reference

### Start Development

```bash
# Terminal 1: UI
cd /Users/tx1138/Code/Neode/neode-ui
npm run dev

# Terminal 2: Backend (if available)
cd /Users/tx1138/Code/Neode/core
cargo run --release
```

### Check Service Status

```bash
# Check if UI is running
curl http://localhost:8100

# Check if backend is running
curl http://localhost:5959/rpc/v1 -X POST \
  -H "Content-Type: application/json" \
  -d '{"method":"echo","params":{"message":"test"}}'
```

### Reset Everything

```bash
# Clean all state
rm -rf neode-ui/dist neode-ui/node_modules/.vite
cd neode-ui && npm install && npm run dev
```

