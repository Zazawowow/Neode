// Main application store using Pinia

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DataModel } from '../types/api'
import { wsClient, applyDataPatch } from '../api/websocket'
import { rpcClient } from '../api/rpc-client'

export const useAppStore = defineStore('app', () => {
  // State
  const data = ref<DataModel | null>(null)
  const isAuthenticated = ref(localStorage.getItem('neode-auth') === 'true')
  const isConnected = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  let isWsSubscribed = false

  // Computed
  const serverInfo = computed(() => data.value?.['server-info'])
  const packages = computed(() => data.value?.['package-data'] || {})
  const uiData = computed(() => data.value?.ui)
  const serverName = computed(() => serverInfo.value?.name || 'Neode')
  const isRestarting = computed(() => serverInfo.value?.['status-info']?.restarting || false)
  const isShuttingDown = computed(() => serverInfo.value?.['status-info']?.['shutting-down'] || false)
  const isOffline = computed(() => !isConnected.value || isRestarting.value || isShuttingDown.value)

  // Actions
  async function login(password: string): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      await rpcClient.login(password)
      isAuthenticated.value = true
      localStorage.setItem('neode-auth', 'true')
      
      // Connect WebSocket after successful login
      await connectWebSocket()
      
      // Initialize data
      await initializeData()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      await rpcClient.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      isAuthenticated.value = false
      localStorage.removeItem('neode-auth')
      data.value = null
      isWsSubscribed = false
      wsClient.disconnect()
      isConnected.value = false
    }
  }

  async function connectWebSocket(): Promise<void> {
    try {
      console.log('[Store] Connecting WebSocket...')
      isConnected.value = false
      
      // Always ensure clean state before connecting
      if (isWsSubscribed) {
        console.log('[Store] Resetting previous subscription')
        isWsSubscribed = false
      }
      
      await wsClient.connect()
      console.log('[Store] WebSocket connected, subscribing to updates...')

      // Subscribe to updates
      isWsSubscribed = true
      wsClient.subscribe((update: any) => {
        // Handle mock backend format: {type: 'initial', data: {...}}
        if (update?.type === 'initial' && update?.data) {
          console.log('[Store] Received initial data from mock backend')
          data.value = update.data
          isConnected.value = true
        }
        // Handle real backend format: {rev: 0, data: {...}}
        else if (update?.data && update?.rev !== undefined) {
          console.log('[Store] Received dump from real backend at revision', update.rev)
          data.value = update.data
          isConnected.value = true
        }
        // Handle patch updates (both backends)
        else if (data.value && update?.patch) {
          try {
            console.log('[Store] Applying patch at revision', update.rev || 'unknown')
            data.value = applyDataPatch(data.value, update.patch)
            // Mark as connected once we receive any valid patch
            if (!isConnected.value) {
              isConnected.value = true
            }
          } catch (err) {
            console.error('[Store] Failed to apply WebSocket patch:', err)
          }
        }
      })
    } catch (err) {
      console.error('[Store] WebSocket connection failed:', err)
      isConnected.value = false
      isWsSubscribed = false
      // Don't throw - allow app to work without real-time updates
    }
  }

  async function initializeData(): Promise<void> {
    // Initialize with empty data structure
    // The WebSocket will populate it with real data
    data.value = {
      'server-info': {
        id: '',
        version: '',
        name: null,
        pubkey: '',
        'status-info': {
          restarting: false,
          'shutting-down': false,
          updated: false,
          'backup-progress': null,
          'update-progress': null,
        },
        'lan-address': null,
        unread: 0,
        'wifi-ssids': [],
        'zram-enabled': false,
      },
      'package-data': {},
      ui: {
        name: null,
        'ack-welcome': '',
        marketplace: {
          'selected-hosts': [],
          'known-hosts': {},
        },
        theme: 'dark',
      },
    }
  }
  
  // Check session validity on app load
  async function checkSession(): Promise<boolean> {
    console.log('[Store] Checking session...')
    
    if (!localStorage.getItem('neode-auth')) {
      console.log('[Store] No auth token found')
      return false
    }
    
    try {
      // Try to make an authenticated request to verify session
      console.log('[Store] Validating session with backend...')
      await rpcClient.call({ method: 'server.echo', params: { message: 'ping' } })
      isAuthenticated.value = true
      console.log('[Store] Session valid!')
      
      // Reset connection state before reconnecting
      isConnected.value = false
      
      // Reconnect WebSocket
      await connectWebSocket()
      
      // Wait for WebSocket to receive initial data with proper timeout
      const maxWait = 5000 // 5 seconds max (increased from 3s)
      const checkInterval = 100 // Check every 100ms
      let waited = 0
      
      console.log('[Store] Waiting for WebSocket data...')
      while (!isConnected.value && waited < maxWait) {
        await new Promise(resolve => setTimeout(resolve, checkInterval))
        waited += checkInterval
        
        // Log progress every second
        if (waited % 1000 === 0) {
          console.log(`[Store] Still waiting... (${waited/1000}s)`)
        }
      }
      
      if (isConnected.value) {
        console.log('[Store] WebSocket ready with data!')
        return true
      } else {
        console.warn('[Store] WebSocket timeout after 5s - forcing reconnect...')
        // Try one more time with a fresh connection
        isWsSubscribed = false
        await connectWebSocket()
        
        // Give it 2 more seconds
        waited = 0
        while (!isConnected.value && waited < 2000) {
          await new Promise(resolve => setTimeout(resolve, checkInterval))
          waited += checkInterval
        }
        
        if (isConnected.value) {
          console.log('[Store] WebSocket reconnected successfully!')
          return true
        } else {
          console.error('[Store] WebSocket failed to connect after retries')
          // Continue anyway but mark as offline
          return true
        }
      }
    } catch (err) {
      console.error('[Store] Session check failed:', err)
      // Session invalid, clear auth
      localStorage.removeItem('neode-auth')
      isAuthenticated.value = false
      isWsSubscribed = false
      return false
    }
  }

  // Package actions
  async function installPackage(id: string, marketplaceUrl: string, version: string): Promise<string> {
    return rpcClient.installPackage(id, marketplaceUrl, version)
  }

  async function uninstallPackage(id: string): Promise<void> {
    return rpcClient.uninstallPackage(id)
  }

  async function startPackage(id: string): Promise<void> {
    return rpcClient.startPackage(id)
  }

  async function stopPackage(id: string): Promise<void> {
    return rpcClient.stopPackage(id)
  }

  async function restartPackage(id: string): Promise<void> {
    return rpcClient.restartPackage(id)
  }

  // Server actions
  async function updateServer(marketplaceUrl: string): Promise<'updating' | 'no-updates'> {
    return rpcClient.updateServer(marketplaceUrl)
  }

  async function restartServer(): Promise<void> {
    return rpcClient.restartServer()
  }

  async function shutdownServer(): Promise<void> {
    return rpcClient.shutdownServer()
  }

  async function getMetrics(): Promise<any> {
    return rpcClient.getMetrics()
  }

  // Marketplace actions
  async function getMarketplace(url: string): Promise<any> {
    return rpcClient.getMarketplace(url)
  }

  async function sideloadPackage(manifest: any, icon: string): Promise<string> {
    return rpcClient.sideloadPackage(manifest, icon)
  }

  return {
    // State
    data,
    isAuthenticated,
    isConnected,
    isLoading,
    error,

    // Computed
    serverInfo,
    packages,
    uiData,
    serverName,
    isRestarting,
    isShuttingDown,
    isOffline,

    // Actions
    login,
    logout,
    checkSession,
    connectWebSocket,
    installPackage,
    uninstallPackage,
    startPackage,
    stopPackage,
    restartPackage,
    updateServer,
    restartServer,
    shutdownServer,
    getMetrics,
    getMarketplace,
    sideloadPackage,
  }
})

