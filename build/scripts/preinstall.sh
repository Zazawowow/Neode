#!/bin/bash

# Neode Pre-Installation Script
# Automatically installs bundled s9pk packages on first boot

set -e

PREINSTALL_DIR="${PREINSTALL_DIR:-/opt/neode/preinstalled-packages}"
FLAG_FILE="${FLAG_FILE:-/data/.preinstalled}"
LOG_FILE="${LOG_FILE:-/var/log/neode-preinstall.log}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "Starting Neode pre-installation check..."

# Check if already installed
if [ -f "$FLAG_FILE" ]; then
    log "Pre-installed packages already loaded. Skipping."
    exit 0
fi

# Check if preinstall directory exists
if [ ! -d "$PREINSTALL_DIR" ]; then
    log "No preinstall directory found at $PREINSTALL_DIR"
    exit 0
fi

# Count packages
PKG_COUNT=$(find "$PREINSTALL_DIR" -name "*.s9pk" 2>/dev/null | wc -l)
if [ "$PKG_COUNT" -eq 0 ]; then
    log "No s9pk packages found in $PREINSTALL_DIR"
    exit 0
fi

log "Found $PKG_COUNT package(s) to pre-install"

# Wait for startd to be ready
log "Waiting for Neode services to be ready..."
for i in {1..30}; do
    if start-cli echo "ready" &>/dev/null; then
        log "Services are ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        log "ERROR: Services did not become ready in time"
        exit 1
    fi
    sleep 2
done

# Install each package
INSTALLED=0
FAILED=0

for pkg in "$PREINSTALL_DIR"/*.s9pk; do
    if [ ! -f "$pkg" ]; then
        continue
    fi
    
    PKG_NAME=$(basename "$pkg")
    log "Installing $PKG_NAME..."
    
    if start-cli package.install "$pkg" >> "$LOG_FILE" 2>&1; then
        log "✓ Successfully installed $PKG_NAME"
        INSTALLED=$((INSTALLED + 1))
        
        # Auto-start if configured
        if [ "${PREINSTALL_START:-false}" = "true" ]; then
            PKG_ID=$(basename "$pkg" .s9pk)
            log "Starting $PKG_ID..."
            start-cli package.start "$PKG_ID" >> "$LOG_FILE" 2>&1 || \
                log "Warning: Could not auto-start $PKG_ID"
        fi
    else
        log "✗ Failed to install $PKG_NAME"
        FAILED=$((FAILED + 1))
    fi
done

# Create flag file
touch "$FLAG_FILE"
log "Pre-installation complete: $INSTALLED installed, $FAILED failed"

# Summary
if [ $FAILED -eq 0 ]; then
    log "🎉 All packages installed successfully!"
    exit 0
else
    log "⚠️  Some packages failed to install"
    exit 1
fi

