# Mock Backend for Neode UI Development

This directory includes a mock backend server that simulates the StartOS backend API, allowing you to develop the UI without needing a full StartOS instance.

## Quick Start

### Option 1: Run Both Mock Backend + UI Together
```bash
npm install
npm run dev:mock
```

This will start:
- Mock backend on `http://localhost:5959`
- Vite dev server on `http://localhost:8100`

### Option 2: Run Separately

**Terminal 1 - Mock Backend:**
```bash
npm run backend:mock
```

**Terminal 2 - UI:**
```bash
npm run dev
```

## Mock Credentials

Use these credentials to login:
- **Password:** `password123`

## What Works

The mock backend provides fake responses for:

### Authentication
- ✅ `auth.login` - Login with password
- ✅ `auth.logout` - Logout and clear session

### Server Operations
- ✅ `server.echo` - Echo test
- ✅ `server.time` - Current time and uptime
- ✅ `server.metrics` - System metrics (CPU, memory, disk)
- ✅ `server.update` - Trigger update (fake)
- ✅ `server.restart` - Restart server (fake)
- ✅ `server.shutdown` - Shutdown server (fake)

### Package Management
- ✅ `package.install` - Install package (fake)
- ✅ `package.uninstall` - Uninstall package (fake)
- ✅ `package.start` - Start package (fake)
- ✅ `package.stop` - Stop package (fake)
- ✅ `package.restart` - Restart package (fake)

### Real-time Updates
- ✅ WebSocket connection at `/ws/db`
- ✅ Sends initial data on connection
- ✅ Sends periodic JSON Patch updates

## Mock Data

The mock backend provides:
- Server info (name, version, status)
- 2 mock packages (Bitcoin Core, Lightning Network)
- UI preferences and theme settings
- Fake system metrics

## Connecting to Real Backend

If you have access to a real StartOS instance, update `vite.config.ts`:

```typescript
server: {
  port: 8100,
  proxy: {
    '/rpc': {
      target: 'http://YOUR_STARTOS_IP',  // Change this
      changeOrigin: true,
    },
    // ... other proxies
  },
}
```

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  Vue 3 UI       │────────▶│  Vite Proxy      │────────▶│  Mock Backend   │
│  localhost:8100 │         │  (transparent)   │         │  localhost:5959 │
│                 │◀────────│                  │◀────────│                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

1. UI makes requests to `/rpc/v1` and `/ws/db`
2. Vite dev server proxies them to `localhost:5959`
3. Mock backend responds with fake data
4. UI receives responses as if from a real backend

## Troubleshooting

### Port 5959 Already in Use
```bash
# Find and kill the process
lsof -ti:5959 | xargs kill -9
```

### Mock Backend Won't Start
Make sure dependencies are installed:
```bash
npm install
```

### WebSocket Connection Failed
Check that:
1. Mock backend is running (`npm run backend:mock`)
2. Browser console shows WebSocket connection to `ws://localhost:5959/ws/db`
3. No firewall blocking port 5959

## Development Tips

### Adding New RPC Methods

Edit `mock-backend.js` and add a new case in the switch statement:

```javascript
case 'your.new.method': {
  return res.json({
    result: {
      // Your mock response
    }
  })
}
```

### Modifying Mock Data

Edit the `mockData` object in `mock-backend.js`:

```javascript
const mockData = {
  'server-info': {
    name: 'Your Server Name',  // Customize here
    version: '0.3.5',
    // ...
  },
  // ...
}
```

### Testing WebSocket Updates

The mock backend sends random updates every 5 seconds. To customize:

```javascript
const interval = setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'patch',
      patch: [
        // Your JSON Patch operations
      ],
    }))
  }
}, 5000) // Change interval here
```

## Production Build

When building for production, make sure you're pointing to a real backend:

```bash
# Build the UI
npm run build

# Output goes to ../web/dist/neode-ui/
```

The mock backend is only for development and should never be used in production!

## Next Steps

- [ ] Connect to a real StartOS instance for full testing
- [ ] Test all UI flows with mock data
- [ ] Implement missing RPC methods as needed
- [ ] Add more realistic mock data

## Support

If you encounter issues:
1. Check that Node.js v18+ is installed
2. Verify all dependencies are installed (`npm install`)
3. Check both terminal outputs for errors
4. Review browser console for network errors

