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

const app = express()
const PORT = 5959

app.use(cors({ credentials: true, origin: 'http://localhost:8100' }))
app.use(express.json())
app.use(cookieParser())

// Mock session storage
const sessions = new Map()
const MOCK_PASSWORD = 'password123'

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
    },
    'lightning': {
      title: 'Lightning Network',
      version: '0.15.0',
      status: 'stopped',
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

      case 'server.update':
      case 'server.restart':
      case 'server.shutdown':
      case 'package.install':
      case 'package.uninstall':
      case 'package.start':
      case 'package.stop':
      case 'package.restart': {
        return res.json({ result: 'ok' })
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

