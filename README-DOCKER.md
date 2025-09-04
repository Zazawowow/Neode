# Neode Docker Deployment

This repository contains the containerized version of Neode, a modern fork of StartOS with enhanced UI/UX.

## Quick Start with Portainer

### Option 1: Portainer Stack (Recommended)

1. In Portainer, go to **Stacks** → **Add Stack**
2. Choose **Repository** deployment method
3. Use this repository URL: `https://github.com/Zazawowow/Neode`
4. Set **Compose path**: `portainer-stack.yml`
5. Deploy the stack

### Option 2: Manual Docker Compose

```bash
# Clone the repository
git clone https://github.com/Zazawowow/Neode.git
cd Neode

# Deploy with Docker Compose
docker-compose up -d
```

### Option 3: Direct Docker Run

```bash
docker run -d \
  --name neode-web \
  -p 8080:80 \
  --restart unless-stopped \
  ghcr.io/zazawowow/neode:latest
```

## Access

- **Web Interface**: http://localhost:8080
- **Health Check**: http://localhost:8080/health

## Features

- ✅ **DID Integration**: Decentralized Identity setup flow
- ✅ **Modern UI**: Glass morphism design with Neode branding
- ✅ **Responsive**: Mobile-first design
- ✅ **Containerized**: Ready for production deployment
- ✅ **Health Checks**: Built-in monitoring endpoints

## Configuration

The container uses the following defaults:
- **Port**: 80 (mapped to 8080 on host)
- **Environment**: Production mode
- **Assets**: Served with 1-year cache headers
- **Routing**: SPA routing handled by nginx

## Development

To build locally:

```bash
# Build the Docker image
docker build -t neode:local .

# Run locally
docker run -p 8080:80 neode:local
```

## CI/CD

The repository includes GitHub Actions workflow that automatically:
- Builds Docker images on push to main
- Pushes to GitHub Container Registry
- Tags with branch names and latest

## Support

For issues and support, please open an issue on the GitHub repository.
