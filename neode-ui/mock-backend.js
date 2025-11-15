#!/usr/bin/env node

/**
 * Mock Backend Server for Neode UI Development
 * This provides fake responses for RPC calls so you can develop the UI without a real backend
 */

import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { WebSocketServer } from 'ws'
import http from 'http'
import { exec } from 'child_process'
import { promisify } from 'util'

const execPromise = promisify(exec)

const app = express()
const PORT = 5959

// CORS configuration - allow all origins in Docker, localhost only in dev
const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true)
    
    // Allow localhost and any other origin (for Docker deployments)
    // In production, you'd want to restrict this to specific domains
    callback(null, true)
  }
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

// Mock session storage
const sessions = new Map()
const MOCK_PASSWORD = 'password123'

// WebSocket clients for broadcasting updates
const wsClients = new Set()

// Helper: Broadcast data update to all WebSocket clients
function broadcastUpdate(patch) {
  const message = JSON.stringify({
    rev: Date.now(),
    patch: patch
  })
  wsClients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(message)
    }
  })
}

// Track used ports and running containers
const usedPorts = new Set([5959, 8100]) // Backend and Vite dev server
const runningContainers = new Map() // id -> { port, containerId, dockerMode }

// Predefined port mappings for known apps
const portMappings = {
  'atob': 8102,
  'k484': 8103,
  'amin': 8104
}

// Helper: Check if Docker daemon is actually running
async function isDockerAvailable() {
  try {
    await execPromise('docker ps')
    return true
  } catch {
    return false
  }
}

// Helper: Install package with Docker (if available) or simulate
async function installPackage(id, url) {
  console.log(`[Package] 📦 Installing ${id}...`)
  
  try {
    // Check if already installed
    if (mockData['package-data'][id]) {
      throw new Error(`Package ${id} is already installed`)
    }
    
    const version = '0.1.0'
    const dockerAvailable = await isDockerAvailable()
    
    // Get package metadata
    const packageMetadata = {
      'atob': {
        title: 'A to B Bitcoin',
        shortDesc: 'Bitcoin tools and services for seamless transactions',
        longDesc: 'A to B Bitcoin provides tools and services for Bitcoin transactions.',
        icon: '/assets/img/atob.png'
      },
      'k484': {
        title: 'K484',
        shortDesc: 'Point of Sale and Admin system for Neode',
        longDesc: 'K484 provides a complete POS and administration system for your Neode server.',
        icon: '/assets/img/k484.png'
      },
      'amin': {
        title: 'Amin',
        shortDesc: 'Administrative interface for Neode',
        longDesc: 'Amin provides administrative tools and monitoring for your Neode server.',
        icon: '/assets/img/logo-neode.png'
      }
    }
    
    const metadata = packageMetadata[id] || {
      title: id.charAt(0).toUpperCase() + id.slice(1),
      shortDesc: `${id} application`,
      longDesc: `${id} application for Neode`,
      icon: '/assets/img/logo-neode.png'
    }
    
    // Determine port
    const assignedPort = portMappings[id] || 8105
    usedPorts.add(assignedPort)
    
    let dockerMode = false
    let actuallyRunning = false
    
    // Try to run with Docker if available
    if (dockerAvailable) {
      try {
        console.log(`[Package] 🐳 Docker available, attempting to run container...`)
        
        // Stop and remove existing container if it exists
        try {
          await execPromise(`docker stop ${id}-test 2>/dev/null || true`)
          await execPromise(`docker rm ${id}-test 2>/dev/null || true`)
        } catch (e) {
          // Ignore errors
        }
        
        // Check if Docker image exists
        const { stdout } = await execPromise(`docker images -q ${id}:${version}`)
        
        if (stdout.trim()) {
          // Image exists, start container
          await execPromise(`docker run -d --name ${id}-test -p ${assignedPort}:80 ${id}:${version}`)
          
          // Wait for container to be ready
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // Verify container is running
          const { stdout: containerStatus } = await execPromise(`docker ps --filter name=${id}-test --format "{{.Status}}"`)
          
          if (containerStatus.includes('Up')) {
            dockerMode = true
            actuallyRunning = true
            runningContainers.set(id, { port: assignedPort, containerId: `${id}-test`, dockerMode: true })
            console.log(`[Package] 🐳 Docker container running on port ${assignedPort}`)
            
            // Auto-fix nginx config for k484 to enable SPA routing
            if (id === 'k484') {
              try {
                console.log(`[Package] 🔧 Configuring nginx for SPA routing...`)
                
                // Fix nginx config
                await execPromise(`docker exec ${id}-test sh -c 'cat > /etc/nginx/conf.d/default.conf << "EOF"
server {
    listen       80;
    listen  [::]:80;
    server_name  localhost;
    root   /usr/share/nginx/html;
    index  index.html;

    location / {
        try_files \\\\$uri /index.html;
    }

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
EOF
'`)
                
                // Fix logo permissions
                await execPromise(`docker exec ${id}-test chmod 644 /usr/share/nginx/html/k484-logo.png`)
                
                // Restart container to apply nginx config
                await execPromise(`docker restart ${id}-test`)
                await new Promise(resolve => setTimeout(resolve, 2000))
                
                console.log(`[Package] ✅ nginx configured - /admin route enabled`)
              } catch (fixError) {
                console.log(`[Package] ⚠️  nginx auto-fix failed: ${fixError.message}`)
              }
            }
          } else {
            console.log(`[Package] ⚠️  Container failed to start, falling back to simulation`)
          }
        } else {
          console.log(`[Package] ℹ️  Docker image ${id}:${version} not found, using simulation mode`)
        }
      } catch (dockerError) {
        console.log(`[Package] ⚠️  Docker error (${dockerError.message}), falling back to simulation`)
      }
    } else {
      console.log(`[Package] ℹ️  Docker not available, using simulation mode`)
    }
    
    // If Docker didn't work, simulate installation
    if (!dockerMode) {
      await new Promise(resolve => setTimeout(resolve, 1500))
      runningContainers.set(id, { port: assignedPort, containerId: null, dockerMode: false })
    }
    
    // Add to mock data
    mockData['package-data'][id] = {
      title: metadata.title,
      version: version,
      status: 'running',
      state: 'running',
      port: assignedPort,
      dockerMode: dockerMode,
      actuallyRunning: actuallyRunning,
      manifest: {
        id: id,
        title: metadata.title,
        version: version,
        description: {
          short: metadata.shortDesc,
          long: metadata.longDesc
        },
        icon: metadata.icon,
        interfaces: {
          main: {
            name: 'Web Interface',
            description: `${metadata.title} web interface`,
            ui: true,
            'tor-config': {
              'port-mapping': {
                80: '80',
              },
            },
            'lan-config': {
              443: {
                ssl: true,
                internal: 80,
              },
            },
          },
        },
      },
      'static-files': {
        license: `/public/package-data/${id}/${version}/LICENSE.md`,
        icon: metadata.icon,
        instructions: `/public/package-data/${id}/${version}/INSTRUCTIONS.md`,
      },
    }
    
    // Broadcast update
    broadcastUpdate([
      {
        op: 'add',
        path: `/package-data/${id}`,
        value: mockData['package-data'][id]
      }
    ])
    
    if (dockerMode) {
      console.log(`[Package] ✅ ${id} installed and RUNNING at http://localhost:${assignedPort}`)
    } else {
      console.log(`[Package] ✅ ${id} installed (simulated - no Docker container)`)
    }
    
    return { success: true, port: assignedPort, dockerMode }
    
  } catch (error) {
    console.error(`[Package] ❌ Installation failed:`, error.message)
    throw error
  }
}

// Helper: Uninstall package (stops Docker container if running)
async function uninstallPackage(id) {
  console.log(`[Package] 🗑️  Uninstalling ${id}...`)
  
  try {
    // Check if package exists
    if (!mockData['package-data'][id]) {
      throw new Error(`Package ${id} is not installed`)
    }
    
    // Stop Docker container if it's running
    const containerInfo = runningContainers.get(id)
    if (containerInfo && containerInfo.dockerMode && containerInfo.containerId) {
      try {
        console.log(`[Package] 🐳 Stopping Docker container ${containerInfo.containerId}...`)
        await execPromise(`docker stop ${containerInfo.containerId} 2>/dev/null || true`)
        await execPromise(`docker rm ${containerInfo.containerId} 2>/dev/null || true`)
        console.log(`[Package] 🐳 Docker container stopped`)
      } catch (dockerError) {
        console.log(`[Package] ⚠️  Error stopping Docker container: ${dockerError.message}`)
      }
    }
    
    // Simulate uninstall delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Release the port
    const port = mockData['package-data'][id].port
    if (port) {
      usedPorts.delete(port)
    }
    
    // Remove from tracking
    runningContainers.delete(id)
    
    // Remove from mock data
    delete mockData['package-data'][id]
    
    // Broadcast update
    broadcastUpdate([
      {
        op: 'remove',
        path: `/package-data/${id}`
      }
    ])
    
    console.log(`[Package] ✅ ${id} uninstalled successfully`)
    return { success: true }
    
  } catch (error) {
    console.error(`[Package] ❌ Uninstall failed:`, error.message)
    throw error
  }
}

// Mock data
const mockData = {
  'server-info': {
    id: 'mock-server-id',
    version: '0.3.5',
    name: 'Neode Dev Server',
    pubkey: 'mock-pubkey',
    'status-info': {
      restarting: false,
      'shutting-down': false,
      updated: false,
      'backup-progress': null,
      'update-progress': null,
    },
    'lan-address': '192.168.1.100',
    unread: 3,
    'wifi-ssids': ['Home WiFi', 'Office Network'],
    'zram-enabled': true,
  },
  'package-data': {
    'bitcoin': {
      title: 'Bitcoin Core',
      version: '24.0.0',
      status: 'running',
      state: 'running',
      manifest: {
        id: 'bitcoin',
        title: 'Bitcoin Core',
        version: '24.0.0',
        description: {
          short: 'A full Bitcoin node',
          long: 'Store, validate, and relay blocks and transactions on the Bitcoin network.',
        },
        icon: '/assets/img/bitcoin.svg',
      },
      'static-files': {
        license: '/public/package-data/bitcoin/24.0.0/LICENSE.md',
        icon: '/assets/img/bitcoin.svg',
        instructions: '/public/package-data/bitcoin/24.0.0/INSTRUCTIONS.md',
      },
    },
    'lightning': {
      title: 'Lightning Network',
      version: '0.15.0',
      status: 'stopped',
      state: 'installed',
      manifest: {
        id: 'lightning',
        title: 'Core Lightning',
        version: '0.15.0',
        description: {
          short: 'Lightning Network implementation',
          long: 'Fast, low-cost Bitcoin payments using Lightning Network.',
        },
        icon: '/assets/img/c-lightning.png',
      },
      'static-files': {
        license: '/public/package-data/lightning/0.15.0/LICENSE.md',
        icon: '/assets/img/c-lightning.png',
        instructions: '/public/package-data/lightning/0.15.0/INSTRUCTIONS.md',
      },
    },
  },
  ui: {
    name: 'Neode',
    'ack-welcome': '0.3.0',
    marketplace: {
      'selected-hosts': ['https://marketplace.start9.com'],
      'known-hosts': {
        'https://marketplace.start9.com': {
          name: 'Start9 Marketplace',
        },
      },
    },
    theme: 'dark',
  },
}

// Handle CORS preflight for RPC endpoint
app.options('/rpc/v1', (req, res) => {
  res.status(200).end()
})

// RPC endpoint
app.post('/rpc/v1', (req, res) => {
  const { method, params } = req.body
  console.log(`[RPC] ${method}`, params)

  try {
    // Handle different RPC methods
    switch (method) {
      case 'auth.login': {
        const { password, metadata } = params
        
        // Simple password check
        if (password !== MOCK_PASSWORD) {
          return res.json({
            error: {
              code: -32603,
              message: 'Password Incorrect',
            },
          })
        }

        // Create session
        const sessionId = `session-${Date.now()}`
        sessions.set(sessionId, {
          createdAt: new Date(),
          metadata,
        })

        // Set cookie
        res.cookie('session', sessionId, {
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        })

        return res.json({ result: null })
      }

      case 'auth.logout': {
        const sessionId = req.cookies?.session
        if (sessionId) {
          sessions.delete(sessionId)
        }
        res.clearCookie('session')
        return res.json({ result: null })
      }

      case 'server.echo': {
        return res.json({ result: params.message })
      }

      case 'server.time': {
        return res.json({
          result: {
            now: new Date().toISOString(),
            uptime: process.uptime(),
          },
        })
      }

      case 'server.metrics': {
        return res.json({
          result: {
            cpu: 45.2,
            memory: 62.8,
            disk: 38.1,
          },
        })
      }

      case 'marketplace.get': {
        // Mock marketplace data
        const mockApps = [
          {
            id: 'bitcoin',
            title: 'Bitcoin Core',
            description: 'A full Bitcoin node. Store, validate, and relay blocks and transactions on the Bitcoin network.',
            version: '25.0.0',
            icon: '/assets/img/bitcoin.svg',
            author: 'Start9 Labs',
            license: 'MIT',
          },
          {
            id: 'lightning',
            title: 'Core Lightning',
            description: 'Lightning Network implementation for fast, low-cost Bitcoin payments.',
            version: '23.08',
            icon: '/assets/img/c-lightning.png',
            author: 'Blockstream',
            license: 'MIT',
          },
          {
            id: 'nextcloud',
            title: 'Nextcloud',
            description: 'Self-hosted file sync and sharing platform. Your own private cloud storage.',
            version: '27.1.0',
            icon: '/assets/img/nextcloud.png',
            author: 'Nextcloud',
            license: 'AGPL-3.0',
          },
          {
            id: 'btcpay',
            title: 'BTCPay Server',
            description: 'Self-hosted Bitcoin payment processor. Accept Bitcoin payments without fees.',
            version: '1.11.7',
            icon: '/assets/img/btcpay.png',
            author: 'BTCPay Server Foundation',
            license: 'MIT',
          },
          {
            id: 'atob',
            title: 'ATOB',
            description: 'A containerized application for the Nostr ecosystem.',
            version: '0.1.0',
            icon: '/assets/img/atob.png',
            author: 'Nostr Devs',
            license: 'MIT',
          },
        ]
        
        return res.json({ result: mockApps })
      }

      case 'server.update':
      case 'server.restart':
      case 'server.shutdown': {
        return res.json({ result: 'ok' })
      }

      case 'package.install': {
        const { id, url, version } = params
        
        // Run installation in background
        installPackage(id, url).catch(err => {
          console.error(`[RPC] Installation failed:`, err.message)
        })
        
        return res.json({ result: `job-${Date.now()}` })
      }

      case 'package.uninstall': {
        const { id } = params
        
        // Run uninstallation in background
        uninstallPackage(id).catch(err => {
          console.error(`[RPC] Uninstall failed:`, err.message)
        })
        
        return res.json({ result: 'ok' })
      }

      case 'package.start':
      case 'package.stop':
      case 'package.restart': {
        const { id } = params
        console.log(`[RPC] ${method} for package: ${id}`)
        return res.json({ result: 'ok' })
      }

      case 'package.sideload': {
        const { url } = params
        console.log(`[RPC] Sideloading package from: ${url}`)
        
        // Extract package ID from URL (simple approach)
        const packageId = url.split('/').pop().replace('.s9pk', '')
        
        // Run installation in background
        installPackage(packageId, url).catch(err => {
          console.error(`[RPC] Sideload failed:`, err)
        })
        
        return res.json({ result: `request-${Date.now()}` })
      }

      default: {
        return res.json({
          error: {
            code: -32601,
            message: `Method not found: ${method}`,
          },
        })
      }
    }
  } catch (error) {
    console.error('[RPC Error]', error)
    return res.json({
      error: {
        code: -32603,
        message: error.message,
      },
    })
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('healthy')
})

// WebSocket endpoint for real-time updates
const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws/db' })

wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected')
  
  // Add to clients set
  wsClients.add(ws)

  // Send initial data
  ws.send(JSON.stringify({
    type: 'initial',
    data: mockData,
  }))

  // Send periodic updates
  const interval = setInterval(() => {
    if (ws.readyState === 1) { // 1 = OPEN
      ws.send(JSON.stringify({
        type: 'patch',
        patch: [
          {
            op: 'replace',
            path: '/server-info/unread',
            value: Math.floor(Math.random() * 10),
          },
        ],
      }))
    }
  }, 5000)

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected')
    wsClients.delete(ws)
    clearInterval(interval)
  })

  ws.on('error', (error) => {
    console.error('[WebSocket Error]', error)
  })
})

server.listen(PORT, async () => {
  const dockerAvailable = await isDockerAvailable()
  
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Neode Mock Backend Server                            ║
║                                                            ║
║   RPC:       http://localhost:${PORT}/rpc/v1               ║
║   WebSocket: ws://localhost:${PORT}/ws/db                  ║
║                                                            ║
║   Mock credentials:                                        ║
║   Password: ${MOCK_PASSWORD}                              ║
║                                                            ║
║   Docker Status: ${dockerAvailable ? '🐳 Available (apps will run for real!)' : '⚠️  Not available (simulated mode)'}      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `)
  console.log('Mock backend is running. Press Ctrl+C to stop.\n')
})

process.on('SIGINT', () => {
  console.log('\n\nShutting down mock backend...')
  server.close(() => {
    console.log('Server stopped.')
    process.exit(0)
  })
})

