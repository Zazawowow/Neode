// Demo WebSocket Client - No actual WebSocket connection
// This replaces the real WebSocket client for demo builds

import { applyPatch, type Operation } from 'fast-json-patch'

// Mock data that would normally come from the server
const mockData = {
  'server-info': {
    id: 'demo-server-id',
    version: '0.3.5-demo',
    name: 'Neode Demo Server',
    pubkey: 'demo-pubkey-12345',
    'status-info': {
      restarting: false,
      'shutting-down': false,
      updated: false,
      'backup-progress': null,
      'update-progress': null,
    },
    'lan-address': '192.168.1.100',
    unread: 0,
    'wifi-ssids': ['Demo WiFi', 'Guest Network'],
    'zram-enabled': true,
  },
  'package-data': {
    bitcoin: {
      title: 'Bitcoin Core',
      version: '24.0.0',
      status: 'running',
    },
    lightning: {
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

class WebSocketClientDemo {
  private callbacks: Array<(data: any) => void> = []
  private isConnectedState = false
  private data = JSON.parse(JSON.stringify(mockData))

  constructor() {
    console.log('🎨 Demo Mode: WebSocket client initialized (no backend)')
  }

  connect(onData: (data: any) => void, onError?: (error: any) => void) {
    console.log('🎨 Demo WebSocket: Simulating connection')
    
    this.callbacks.push(onData)
    this.isConnectedState = true

    // Simulate initial data load
    setTimeout(() => {
      console.log('🎨 Demo WebSocket: Sending initial data')
      onData({
        type: 'initial',
        data: this.data,
      })
    }, 500)

    // Simulate periodic updates
    const updateInterval = setInterval(() => {
      if (!this.isConnectedState) {
        clearInterval(updateInterval)
        return
      }

      // Send a random update
      const updates = [
        {
          op: 'replace',
          path: '/server-info/unread',
          value: Math.floor(Math.random() * 10),
        },
      ]

      console.log('🎨 Demo WebSocket: Sending patch', updates)
      onData({
        type: 'patch',
        patch: updates,
      })
    }, 10000) // Update every 10 seconds
  }

  disconnect() {
    console.log('🎨 Demo WebSocket: Disconnecting')
    this.isConnectedState = false
    this.callbacks = []
  }

  isConnected(): boolean {
    return this.isConnectedState
  }
}

export const wsClient = new WebSocketClientDemo()

export function applyDataPatch(data: any, patches: Operation[]): any {
  try {
    const result = applyPatch(data, patches, true, false)
    return result.newDocument
  } catch (error) {
    console.error('🎨 Demo: Error applying patch:', error)
    return data
  }
}

