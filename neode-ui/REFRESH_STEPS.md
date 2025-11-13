# How to See ATOB Changes

The mock backend has ATOB data, but your browser needs to refresh properly.

## Quick Fix (Try these in order)

### 1. Hard Refresh the Browser
```
Mac: Cmd + Shift + R
Windows/Linux: Ctrl + Shift + R
```

### 2. Clear Site Data and Refresh
In Chrome/Brave:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### 3. Logout and Login Again
1. Click logout in the UI
2. Login again with: `password123`
3. Navigate to Apps

### 4. Restart Everything
```bash
# Stop the current dev server (Ctrl+C)
cd /Users/tx1138/Code/Neode/neode-ui
npm run dev:mock
```

Then visit: http://localhost:8100

## What to Expect

After refresh, you should see in the Apps page:
- **Bitcoin Core** (running)
- **Core Lightning** (stopped)
- **A to B Bitcoin** (running) ← NEW!

The ATOB card will have:
- Blue ATOB icon
- "A to B Bitcoin" title
- "running" green badge
- **"Launch"** button (gradient blue)
- Stop button

## Verification

Check browser console (F12):
```javascript
// Should show the WebSocket data includes atob
```

Check Network tab:
- WebSocket connection to `ws://localhost:5959/ws/db`
- Should receive data with package-data containing atob

## Still Not Working?

Check if the WebSocket sent the data:
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. Click on the WebSocket connection
5. Look at Messages
6. You should see initial data with atob in package-data

