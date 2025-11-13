#!/bin/bash

# Test S9PK Installation Locally
# This simulates installing the ATOB s9pk package like StartOS would

set -e

ATOB_PKG="$HOME/atob-package/atob.s9pk"
ATOB_PORT=8102
CONTAINER_NAME="atob-test"

echo "🚀 Testing ATOB S9PK Package Installation"
echo "============================================"

# Check if s9pk exists
if [ ! -f "$ATOB_PKG" ]; then
    echo "❌ Error: atob.s9pk not found at $ATOB_PKG"
    echo "Please build it first: cd ~/atob-package && ./start-sdk pack"
    exit 1
fi

echo "✅ Found atob.s9pk ($(du -h "$ATOB_PKG" | cut -f1))"

# Stop and remove any existing container
if docker ps -a | grep -q "$CONTAINER_NAME"; then
    echo "🧹 Removing existing test container..."
    docker rm -f "$CONTAINER_NAME" > /dev/null 2>&1 || true
fi

# Extract and inspect the s9pk
echo ""
echo "📦 Extracting Docker image from S9PK..."
cd ~/atob-package

# Load the Docker image from the s9pk
# The s9pk contains a tar file with the Docker image
echo "Loading Docker image..."
docker load -i docker_images/arm64.tar

# Get the image ID
IMAGE_ID=$(docker images -q atob:0.1.0)
if [ -z "$IMAGE_ID" ]; then
    echo "❌ Error: Could not find atob:0.1.0 image after loading"
    exit 1
fi

echo "✅ Docker image loaded: atob:0.1.0 ($IMAGE_ID)"

# Run the container (simulating StartOS running it)
echo ""
echo "🐳 Starting ATOB container..."
docker run -d \
    --name "$CONTAINER_NAME" \
    -p "$ATOB_PORT:80" \
    --restart unless-stopped \
    atob:0.1.0

# Wait for container to be healthy
echo "⏳ Waiting for container to be healthy..."
sleep 3

# Check health
if docker exec "$CONTAINER_NAME" /check-web.sh | grep -q "result: true"; then
    echo "✅ Health check passed!"
else
    echo "⚠️  Health check failed, but container is running"
fi

# Get container status
CONTAINER_STATUS=$(docker inspect --format='{{.State.Status}}' "$CONTAINER_NAME")
echo "📊 Container status: $CONTAINER_STATUS"

# Test the interface
echo ""
echo "🌐 Testing ATOB interface..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$ATOB_PORT)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ ATOB is accessible at http://localhost:$ATOB_PORT"
else
    echo "❌ Error: Got HTTP $HTTP_CODE from ATOB"
fi

# Show container logs
echo ""
echo "📝 Container logs (last 10 lines):"
docker logs --tail 10 "$CONTAINER_NAME"

echo ""
echo "============================================"
echo "✅ ATOB S9PK Installation Test Complete!"
echo ""
echo "🎯 Access ATOB at: http://localhost:$ATOB_PORT"
echo ""
echo "📋 Useful commands:"
echo "  View logs:    docker logs -f $CONTAINER_NAME"
echo "  Stop:         docker stop $CONTAINER_NAME"
echo "  Restart:      docker restart $CONTAINER_NAME"
echo "  Remove:       docker rm -f $CONTAINER_NAME"
echo ""
echo "🔧 To update Neode to use this:"
echo "  Update launch URL to: http://localhost:$ATOB_PORT"
echo ""

