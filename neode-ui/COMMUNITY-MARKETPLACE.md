# 🌐 Community Marketplace Integration

The Neode UI now includes a **Community Marketplace** tab that connects to the real Start9 app ecosystem!

## Features

### 📑 Two-Tab Interface

**Local Apps Tab:**
- Your custom local apps (k484, atob, amin)
- Sideload packages from URLs
- Quick install for development apps

**Community Marketplace Tab:**
- **Real Start9 packages** from the community registry
- Search functionality
- Bitcoin Core, Lightning Network, BTCPay, Nextcloud, and more!
- GitHub repository links
- Author information

### 🔍 Search & Filter

Search across:
- App names
- Descriptions
- Package IDs
- Author names

### 🎨 Beautiful UI

- Glass-morphism design (matching Neode aesthetic)
- Responsive grid layout
- Loading states
- Error handling with retry
- Install progress indicators

## How It Works

### 1. **Fetches Real Data**

Connects to Start9's community registry:
```
https://registry.start9.com/api/v1/packages
```

### 2. **Smart Multi-Level Fallback System**

If the Start9 registry is unavailable, the system automatically tries multiple sources:

**Level 1:** Start9 Registry API (primary)
```
https://registry.start9.com/api/v1/packages
```

**Level 2:** GitHub API (dynamic)
```
https://api.github.com/users/Start9Labs/repos
```
- Fetches all `-startos` repositories from Start9Labs
- Dynamically builds app list from actual packages
- Shows real-time ecosystem

**Level 3:** Curated App List (ultimate fallback)
Shows 20+ popular Start9 ecosystem apps including:

**Bitcoin & Lightning:**
- Bitcoin Core, Bitcoin Knots
- Core Lightning (CLN), LND  
- BTCPay Server
- Ride The Lightning, ThunderHub
- Electrs, Mempool Explorer
- Specter Desktop

**Communication & Social:**
- Synapse (Matrix)
- Nostr Relay
- CUPS Messenger

**Productivity & Storage:**
- Nextcloud
- Vaultwarden (password manager)
- File Browser

**Media:**
- Jellyfin (media server)
- PhotoPrism (AI photos)
- Immich (photo backup)

**Smart Home:**
- Home Assistant

**You'll see a blue info banner:** "📚 Community Apps: Showing X Start9 ecosystem applications."

### 3. **Installation Flow**

When you click "Install" on a community app:
1. Calls `package.install` RPC method with the `.s9pk` URL
2. Backend downloads and extracts the package
3. Polls for installation completion
4. Redirects to Apps page when done

## Usage

### Access the Marketplace

1. Navigate to **Dashboard > Marketplace**
2. Click **"Community Marketplace"** tab
3. Browse or search for apps
4. Click **"Install"** on any app with a manifest URL

### Search for Apps

Type in the search bar:
- "bitcoin" - finds Bitcoin Core
- "lightning" - finds Lightning Network
- "payment" - finds BTCPay Server
- etc.

### Install Community Apps

Apps with green "Install" buttons:
- ✅ Have downloadable `.s9pk` packages
- ✅ Can be installed directly

Apps with "Not Available" buttons:
- ⚠️ Don't have packages yet
- 🔗 Can view GitHub repo for more info

## Technical Details

### API Integration

```typescript
// Fetches community packages
const response = await fetch('https://registry.start9.com/api/v1/packages')
const data = await response.json()

// Transforms to our format
communityApps.value = Object.entries(data).map(([id, pkg]) => ({
  id,
  title: pkg.title || id,
  version: latestVersion,
  description: pkg.description,
  icon: pkg.icon,
  author: pkg.author,
  manifestUrl: pkg.manifest,
  repoUrl: pkg.repository
}))
```

### Installation

```typescript
// Installs community app
await rpcClient.call({
  method: 'package.install',
  params: {
    id: app.id,
    url: app.manifestUrl,  // .s9pk URL from registry
    version: app.version
  }
})
```

## App Card Features

Each community app card shows:
- **Icon** - App logo (with fallback to Neode logo)
- **Title** - App name
- **Version** - Latest available version
- **Author** - Package maintainer
- **Description** - Truncated to 3 lines
- **Install Button** - If manifest available
- **GitHub Link** - Repository access

## States

### Loading
```
🔄 Loading Start9 Community Marketplace...
```

### Error
```
❌ Failed to load marketplace
[Error message]
[Retry Button]
```

### Empty Search
```
No apps found matching "[query]"
```

## Backend Requirements

The mock backend needs to support:

1. **package.install** - Install from `.s9pk` URL
2. **Docker** - Extract and run containers
3. **Networking** - Download from registry URLs

## Future Enhancements

- [ ] **Categories** - Filter by Bitcoin, Storage, Communication, etc.
- [ ] **Ratings** - Show community ratings
- [ ] **Dependencies** - Show required apps
- [ ] **Updates** - Notify when app updates available
- [ ] **Reviews** - User reviews and comments
- [ ] **Screenshots** - App previews
- [ ] **Detailed Views** - Full app pages with more info

## Development

### Test the Feature

1. Start dev server:
   ```bash
   npm start
   ```

2. Navigate to Marketplace

3. Switch to "Community Marketplace" tab

4. Should see apps load (or fallback list)

### Mock Data (Development Fallback)

If registry is unavailable, shows:
- Bitcoin Core v27.0.0
- Core Lightning v24.02.2
- BTCPay Server v1.13.1
- Nextcloud v29.0.0

### Adding More Mock Apps

Edit `loadCommunityMarketplace()` function in `Marketplace.vue`:

```typescript
communityApps.value = [
  // ... existing apps ...
  {
    id: 'fedimint',
    title: 'Fedimint',
    version: '0.3.0',
    description: 'Federated Chaumian e-cash',
    icon: '/assets/img/fedimint.png',
    author: 'Fedimint Developers',
    manifestUrl: 'https://example.com/fedimint.s9pk',
    repoUrl: 'https://github.com/fedimint/fedimint'
  }
]
```

## Troubleshooting

### Registry Not Loading

**Problem**: Community tab shows error

**Solutions**:
1. Check internet connection
2. Verify registry URL is accessible
3. Check browser console for CORS errors
4. Fallback mock data will still show

### Apps Won't Install

**Problem**: Install button doesn't work

**Check**:
1. App has `manifestUrl` (not null)
2. Backend is running
3. Docker is available (for real installs)
4. Check backend logs for errors

### Search Not Working

**Problem**: Search doesn't filter apps

**Check**:
1. Type in search box
2. Should filter in real-time
3. Search is case-insensitive
4. Searches title, description, ID, author

## Benefits

✅ **Real Apps** - Access actual Start9 packages  
✅ **Easy Discovery** - Browse full ecosystem  
✅ **One-Click Install** - Direct installation from registry  
✅ **Stay Updated** - See latest versions  
✅ **Community Driven** - Access community-maintained apps  
✅ **Transparent** - GitHub links for every app  

## Security Note

Apps from the community marketplace are:
- Open source (GitHub repos linked)
- Community maintained
- Same packages used by StartOS
- Verified by signature (in production)

Always review an app's repository before installing!

---

🎉 **You can now browse and install real Start9 community apps directly from Neode!**

