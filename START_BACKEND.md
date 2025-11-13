# Starting the Real Neode Backend

## Quick Start

```bash
cd /Users/tx1138/Code/Neode
./start-real-backend.sh
```

This will build and start the real Rust backend on port 5959.

## Manual Steps

### 1. Install Dependencies (First Time Only)

#### macOS (using Homebrew)
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install PostgreSQL
brew install postgresql@14
brew services start postgresql@14

# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop

# (Optional) Install Tor for .onion support
brew install tor
brew services start tor
```

#### Linux (Debian/Ubuntu)
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# (Optional) Install Tor
sudo apt-get install tor
```

### 2. Initialize Database (First Time Only)

```bash
# Create PostgreSQL database
createdb startos

# Or if you need to specify user:
createdb -U postgres startos
```

### 3. Build the Backend

```bash
cd /Users/tx1138/Code/Neode/core
cargo build --release

# This takes 5-10 minutes on first build
# Subsequent builds are much faster
```

### 4. Run the Backend

```bash
# Simple start
./target/release/startos

# With debug logging
RUST_LOG=debug ./target/release/startos

# With custom database URL
DATABASE_URL=postgresql://user:pass@localhost/startos ./target/release/startos
```

## Configuration

The backend looks for config in these locations:
1. `/etc/startos/config.yaml` (production)
2. `~/.config/startos/config.yaml` (user)
3. Environment variables

### Minimal Config

Create `~/.config/startos/config.yaml`:

```yaml
datadir: ~/.local/share/startos
db-path: ~/.local/share/startos/db
secret-store: postgresql://localhost/startos
bind-rpc: 0.0.0.0:5959

# Optional: Tor configuration
tor-control: 127.0.0.1:9051
tor-socks: 127.0.0.1:9050

# Optional: DNS
dns-bind:
  - 127.0.0.1:5353
```

## Verify It's Running

```bash
# Test RPC endpoint
curl http://localhost:5959/rpc/v1 -X POST \
  -H "Content-Type: application/json" \
  -d '{"method":"echo","params":{"message":"test"}}'

# Should return: {"result":"test"}
```

## Common Issues

### Port 5959 Already in Use

```bash
# Find what's using it
lsof -i :5959

# Kill mock backend if running
pkill -f "node mock-backend.js"
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
brew services list | grep postgresql
# or
sudo systemctl status postgresql

# Test connection
psql -U postgres -c "SELECT 1"
```

### Permission Denied

```bash
# Make sure binary is executable
chmod +x ./target/release/startos

# Check datadir permissions
mkdir -p ~/.local/share/startos
chmod 755 ~/.local/share/startos
```

### Rust Build Failed

```bash
# Update Rust
rustup update stable

# Clean and rebuild
cargo clean
cargo build --release
```

## Development Mode

For rapid iteration:

```bash
# Run in debug mode (faster compile, slower runtime)
cargo run

# Watch for changes and auto-reload
cargo install cargo-watch
cargo watch -x run
```

## Environment Variables

```bash
# Database
export DATABASE_URL="postgresql://localhost/startos"

# Data directory
export STARTOS_DATADIR="~/.local/share/startos"

# Log level
export RUST_LOG="debug"      # Verbose
export RUST_LOG="info"       # Normal
export RUST_LOG="warn"       # Quiet

# Bind address
export STARTOS_BIND_RPC="0.0.0.0:5959"
```

## Next Steps

Once backend is running:

```bash
# In another terminal, start the UI
cd /Users/tx1138/Code/Neode/neode-ui
npm run dev

# Access at: http://localhost:8100
```

## Stopping the Backend

```bash
# If running in foreground: Ctrl+C

# If running in background:
pkill startos

# Or find and kill by PID:
ps aux | grep startos
kill <PID>
```

## Logs

Backend logs go to:
- `stdout` when running in terminal
- `~/.local/share/startos/logs/` when running as service
- `journalctl -u startos` if running as systemd service

## Service Setup (Optional)

To run as a system service:

```bash
# Copy the service file
sudo cp core/startos/startd.service /etc/systemd/system/startos.service

# Edit paths in service file
sudo nano /etc/systemd/system/startos.service

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable startos
sudo systemctl start startos

# Check status
sudo systemctl status startos

# View logs
journalctl -u startos -f
```

