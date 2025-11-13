# Pre-Installing ATOB in Production Neode

## Goal

Ship Neode with ATOB pre-installed so users get it out of the box!

## How It Works

### 1. Include S9PK in OS Build

Add ATOB s9pk to the system image:

```bash
# Build script location
/Users/tx1138/Code/Neode/image-recipe/build.sh

# Add these steps:
1. Copy atob.s9pk to image
2. Install it during first boot
3. Set it to auto-start
```

### 2. Modify Build Process

#### Add to `image-recipe/raspberrypi/squashfs/`

Create pre-installed packages directory:
```bash
mkdir -p image-recipe/raspberrypi/squashfs/opt/neode/preinstalled-packages
```

Copy s9pk:
```bash
cp ~/atob-package/atob.s9pk \
   image-recipe/raspberrypi/squashfs/opt/neode/preinstalled-packages/
```

### 3. Auto-Install on First Boot

Create init script: `image-recipe/raspberrypi/squashfs/etc/init.d/neode-preinstall`

```bash
#!/bin/bash
### BEGIN INIT INFO
# Provides:          neode-preinstall
# Required-Start:    $local_fs $network
# Required-Stop:     
# Default-Start:     2 3 4 5
# Default-Stop:      
# Short-Description: Pre-install Neode packages
### END INIT INFO

PREINSTALL_DIR="/opt/neode/preinstalled-packages"
INSTALLED_FLAG="/var/lib/neode/.preinstalled"

# Only run once
if [ -f "$INSTALLED_FLAG" ]; then
    exit 0
fi

echo "Installing pre-packaged apps..."

# Install each s9pk
for pkg in "$PREINSTALL_DIR"/*.s9pk; do
    if [ -f "$pkg" ]; then
        echo "Installing $(basename "$pkg")..."
        start-cli package.install "$pkg"
    fi
done

# Mark as done
touch "$INSTALLED_FLAG"
echo "Pre-installation complete!"
```

## Implementation Steps

### Step 1: Create Pre-Install Directory

```bash
cd /Users/tx1138/Code/Neode
mkdir -p build/preinstalled-packages
cp ~/atob-package/atob.s9pk build/preinstalled-packages/
```

### Step 2: Modify Dockerfile

Add to `Dockerfile`:

```dockerfile
# Add pre-installed packages
COPY build/preinstalled-packages/*.s9pk /opt/neode/preinstalled-packages/

# Add init script
COPY build/scripts/preinstall.sh /docker-entrypoint.d/10-preinstall.sh
RUN chmod +x /docker-entrypoint.d/10-preinstall.sh
```

### Step 3: Create Install Script

```bash
#!/bin/bash
# build/scripts/preinstall.sh

echo "Checking for pre-installed packages..."

if [ ! -f /data/.preinstalled ]; then
    echo "Installing bundled applications..."
    
    for pkg in /opt/neode/preinstalled-packages/*.s9pk; do
        if [ -f "$pkg" ]; then
            echo "Installing $(basename "$pkg")..."
            start-cli package.install "$pkg" || echo "Warning: Failed to install $(basename "$pkg")"
        fi
    done
    
    touch /data/.preinstalled
    echo "Pre-installation complete!"
else
    echo "Pre-installed packages already loaded."
fi
```

## Update Portainer Stack

Modify `portainer-stack-vue.yml`:

```yaml
version: '3.8'

services:
  neode-backend:
    # ... existing config ...
    volumes:
      - neode-data:/data
      - ./build/preinstalled-packages:/opt/neode/preinstalled-packages:ro
    environment:
      - PREINSTALL_PACKAGES=true

  neode-web:
    # ... existing config ...
```

## Result

When users first start Neode:

1. ✅ System boots up
2. ✅ Init script runs
3. ✅ Finds atob.s9pk in preinstalled-packages
4. ✅ Installs it automatically
5. ✅ Starts the container
6. ✅ **User sees ATOB pre-installed in Apps!**

## All Your Work is Preserved!

### What Stays the Same:

✅ **UI Components** - Launch buttons, app cards work exactly same  
✅ **Store Logic** - WebSocket handles data exactly same  
✅ **S9PK Package** - Same package, just pre-installed  
✅ **Container** - Runs exactly as we tested  
✅ **Launch Functionality** - Opens ATOB exactly same way  

### What Changes:

❌ **Mock Backend** - Replaced by real backend (expected)  
✅ **Data Source** - Comes from real installation instead of mock  
✅ **Launch URL** - Uses Tor/LAN address instead of localhost  

## Production User Experience

```
User downloads Neode
    ↓
Installs on their device
    ↓
First boot
    ↓
System auto-installs ATOB ✅
    ↓
User opens Neode UI
    ↓
Sees "3 Apps Installed" (including ATOB)
    ↓
Clicks "Launch" on ATOB
    ↓
Opens ATOB interface over Tor 🎉
```

## Build Command

```bash
# Build Neode with pre-installed ATOB
cd /Users/tx1138/Code/Neode

# Copy s9pk to build dir
mkdir -p build/preinstalled-packages
cp ~/atob-package/atob.s9pk build/preinstalled-packages/

# Build OS image
cd image-recipe
./build.sh

# Or build Docker image
docker build -t neode-with-atob .
```

## Configuration Options

### Environment Variables

```bash
# Control pre-installation
PREINSTALL_PACKAGES=true    # Enable auto-install
PREINSTALL_START=true        # Auto-start installed apps
PREINSTALL_DIR=/opt/neode/preinstalled-packages
```

### Config File

`/etc/neode/preinstall.conf`:
```ini
[preinstall]
enabled = true
packages_dir = /opt/neode/preinstalled-packages
auto_start = true
log_file = /var/log/neode-preinstall.log
```

## Testing Pre-Installation

### Test in Docker

```bash
# Build with pre-installed ATOB
docker build -t neode-test -f Dockerfile.preinstall .

# Run it
docker run -d -p 8100:80 -p 5959:5959 neode-test

# Check if ATOB is installed
docker exec neode-test start-cli package.list
# Should show: atob (0.1.0) - running
```

### Test Full Workflow

1. Build image with ATOB
2. Deploy to test device
3. Boot up
4. Open UI at http://device-ip:8100
5. See ATOB pre-installed ✅
6. Click Launch ✅
7. ATOB opens ✅

## Advantages

✅ **Zero User Setup** - ATOB works immediately  
✅ **Consistent Experience** - All users get same apps  
✅ **Curated Apps** - You control what's pre-installed  
✅ **Fast Onboarding** - No need to find and install ATOB  
✅ **Tested Configuration** - You know it works  

## Adding More Pre-Installed Apps

```bash
# Just add more s9pks!
cp ~/bitcoin-package/bitcoin.s9pk build/preinstalled-packages/
cp ~/lightning-package/lightning.s9pk build/preinstalled-packages/
cp ~/atob-package/atob.s9pk build/preinstalled-packages/

# They'll all auto-install on first boot
```

## Updating Pre-Installed Apps

When you update ATOB:

```bash
# Build new s9pk
cd ~/atob-package
# Make changes to Dockerfile, manifest, etc.
./start-sdk pack

# Copy to build
cp atob.s9pk /Users/tx1138/Code/Neode/build/preinstalled-packages/

# Rebuild Neode image
cd /Users/tx1138/Code/Neode
docker build -t neode:latest .
```

## Distribution

### OS Image
```bash
# Create flashable image with ATOB
./build.sh --include-preinstalled

# Results in:
neode-v0.3.5-with-apps.img  (includes ATOB)
```

### Docker Image
```bash
# Push to registry
docker tag neode-with-atob:latest registry.example.com/neode:latest
docker push registry.example.com/neode:latest
```

### GitHub Release
```bash
# Include s9pk in releases
gh release create v0.3.5 \
  --title "Neode v0.3.5 with Pre-installed Apps" \
  --notes "Includes ATOB out of the box!" \
  neode-v0.3.5.img \
  build/preinstalled-packages/atob.s9pk
```

## Summary

**YES - All your work is directly useful!**

1. ✅ We built a production-ready s9pk
2. ✅ We tested it works in containers
3. ✅ We built UI that works with it
4. ✅ Now we just include it in the OS build
5. ✅ Users get it pre-installed automatically!

**Nothing goes to waste - this is exactly how production works!** 🎉

