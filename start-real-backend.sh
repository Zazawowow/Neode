#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   🚀 Starting Real Neode Backend                          ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if we're in the right directory
if [ ! -d "core" ]; then
    echo -e "${RED}Error: Must be run from Neode root directory${NC}"
    echo "cd /Users/tx1138/Code/Neode && ./start-real-backend.sh"
    exit 1
fi

# Check for Rust
if ! command -v cargo &> /dev/null; then
    echo -e "${YELLOW}Rust not found. Installing...${NC}"
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
fi

echo -e "${GREEN}✓ Rust installed${NC}"

# Check for PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL not found.${NC}"
    echo "Please install PostgreSQL:"
    echo "  macOS: brew install postgresql@14"
    echo "  Linux: sudo apt-get install postgresql"
    exit 1
fi

echo -e "${GREEN}✓ PostgreSQL found${NC}"

# Check if database exists
if ! psql -lqt | cut -d \| -f 1 | grep -qw startos 2>/dev/null; then
    echo -e "${YELLOW}Creating startos database...${NC}"
    createdb startos 2>/dev/null || createdb -U postgres startos 2>/dev/null || true
fi

echo -e "${GREEN}✓ Database ready${NC}"

# Create data directory
DATADIR="$HOME/.local/share/startos"
mkdir -p "$DATADIR"
echo -e "${GREEN}✓ Data directory: $DATADIR${NC}"

# Check if binary exists
BINARY="core/target/release/startos"
if [ ! -f "$BINARY" ]; then
    echo -e "${YELLOW}Backend not built. Building now (this may take 5-10 minutes)...${NC}"
    cd core
    cargo build --release
    cd ..
    echo -e "${GREEN}✓ Build complete${NC}"
else
    echo -e "${GREEN}✓ Backend binary exists${NC}"
fi

# Stop mock backend if running
if pgrep -f "node mock-backend.js" > /dev/null; then
    echo -e "${YELLOW}Stopping mock backend...${NC}"
    pkill -f "node mock-backend.js" || true
    sleep 1
fi

# Stop existing backend if running
if pgrep -f "target/release/startos" > /dev/null; then
    echo -e "${YELLOW}Stopping existing backend...${NC}"
    pkill -f "target/release/startos" || true
    sleep 2
fi

echo ""
echo -e "${GREEN}Starting real backend on port 5959...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Set environment variables
export RUST_LOG="${RUST_LOG:-info}"
export DATABASE_URL="${DATABASE_URL:-postgresql://localhost/startos}"

# Start backend
cd core
./target/release/startos

