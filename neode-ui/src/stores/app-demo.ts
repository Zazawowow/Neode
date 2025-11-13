// Demo App Store - No backend required, all mocked locally
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // State
  const isAuthenticated = ref(false)
  const serverName = ref('Neode Demo Server')
  const isOffline = ref(false)
  const isRestarting = ref(false)
  const isShuttingDown = ref(false)
  
  const serverInfo = ref({
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
  })

  // Mock packages
  const packages = ref([
    {
      id: 'bitcoin',
      title: 'Bitcoin Core',
      version: '24.0.0',
      status: 'running',
      icon: '/assets/img/bitcoin.png',
    },
    {
      id: 'lightning',
      title: 'Lightning Network',
      version: '0.15.0',
      status: 'stopped',
      icon: '/assets/img/lightning.png',
    },
  ])

  // Computed
  const displayName = computed(() => serverName.value)

  // Actions
  async function login(password: string) {
    // Demo mode - accept any password
    console.log('Demo mode: Logging in with any password')
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Always succeed
    isAuthenticated.value = true
    localStorage.setItem('neode-demo-auth', 'true')
    
    return Promise.resolve()
  }

  async function logout() {
    console.log('Demo mode: Logging out')
    isAuthenticated.value = false
    localStorage.removeItem('neode-demo-auth')
    return Promise.resolve()
  }

  async function checkAuth() {
    // Check if already authenticated in demo mode
    const demoAuth = localStorage.getItem('neode-demo-auth')
    if (demoAuth === 'true') {
      isAuthenticated.value = true
    }
  }

  async function installPackage(id: string, marketplaceUrl: string, version: string) {
    console.log('Demo mode: Install package', { id, marketplaceUrl, version })
    await new Promise(resolve => setTimeout(resolve, 1000))
    return 'installing'
  }

  async function uninstallPackage(id: string) {
    console.log('Demo mode: Uninstall package', id)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  async function startPackage(id: string) {
    console.log('Demo mode: Start package', id)
    const pkg = packages.value.find(p => p.id === id)
    if (pkg) pkg.status = 'running'
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  async function stopPackage(id: string) {
    console.log('Demo mode: Stop package', id)
    const pkg = packages.value.find(p => p.id === id)
    if (pkg) pkg.status = 'stopped'
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  async function restartPackage(id: string) {
    console.log('Demo mode: Restart package', id)
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  async function updateServer(marketplaceUrl: string) {
    console.log('Demo mode: Update server', marketplaceUrl)
    await new Promise(resolve => setTimeout(resolve, 1000))
    return 'no-updates'
  }

  async function restartServer() {
    console.log('Demo mode: Restart server')
    isRestarting.value = true
    await new Promise(resolve => setTimeout(resolve, 2000))
    isRestarting.value = false
  }

  async function shutdownServer() {
    console.log('Demo mode: Shutdown server')
    isShuttingDown.value = true
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  async function getMetrics() {
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: {
        rx: Math.random() * 1000,
        tx: Math.random() * 1000,
      },
    }
  }

  return {
    // State
    isAuthenticated,
    serverName,
    serverInfo,
    isOffline,
    isRestarting,
    isShuttingDown,
    packages,
    
    // Computed
    displayName,
    
    // Actions
    login,
    logout,
    checkAuth,
    installPackage,
    uninstallPackage,
    startPackage,
    stopPackage,
    restartPackage,
    updateServer,
    restartServer,
    shutdownServer,
    getMetrics,
  }
})

