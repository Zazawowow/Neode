// WebSocket handler for real-time updates

import type { Update, DataModel, PatchOperation } from '../types/api'
import { applyPatch } from 'fast-json-patch'

type WebSocketCallback = (update: Update<DataModel>) => void

export class WebSocketClient {
  private ws: WebSocket | null = null
  private callbacks: Set<WebSocketCallback> = new Set()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000
  private shouldReconnect = true

  constructor(private url: string = '/ws/db') {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const wsUrl = `${protocol}//${host}${this.url}`

      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0
        resolve()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        reject(error)
      }

      this.ws.onmessage = (event) => {
        try {
          const update: Update<DataModel> = JSON.parse(event.data)
          this.callbacks.forEach((callback) => callback(update))
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('WebSocket closed')
        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => {
            this.reconnectAttempts++
            this.connect().catch(console.error)
          }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts))
        }
      }
    })
  }

  subscribe(callback: WebSocketCallback): () => void {
    this.callbacks.add(callback)
    return () => {
      this.callbacks.delete(callback)
    }
  }

  disconnect(): void {
    this.shouldReconnect = false
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const wsClient = new WebSocketClient()

// Helper to apply patches to data
export function applyDataPatch<T>(data: T, patch: PatchOperation[]): T {
  // Validate patch is an array before applying
  if (!Array.isArray(patch) || patch.length === 0) {
    console.warn('Invalid or empty patch received, returning original data')
    return data
  }
  
  try {
  const result = applyPatch(data, patch as any, false, false)
  return result.newDocument as T
  } catch (error) {
    console.error('Failed to apply patch:', error, 'Patch:', patch)
    return data // Return original data on error
  }
}

