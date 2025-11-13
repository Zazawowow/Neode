# Packaging Apps for Neode/StartOS

This guide explains how to package containerized applications (like nostrdevs/atob) as `.s9pk` files for installation on Neode.

## What is an S9PK?

An `.s9pk` file is a package format for Neode/StartOS that contains:
- **Manifest** (metadata, dependencies, interfaces)
- **Docker Images** (your containerized app)
- **Icon** (PNG/WEBP/JPG)
- **License** (LICENSE.md)
- **Instructions** (INSTRUCTIONS.md)
- **Configuration** (optional config.yaml)
- **Actions** (optional scripts for user actions)

## Prerequisites

1. **Install StartOS SDK** (needed for packing):
   ```bash
   # Clone the Neode repo (you already have this)
   cd /Users/tx1138/Code/Neode
   
   # Build the SDK
   cd core
   cargo build --release --bin startos
   
   # The binary will be at: target/release/startos
   ```

2. **Docker** for building container images

## Creating an S9PK for nostrdevs/atob

### Step 1: Create Package Directory Structure

```bash
mkdir -p ~/atob-package
cd ~/atob-package
```

Create the following structure:
```
atob-package/
├── manifest.yaml          # Package metadata
├── LICENSE.md             # License file
├── INSTRUCTIONS.md        # User instructions
├── icon.png              # 512x512 icon
├── docker_images/        # Docker image archive
│   └── aarch64.tar       # or x86_64.tar
└── scripts/
    └── procedures/
        └── main.ts       # Main entry point
```

### Step 2: Create manifest.yaml

```yaml
id: atob
title: "ATOB"
version: "0.1.0"
release-notes: "Initial release"
license: MIT
wrapper-repo: "https://github.com/nostrdevs/atob"
upstream-repo: "https://github.com/nostrdevs/atob"
support-site: "https://github.com/nostrdevs/atob/issues"
marketing-site: "https://github.com/nostrdevs/atob"
donation-url: null
description:
  short: "ATOB - A containerized application for Nostr"
  long: |
    ATOB is a containerized application designed for the Nostr ecosystem.
    This package runs ATOB on your Neode server with automatic configuration.

# Assets
assets:
  license: LICENSE.md
  icon: icon.png
  instructions: INSTRUCTIONS.md
  docker-images: docker_images

# Main container
main:
  type: docker
  image: main
  entrypoint: "docker_entrypoint.sh"
  args: []
  mounts:
    main: /data

# Volumes
volumes:
  main:
    type: data

# Interfaces (exposed services)
interfaces:
  main:
    name: Web Interface
    description: Main ATOB web interface
    tor-config:
      port-mapping:
        80: "80"
    lan-config:
      443:
        ssl: true
        internal: 80
    ui: true
    protocols:
      - tcp
      - http

# Health checks
health-checks:
  web-ui:
    name: Web Interface
    success-message: "ATOB is ready!"
    type: docker
    image: main
    entrypoint: "check-web.sh"
    args: []
    io-format: yaml
    inject: true

# Configuration (optional)
config: ~

# Properties
properties: ~

# Dependencies
dependencies: {}

# Backup configuration
backup:
  create:
    type: docker
    image: compat
    system: true
    entrypoint: compat
    args:
      - duplicity
      - create
      - /mnt/backup
      - /data
    mounts:
      BACKUP: /mnt/backup
      main: /data
  restore:
    type: docker
    image: compat
    system: true
    entrypoint: compat
    args:
      - duplicity
      - restore
      - /mnt/backup
      - /data
    mounts:
      BACKUP: /mnt/backup
      main: /data

# Migrations (for updates)
migrations:
  from:
    "*":
      type: none
  to:
    "*":
      type: none
```

### Step 3: Create LICENSE.md

Copy your project's license or create a simple one:

```markdown
# MIT License

Copyright (c) 2025 Nostr Devs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

### Step 4: Create INSTRUCTIONS.md

```markdown
# ATOB Instructions

## Getting Started

1. After installation, ATOB will be available at the interface URL
2. Access it through the Neode dashboard
3. Configuration is automatic

## Usage

[Add specific instructions for your app]

## Support

For issues, visit: https://github.com/nostrdevs/atob/issues
```

### Step 5: Add an Icon

Create or download a 512x512 PNG icon and save it as `icon.png`

### Step 6: Export Docker Image

```bash
# Build your Docker image
cd /path/to/atob
docker build -t atob:latest .

# Save the image
mkdir -p ~/atob-package/docker_images
docker save atob:latest -o ~/atob-package/docker_images/$(uname -m).tar

# The filename should match your architecture:
# - x86_64.tar for Intel/AMD
# - aarch64.tar for ARM64/Apple Silicon
```

### Step 7: Create scripts/procedures/main.ts

This is the entry point for your service:

```typescript
import { types as T, matches, YAML } from "../deps.ts";

// This is the main entry point for your service
export const main: T.ExpectedExports.main = async (effects: T.Effects) => {
  return await effects.createContainer({
    image: "main",
    entrypoint: ["/bin/sh"],
    mounts: {
      main: "/data",
    },
  });
};

// Properties that will be displayed in the UI
export const properties: T.ExpectedExports.properties = async (
  effects: T.Effects
) => {
  return {
    version: "0.1.0",
    "Automatic TOR Address": {
      type: "string",
      value: effects.interfaces.main.torAddress,
      qr: true,
      copyable: true,
      masked: false,
    },
  };
};

// Health check
export const health: T.ExpectedExports.health = async (effects: T.Effects) => {
  return await effects.health.checkWebUrl("http://main.embassy:80");
};
```

### Step 8: Build the S9PK

```bash
# Navigate to your package directory
cd ~/atob-package

# Use the StartOS CLI to pack it
/Users/tx1138/Code/Neode/core/target/release/startos pack

# This will create: atob.s9pk
```

### Step 9: Install on Neode

**Option A: Via CLI (Direct)**
```bash
# Copy the .s9pk to your Neode server
scp atob.s9pk user@neode-server:/tmp/

# SSH into the server
ssh user@neode-server

# Install using CLI
startos package.sideload /tmp/atob.s9pk
```

**Option B: Via UI (Once Marketplace is Connected)**
1. Navigate to Marketplace in Neode UI
2. Click "Sideload Package"
3. Upload `atob.s9pk`
4. Wait for installation to complete

## Testing Your Package

### Validate Before Installing
```bash
# Inspect the package without installing
/Users/tx1138/Code/Neode/core/target/release/startos inspect atob.s9pk
```

### Development Workflow

1. **Make changes** to your manifest or scripts
2. **Rebuild** the s9pk: `startos pack`
3. **Uninstall** old version: `startos package.uninstall atob`
4. **Install** new version: `startos package.sideload atob.s9pk`

## Advanced Features

### Adding Configuration Options

Add to `manifest.yaml`:

```yaml
config:
  get:
    type: script
  set:
    type: script

# Then create scripts/procedures/getConfig.ts and setConfig.ts
```

### Adding User Actions

```yaml
actions:
  restart-service:
    name: "Restart Service"
    description: "Manually restart the ATOB service"
    warning: "This will temporarily interrupt service"
    allowed-statuses:
      - running
    implementation:
      type: docker
      image: main
      entrypoint: "restart.sh"
```

### Multi-Architecture Support

Build for multiple architectures:

```bash
# Build for x86_64
docker buildx build --platform linux/amd64 -t atob:amd64 .
docker save atob:amd64 -o docker_images/x86_64.tar

# Build for ARM64
docker buildx build --platform linux/arm64 -t atob:arm64 .
docker save atob:arm64 -o docker_images/aarch64.tar
```

## Resources

- **StartOS Package Manifest Schema**: [Official Docs](https://docs.start9.com)
- **Example Packages**: `/Users/tx1138/Code/Neode/core/startos/test/`
- **SDK Reference**: Built binaries in `core/target/release/`

## Troubleshooting

### Package Won't Install
- Check manifest syntax: `yamllint manifest.yaml`
- Verify docker image exists: `tar -tzf docker_images/aarch64.tar | head`
- Check logs on server: `journalctl -u startos -f`

### Service Won't Start
- Check container logs: `docker logs $(docker ps -a | grep atob | awk '{print $1}')`
- Verify entrypoint script exists and is executable
- Check volume mounts in manifest

### Interface Not Accessible
- Verify port mappings in `interfaces` section
- Check that your container is listening on the correct port
- Wait for TOR address generation (can take 2-3 minutes)

## Quick Reference

```bash
# Pack a package
startos pack

# Inspect a package
startos inspect atob.s9pk

# Install (CLI)
startos package.sideload atob.s9pk

# List installed packages
startos package.list

# Uninstall
startos package.uninstall atob

# Check package status
startos package.properties atob
```

