# Neode UI - Vue 3 Edition

A modern, clean Vue 3 + Vite + Tailwind rewrite of the Neode OS interface.

## 🎯 Why This Rewrite?

The original Angular interface had routing issues, disappearing components, and was difficult to maintain. This Vue 3 rewrite provides:

- ✅ **Clean routing** - Vue Router is simpler and more predictable than Angular router
- ✅ **Modern tooling** - Vite is 10x faster than Angular CLI
- ✅ **Better DX** - TypeScript + Vue 3 Composition API + Tailwind = rapid development
- ✅ **Same glassmorphism design** - All your beautiful UI styling recreated
- ✅ **Same features** - Splash screen, login, onboarding, apps list, etc.
- ✅ **Backend agnostic** - Connects to the same Rust backend via RPC/WebSocket

## 🏗️ Architecture

```
neode-ui/
├── src/
│   ├── api/              # RPC client & WebSocket handler
│   ├── stores/           # Pinia state management (replaces PatchDB)
│   ├── views/            # Page components
│   ├── components/       # Reusable components (SplashScreen, etc.)
│   ├── router/           # Vue Router configuration
│   ├── types/            # TypeScript types (ported from Angular)
│   └── style.css         # Global styles + Tailwind
├── public/assets/        # Static assets (images, fonts, icons)
└── vite.config.ts        # Vite config with proxy to backend
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+ (20.18.2 works but shows warning)

### Quick Start (Recommended)

```bash
cd neode-ui
npm install
npm start
```

Visit **http://localhost:8100** and login with password: `password123`

This starts both:
- ✅ Mock backend (port 5959) - no Docker required!
- ✅ Vite dev server (port 8100) with instant HMR

**Stop servers:**
```bash
npm stop
```

📖 **See [DEV-SCRIPTS.md](./DEV-SCRIPTS.md) for detailed documentation**

### Development Options

```bash
# Start everything (mock backend + Vite)
npm start

# Stop everything
npm stop

# Run mock backend only
npm run backend:mock

# Run Vite only (requires backend running separately)
npm run dev

# Run with real Rust backend (requires core/ to be running)
npm run dev:real
```

### Build for Production

```bash
npm run build
```

Outputs to `../web/dist/neode-ui/`

## 🎨 Design System

### Glassmorphism Classes

```html
<!-- Glass card -->
<div class="glass-card p-6">Content</div>

<!-- Glass button -->
<button class="glass-button px-4 py-3">Click me</button>

<!-- Manual glass styling -->
<div class="bg-glass-dark backdrop-blur-glass border border-glass-border shadow-glass">
  Custom glass element
</div>
```

### Spacing (4px grid system)

- `p-4` = 16px padding
- `m-6` = 24px margin
- `gap-4` = 16px gap

### Colors

- `text-white/80` = 80% white opacity
- `bg-glass-dark` = rgba(0, 0, 0, 0.35)
- `border-glass-border` = rgba(255, 255, 255, 0.18)

## 🔌 API Connection

### RPC Calls

```typescript
import { rpcClient } from '@/api/rpc-client'

// Login
await rpcClient.login('password')

// Start a package
await rpcClient.startPackage('bitcoin')

// Get metrics
const metrics = await rpcClient.getMetrics()
```

### State Management (Pinia)

```typescript
import { useAppStore } from '@/stores/app'

const store = useAppStore()

// Access reactive state
const packages = computed(() => store.packages)
const isAuthenticated = computed(() => store.isAuthenticated)

// Call actions
await store.login(password)
await store.installPackage('nextcloud', marketplaceUrl, '1.0.0')
```

### WebSocket Updates

The store automatically subscribes to WebSocket updates and applies JSON patches to the state. No manual setup required!

## 📝 Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Redirect | Redirects to /login |
| `/login` | Login | Login page with glass styling |
| `/onboarding/intro` | OnboardingIntro | Welcome screen |
| `/onboarding/options` | OnboardingOptions | Setup options |
| `/dashboard` | Dashboard | Main layout with sidebar |
| `/dashboard/apps` | Apps | Apps list with glass cards |
| `/dashboard/apps/:id` | AppDetails | App details page |
| `/dashboard/marketplace` | Marketplace | Browse apps |
| `/dashboard/server` | Server | Server settings |
| `/dashboard/settings` | Settings | UI settings |

## ✨ Features Recreated

- [x] Alien-style terminal splash screen with typing animation
- [x] Skip intro button
- [x] Login page with glass card and fade-up animation
- [x] Onboarding intro with feature highlights
- [x] Onboarding options with selectable glass cards
- [x] Dashboard layout with glass sidebar
- [x] Apps list with status badges and quick actions
- [x] Connection status banner
- [x] Offline detection
- [x] WebSocket state synchronization
- [x] RPC authentication
- [x] Responsive design

## 🐛 Debugging

### Common Issues

**Assets not loading?**
```bash
# Ensure assets are copied
cp -r ../web/projects/shared/assets/img/* public/assets/img/
```

**Backend connection refused?**
- Check backend is running on port 5959
- Update proxy in `vite.config.ts` if using different port

**TypeScript errors?**
```bash
npm run type-check
```

## 📦 Deployment

The Vue app can be served by the Rust backend (replace the Angular build):

1. Build: `npm run build` (outputs to `../web/dist/neode-ui/`)
2. Update Rust to serve from this directory
3. Restart backend

## 🔮 Future Enhancements

- [ ] Dark/light theme toggle
- [ ] App configuration UI
- [ ] Marketplace browsing & search
- [ ] Server metrics charts
- [ ] Backup/restore UI
- [ ] Notification system
- [ ] Multi-language support

## 🤝 Contributing

This is a clean rewrite - feel free to add features without the baggage of the old Angular codebase!

## 📄 License

Same as Neode OS
