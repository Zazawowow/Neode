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
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const execPromise = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

// Helper: Install package from s9pk
async function installPackage(id, url) {
  console.log(`[Package] Installing ${id}...`)
  
  try {
    // For development, we'll use the pre-built Docker image
    // In production, the real backend would extract the s9pk using StartOS SDK
    
    const version = '0.1.0'
    
    // Stop and remove existing container if it exists
    try {
      await execPromise(`docker stop ${id}-test 2>/dev/null || true`)
      await execPromise(`docker rm ${id}-test 2>/dev/null || true`)
    } catch (e) {
      // Ignore errors
    }
    
    // Check if Docker image exists
    const { stdout } = await execPromise(`docker images -q ${id}:${version}`)
    if (!stdout.trim()) {
      throw new Error(`Docker image ${id}:${version} not found. Build it first: cd ~/atob-package && docker build -t ${id}:${version} .`)
    }
    
    // Determine port mapping
    const portMap = id === 'atob' ? '8102:80' : '8103:80'
    
    // Start container
    await execPromise(`docker run -d --name ${id}-test -p ${portMap} ${id}:${version}`)
    
    // Wait for container to be ready
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Verify container is running
    const { stdout: containerStatus } = await execPromise(`docker ps --filter name=${id}-test --format "{{.Status}}"`)
    if (!containerStatus.includes('Up')) {
      throw new Error(`Container ${id}-test failed to start`)
    }
    
    // Add to mock data
    mockData['package-data'][id] = {
      title: id === 'atob' ? 'A to B Bitcoin' : id,
      version: version,
      status: 'running',
      state: 'running',
      manifest: {
        id: id,
        title: id === 'atob' ? 'A to B Bitcoin' : id,
        version: version,
        description: {
          short: id === 'atob' ? 'Bitcoin tools and services for seamless transactions' : `${id} application`,
          long: id === 'atob' ? 'A to B Bitcoin provides tools and services for Bitcoin transactions.' : `${id} application`
        },
        icon: id === 'atob' ? '/assets/img/atob.png' : '/assets/img/logo-neode.png',
        interfaces: {
          main: {
            name: 'Web Interface',
            description: `${id} web interface`,
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
        icon: id === 'atob' ? '/assets/img/atob.png' : '/assets/img/logo-neode.png',
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
    
    console.log(`[Package] ✅ ${id} installed and running on port ${portMap.split(':')[0]}`)
    return { success: true, containerId: `${id}-test` }
    
  } catch (error) {
    console.error(`[Package] Installation failed:`, error.message)
    throw error
  }
}

// Helper: Uninstall package
async function uninstallPackage(id) {
  console.log(`[Package] Uninstalling ${id}...`)
  
  try {
    // Stop and remove container
    await execPromise(`docker stop ${id}-test 2>/dev/null || true`)
    await execPromise(`docker rm ${id}-test 2>/dev/null || true`)
    
    // Remove from mock data
    delete mockData['package-data'][id]
    
    // Broadcast update
    broadcastUpdate([
      {
        op: 'remove',
        path: `/package-data/${id}`
      }
    ])
    
    console.log(`[Package] ✅ ${id} uninstalled`)
    return { success: true }
    
  } catch (error) {
    console.error(`[Package] Uninstall failed:`, error.message)
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

server.listen(PORT, () => {
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

