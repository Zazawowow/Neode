#!/usr/bin/env bash

# Neode Development Server Startup Script
# This script starts both the mock backend and Vite dev server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}                                                            ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}   ${GREEN}🚀 Starting Neode Development Environment${NC}             ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}                                                            ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Function to kill process on a port
kill_port() {
    local port=$1
    if check_port $port; then
        echo -e "${YELLOW}⚠️  Port $port is in use, cleaning up...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Clean up function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down servers...${NC}"
    
    # Kill all node processes started by this script
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$VITE_PID" ]; then
        kill $VITE_PID 2>/dev/null || true
    fi
    
    # Also kill concurrently if it's running
    pkill -f "concurrently" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit 0
}

# Set up cleanup trap
trap cleanup SIGINT SIGTERM EXIT

# Check for required ports and clean them up if needed
echo -e "${BLUE}🔍 Checking ports...${NC}"
kill_port 5959  # Mock backend
kill_port 8100  # Vite dev server
kill_port 8101  # Potential fallback port
kill_port 8102  # Another fallback port

echo -e "${GREEN}✅ Ports cleared${NC}"
echo ""

# Check and start Docker Desktop if needed
echo -e "${BLUE}🐳 Checking Docker...${NC}"
if ! /usr/local/bin/docker ps > /dev/null 2>&1; then
    echo -e "${YELLOW}   Docker Desktop not running, starting it...${NC}"
    open -a Docker
    
    # Wait for Docker to be ready
    echo -e "${BLUE}   Waiting for Docker to start...${NC}"
    max_wait=60
    waited=0
    while ! /usr/local/bin/docker ps > /dev/null 2>&1; do
        if [ $waited -ge $max_wait ]; then
            echo -e "${YELLOW}   ⚠️  Docker took too long to start. Apps will be simulated.${NC}"
            break
        fi
        sleep 2
        waited=$((waited + 2))
        echo -e "${BLUE}   ...${NC}"
    done
    
    if /usr/local/bin/docker ps > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ Docker is ready!${NC}"
    fi
else
    echo -e "${GREEN}   ✅ Docker is already running${NC}"
fi
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Running npm install...${NC}"
    npm install
    echo ""
fi

# Start the servers using npm script
echo -e "${BLUE}🚀 Starting servers...${NC}"
echo ""

# Use npm run dev:mock which uses concurrently
npm run dev:mock

# Note: The script will stay running until Ctrl+C

