// Main application store using Pinia

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DataModel } from '../types/api'
import { wsClient, applyDataPatch } from '../api/websocket'
import { rpcClient } from '../api/rpc-client'

export const useAppStore = defineStore('app', () => {
  // State
  const data = ref<DataModel | null>(null)
  const isAuthenticated = ref(false)
  const isConnected = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

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
      isConnected.value = false
      data.value = null
      wsClient.disconnect()
    }
  }

  async function connectWebSocket(): Promise<void> {
    try {
      await wsClient.connect()
      isConnected.value = true

      // Subscribe to updates
      wsClient.subscribe((update) => {
        if (data.value) {
          data.value = applyDataPatch(data.value, update.patch)
        }
      })
    } catch (err) {
      console.error('WebSocket connection failed:', err)
      isConnected.value = false
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

