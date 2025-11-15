<template>
  <div class="marketplace-container">
    <!-- Installation Progress Banner -->
    <div v-if="installing" class="mb-6 glass-card p-4 border-l-4 border-blue-500">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <svg class="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div>
            <p class="text-white font-medium">Installing {{ installing }}...</p>
            <p class="text-white/70 text-sm">Checking for Docker image and starting container</p>
          </div>
        </div>
        <div class="text-white/60 text-sm">
          {{ installAttempt }}/{{ maxAttempts }}s
        </div>
      </div>
    </div>

    <div class="mb-8 flex items-start justify-between">
      <div>
        <h1 class="text-4xl font-bold text-white mb-2">Marketplace</h1>
        <p class="text-white/70">Discover and install apps for your Neode server</p>
      </div>
      
      <!-- Sideload Button -->
      <button
        @click="showSideloadModal = true"
        class="px-6 py-3 gradient-button rounded-lg font-medium flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Sideload
      </button>
    </div>

    <!-- Tabs -->
    <div class="mb-6 glass-card p-2 inline-flex rounded-lg">
      <button
        @click="activeTab = 'local'"
        :class="[
          'px-6 py-2 rounded-lg font-medium transition-all',
          activeTab === 'local'
            ? 'bg-white/20 text-white'
            : 'text-white/60 hover:text-white/80'
        ]"
      >
        Local Apps
      </button>
      <button
        @click="activeTab = 'community'"
        :class="[
          'px-6 py-2 rounded-lg font-medium transition-all',
          activeTab === 'community'
            ? 'bg-white/20 text-white'
            : 'text-white/60 hover:text-white/80'
        ]"
      >
        Community Marketplace
      </button>
    </div>

    <!-- Local Apps Tab -->
    <div v-if="activeTab === 'local'">
      <!-- Available Apps -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="app in availableApps"
          :key="app.id"
          class="glass-card p-6 hover:bg-white/10 transition-all cursor-pointer flex flex-col"
          @click="viewApp(app)"
        >
          <div class="flex items-start gap-4 mb-4">
            <img
              :src="app.icon"
              :alt="app.title"
              class="w-16 h-16 rounded-lg object-cover"
              @error="handleImageError"
            />
            <div class="flex-1">
              <h3 class="text-xl font-semibold text-white mb-1">{{ app.title }}</h3>
              <p class="text-sm text-white/60">v{{ app.version }}</p>
            </div>
          </div>
          
          <p class="text-white/80 text-sm mb-4 flex-1">{{ app.description.short }}</p>
          
          <button
            v-if="isInstalled(app.id)"
            disabled
            class="w-full px-4 py-2 bg-white/20 rounded-lg text-white/60 text-sm font-medium cursor-not-allowed mt-auto"
          >
            Already Installed
          </button>
          <button
            v-else
            @click.stop="installApp(app)"
            :disabled="installing === app.id || installing !== null"
            class="w-full px-4 py-2 gradient-button rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
          >
            <span v-if="installing === app.id" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Installing...
            </span>
            <span v-else>Install</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Community Marketplace Tab -->
    <div v-if="activeTab === 'community'">
      <!-- Loading State -->
      <div v-if="loadingCommunity" class="flex items-center justify-center py-12">
        <div class="text-center">
          <svg class="animate-spin h-12 w-12 text-blue-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-white/70">Loading Start9 Community Marketplace...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="communityError" class="glass-card p-8 border-l-4 border-red-500">
        <p class="text-red-400 font-medium mb-2">Failed to load marketplace</p>
        <p class="text-white/70 text-sm mb-4">{{ communityError }}</p>
        <button
          @click="loadCommunityMarketplace"
          class="px-4 py-2 gradient-button rounded-lg text-sm font-medium"
        >
          Retry
        </button>
      </div>

      <!-- Community Apps Grid -->
      <div v-else>
        <!-- Info Banner (showing curated/GitHub list) -->
        <div class="mb-6 glass-card p-4 border-l-4 border-blue-500">
          <p class="text-white/80 text-sm">
            <span class="font-medium">📚 Community Apps:</span> Showing {{communityApps.length}} Start9 ecosystem applications. 
            Visit GitHub repos to find latest .s9pk releases for installation.
          </p>
        </div>

        <!-- Search Bar -->
        <div class="mb-6">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search community apps..."
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
          />
        </div>

        <!-- Apps Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="app in filteredCommunityApps"
            :key="app.id"
            class="glass-card p-6 hover:bg-white/10 transition-all cursor-pointer flex flex-col"
          >
            <div class="flex items-start gap-4 mb-4">
              <img
                :src="app.icon || '/assets/img/logo-neode.png'"
                :alt="app.title"
                class="w-16 h-16 rounded-lg object-cover"
                @error="handleImageError"
              />
              <div class="flex-1">
                <h3 class="text-xl font-semibold text-white mb-1">{{ app.title }}</h3>
                <p class="text-sm text-white/60">v{{ app.version }}</p>
                <p v-if="app.author" class="text-xs text-white/50 mt-1">by {{ app.author }}</p>
              </div>
            </div>
            
            <p class="text-white/80 text-sm mb-4 line-clamp-3 flex-1">{{ app.description || 'No description available' }}</p>
            
            <div class="flex gap-2 mt-auto">
              <button
                v-if="isInstalled(app.id)"
                disabled
                class="flex-1 px-4 py-2 bg-white/20 rounded-lg text-white/60 text-sm font-medium cursor-not-allowed"
              >
                Already Installed
              </button>
              <button
                v-else-if="app.manifestUrl"
                @click.stop="installCommunityApp(app)"
                :disabled="installing === app.id || installing !== null"
                class="flex-1 px-4 py-2 gradient-button rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="installing === app.id" class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Installing...
                </span>
                <span v-else>Install</span>
              </button>
              <button
                v-else
                disabled
                class="flex-1 px-4 py-2 bg-white/10 rounded-lg text-white/40 text-sm font-medium cursor-not-allowed"
              >
                Not Available
              </button>
              <a
                v-if="app.repoUrl"
                :href="app.repoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-all"
                @click.stop
              >
                GitHub
              </a>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredCommunityApps.length === 0" class="text-center py-12">
          <p class="text-white/70">No apps found matching "{{ searchQuery }}"</p>
        </div>
      </div>
    </div>

    <!-- Sideload Modal -->
    <Transition name="modal">
      <div
        v-if="showSideloadModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="showSideloadModal = false"
      >
        <div class="glass-card p-8 max-w-2xl w-full relative">
          <!-- Close Button -->
          <button
            @click="showSideloadModal = false"
            class="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2 class="text-2xl font-bold text-white mb-2">Sideload Package</h2>
          <p class="text-white/70 mb-6">Install a package from an s9pk file URL or local path</p>
          
          <div class="flex flex-col gap-4">
            <input
              v-model="sideloadUrl"
              type="text"
              placeholder="https://example.com/package.s9pk or /packages/package.s9pk"
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
              @keyup.enter="sideloadPackage"
            />
            <button
              @click="sideloadPackage"
              :disabled="!sideloadUrl || sideloading"
              class="px-8 py-3 gradient-button rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg v-if="sideloading" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ sideloading ? 'Installing...' : 'Install Package' }}
            </button>
          </div>
          
          <p v-if="sideloadError" class="mt-4 text-red-400 text-sm">{{ sideloadError }}</p>
          <p v-if="sideloadSuccess" class="mt-4 text-green-400 text-sm">{{ sideloadSuccess }}</p>

          <!-- Examples -->
          <div class="mt-6 p-4 bg-white/5 rounded-lg">
            <p class="text-white/80 text-sm font-medium mb-2">Examples:</p>
            <ul class="text-white/60 text-sm space-y-1">
              <li>• <code class="text-blue-400">https://github.com/.../releases/download/v1.0.0/app.s9pk</code></li>
              <li>• <code class="text-blue-400">/packages/myapp.s9pk</code> (local file)</li>
            </ul>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { rpcClient } from '@/api/rpc-client'

const router = useRouter()
const store = useAppStore()

// Tab state
const activeTab = ref<'local' | 'community'>('local')

// Local apps state
const installing = ref<string | null>(null)
const installAttempt = ref(0)
const maxAttempts = ref(30)

// Sideload modal state
const showSideloadModal = ref(false)
const sideloadUrl = ref('')
const sideloading = ref(false)
const sideloadError = ref('')
const sideloadSuccess = ref('')

// Community marketplace state
const loadingCommunity = ref(false)
const communityError = ref('')
const communityApps = ref<any[]>([])
const searchQuery = ref('')

// Available apps in marketplace
const availableApps = ref([
  {
    id: 'atob',
    title: 'A to B Bitcoin',
    version: '0.1.0',
    icon: '/assets/img/atob.png',
    description: {
      short: 'Bitcoin tools and services for seamless transactions',
      long: 'A to B Bitcoin provides tools and services for Bitcoin transactions. Access the A to B platform through your Neode server with full privacy and control.'
    },
    s9pkUrl: '/packages/atob.s9pk'
  },
  {
    id: 'k484',
    title: 'K484',
    version: '0.1.0',
    icon: '/assets/img/k484.png',
    description: {
      short: 'Point of Sale and Admin system for Neode',
      long: 'K484 provides a complete POS and administration system for your Neode server. Choose between POS mode for transactions or Admin mode for management.'
    },
    s9pkUrl: '/packages/k484.s9pk'
  }
])

const installedPackages = computed(() => {
  return store.data?.['package-data'] || {}
})

// Filtered community apps based on search
const filteredCommunityApps = computed(() => {
  if (!searchQuery.value) return communityApps.value
  
  const query = searchQuery.value.toLowerCase()
  return communityApps.value.filter(app => 
    app.title.toLowerCase().includes(query) ||
    app.description?.toLowerCase().includes(query) ||
    app.id.toLowerCase().includes(query) ||
    app.author?.toLowerCase().includes(query)
  )
})

function isInstalled(appId: string): boolean {
  return appId in installedPackages.value
}

// Load community marketplace when tab is switched
watch(activeTab, (newTab) => {
  if (newTab === 'community' && communityApps.value.length === 0 && !loadingCommunity.value) {
    loadCommunityMarketplace()
  }
})

// Load community marketplace from Start9 registry
async function loadCommunityMarketplace() {
  loadingCommunity.value = true
  communityError.value = ''
  
  try {
    // Try fetching from Start9 community registry
    const response = await fetch('https://registry.start9.com/api/v1/packages', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Transform the data to our format
    communityApps.value = Object.entries(data).map(([id, pkg]: [string, any]) => {
      const latestVersion = pkg.versions ? Object.keys(pkg.versions).sort().reverse()[0] : '0.0.0'
      const versionData = pkg.versions?.[latestVersion] || {}
      
      return {
        id,
        title: pkg.title || id,
        version: latestVersion,
        description: versionData.description || pkg.description || '',
        icon: versionData.icon || pkg.icon || null,
        author: pkg.author || versionData.author || null,
        manifestUrl: versionData.manifest || null,
        repoUrl: pkg.repository || versionData.repository || null,
      }
    })
    
    console.log(`✅ Loaded ${communityApps.value.length} apps from Start9 registry`)
  } catch (err: any) {
    console.warn('Could not connect to Start9 registry, loading comprehensive app list from GitHub:', err.message)
    
    // Try fetching from Start9Labs GitHub organization
    try {
      const githubResponse = await fetch('https://api.github.com/users/Start9Labs/repos?per_page=100&sort=updated')
      
      if (githubResponse.ok) {
        const repos = await githubResponse.json()
        
        // Filter for -startos packages and create app list with download URLs
        const startOsPackages = repos
          .filter((repo: any) => repo.name.includes('-startos') && !repo.archived)
          .map((repo: any) => {
            const appId = repo.name.replace('-startos', '').replace('_', '-')
            const appTitle = appId.split('-').map((word: string) => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')
            
            // Construct the .s9pk download URL from GitHub releases
            const downloadUrl = `https://github.com/Start9Labs/${repo.name}/releases/latest/download/${appId}.s9pk`
            
            return {
              id: appId,
              title: appTitle,
              version: 'latest',
              description: repo.description || `${appTitle} for StartOS`,
              icon: null,
              author: 'Start9',
              manifestUrl: downloadUrl,
              repoUrl: repo.html_url
            }
          })
        
        if (startOsPackages.length > 0) {
          communityApps.value = startOsPackages
          console.log(`✅ Loaded ${startOsPackages.length} Start9 packages from GitHub`)
          loadingCommunity.value = false
          return
        }
      }
    } catch (githubErr) {
      console.warn('GitHub API also unavailable, using curated list')
    }
    
    // Ultimate fallback to comprehensive curated list with real download URLs
    communityApps.value = [
      {
        id: 'bitcoin',
        title: 'Bitcoin Core',
        version: '27.0.0',
        description: 'Run a full Bitcoin node. Validate and relay blocks and transactions on the Bitcoin network. Store, validate, and relay blocks and transactions.',
        icon: '/assets/img/bitcoin.svg',
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/bitcoind-startos/releases/latest/download/bitcoind.s9pk',
        repoUrl: 'https://github.com/Start9Labs/bitcoind-startos'
      },
      {
        id: 'cln',
        title: 'Core Lightning',
        version: '24.02.2',
        description: 'Lightning Network daemon for fast, cheap Bitcoin payments. A specification-compliant Lightning Network implementation.',
        icon: '/assets/img/c-lightning.png',
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/cln-startos/releases/latest/download/cln.s9pk',
        repoUrl: 'https://github.com/Start9Labs/cln-startos'
      },
      {
        id: 'lnd',
        title: 'LND',
        version: '0.17.0',
        description: 'Lightning Network Daemon by Lightning Labs. Alternative Lightning implementation with strong ecosystem support.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/lnd-startos/releases/latest/download/lnd.s9pk',
        repoUrl: 'https://github.com/Start9Labs/lnd-startos'
      },
      {
        id: 'btcpay',
        title: 'BTCPay Server',
        version: '1.13.1',
        description: 'Self-hosted Bitcoin payment processor. Accept Bitcoin payments without intermediaries or fees. Full merchant solution.',
        icon: '/assets/img/btcpay.png',
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/btcpayserver-startos/releases/latest/download/btcpay.s9pk',
        repoUrl: 'https://github.com/Start9Labs/btcpayserver-startos'
      },
      {
        id: 'nextcloud',
        title: 'Nextcloud',
        version: '29.0.0',
        description: 'Self-hosted file sync and sharing platform. Your own private cloud storage with calendar, contacts, and office suite.',
        icon: '/assets/img/nextcloud.png',
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/nextcloud-startos/releases/latest/download/nextcloud.s9pk',
        repoUrl: 'https://github.com/Start9Labs/nextcloud-startos'
      },
      {
        id: 'synapse',
        title: 'Synapse (Matrix)',
        version: '1.96.0',
        description: 'Matrix homeserver for decentralized, encrypted communication. Host your own private messaging server.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/synapse-startos/releases/latest/download/synapse.s9pk',
        repoUrl: 'https://github.com/Start9Labs/synapse-startos'
      },
      {
        id: 'nostr-rs-relay',
        title: 'Nostr Relay',
        version: '0.8.0',
        description: 'High-performance Nostr relay written in Rust. Host your own decentralized social media relay.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/nostr-rs-relay-startos/releases/latest/download/nostr-rs-relay.s9pk',
        repoUrl: 'https://github.com/Start9Labs/nostr-rs-relay-startos'
      },
      {
        id: 'bitcoinknots',
        title: 'Bitcoin Knots',
        version: '27.0',
        description: 'Bitcoin Knots full node - a derivative of Bitcoin Core with additional features and enhancements.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/bitcoinknots-startos/releases/latest/download/bitcoinknots.s9pk',
        repoUrl: 'https://github.com/Start9Labs/bitcoinknots-startos'
      },
      {
        id: 'electrs',
        title: 'Electrs',
        version: '0.10.0',
        description: 'Efficient Electrum Server implementation in Rust. Index Bitcoin blockchain for lightweight wallets.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/electrs-startos/releases/latest/download/electrs.s9pk',
        repoUrl: 'https://github.com/Start9Labs/electrs-startos'
      },
      {
        id: 'cups-messenger',
        title: 'CUPS Messenger',
        version: '2.0.0',
        description: 'Private messaging over the Bitcoin Lightning Network. Censorship-resistant, encrypted communication.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/cups-messenger-startos/releases/latest/download/cups.s9pk',
        repoUrl: 'https://github.com/Start9Labs/cups-messenger-startos'
      },
      {
        id: 'ride-the-lightning',
        title: 'Ride The Lightning',
        version: '0.14.0',
        description: 'Web UI for managing Lightning Network nodes (LND and CLN). Beautiful interface for node management.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/ride-the-lightning-startos/releases/latest/download/ride-the-lightning.s9pk',
        repoUrl: 'https://github.com/Start9Labs/ride-the-lightning-startos'
      },
      {
        id: 'thunderhub',
        title: 'ThunderHub',
        version: '0.13.0',
        description: 'Lightning Network node management interface. Monitor channels, make payments, and manage your LND node.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/thunderhub-startos/releases/latest/download/thunderhub.s9pk',
        repoUrl: 'https://github.com/Start9Labs/thunderhub-startos'
      },
      {
        id: 'specter-desktop',
        title: 'Specter Desktop',
        version: '2.0.0',
        description: 'Multi-signature Bitcoin wallet interface. Advanced wallet management with hardware wallet support.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/specter-desktop-startos/releases/latest/download/specter-desktop.s9pk',
        repoUrl: 'https://github.com/Start9Labs/specter-desktop-startos'
      },
      {
        id: 'mempool',
        title: 'Mempool Explorer',
        version: '2.5.0',
        description: 'Self-hosted Bitcoin blockchain and mempool visualizer. Beautiful explorer for your node.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/mempool-startos/releases/latest/download/mempool.s9pk',
        repoUrl: 'https://github.com/Start9Labs/mempool-startos'
      },
      {
        id: 'vaultwarden',
        title: 'Vaultwarden',
        version: '1.30.0',
        description: 'Self-hosted password manager (Bitwarden-compatible). Secure vault for all your passwords and secrets.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/vaultwarden-startos/releases/latest/download/vaultwarden.s9pk',
        repoUrl: 'https://github.com/Start9Labs/vaultwarden-startos'
      },
      {
        id: 'jellyfin',
        title: 'Jellyfin',
        version: '10.8.0',
        description: 'Free media server system. Stream your movies, music, and photos to any device.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/jellyfin-startos/releases/latest/download/jellyfin.s9pk',
        repoUrl: 'https://github.com/Start9Labs/jellyfin-startos'
      },
      {
        id: 'photoprism',
        title: 'PhotoPrism',
        version: '231128',
        description: 'AI-powered photo management. Organize and browse your photo collection with facial recognition.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/photoprism-startos/releases/latest/download/photoprism.s9pk',
        repoUrl: 'https://github.com/Start9Labs/photoprism-startos'
      },
      {
        id: 'immich',
        title: 'Immich',
        version: '1.90.0',
        description: 'High-performance self-hosted photo and video backup solution. Mobile-first with ML features.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/immich-startos/releases/latest/download/immich.s9pk',
        repoUrl: 'https://github.com/Start9Labs/immich-startos'
      },
      {
        id: 'filebrowser',
        title: 'File Browser',
        version: '2.27.0',
        description: 'Web-based file manager. Browse, upload, and manage files on your server through a web interface.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/filebrowser-startos/releases/latest/download/filebrowser.s9pk',
        repoUrl: 'https://github.com/Start9Labs/filebrowser-startos'
      },
      {
        id: 'home-assistant',
        title: 'Home Assistant',
        version: '2023.12.0',
        description: 'Open-source home automation platform. Control and automate your smart home devices privately.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/home-assistant-startos/releases/latest/download/home-assistant.s9pk',
        repoUrl: 'https://github.com/Start9Labs/home-assistant-startos'
      }
    ]
    console.log(`📚 Using curated list of ${communityApps.value.length} popular Start9 packages`)
  } finally {
    loadingCommunity.value = false
  }
}

function viewApp(app: any) {
  // Could navigate to app details page
  console.log('View app:', app)
}

async function installApp(app: any) {
  if (installing.value || isInstalled(app.id)) return

  installing.value = app.id
  
  try {
    await rpcClient.call({
      method: 'package.install',
      params: {
        id: app.id,
        url: app.s9pkUrl,
        version: app.version
      }
    })
    
    // Wait for installation to complete (poll for package to appear)
    installAttempt.value = 0
    
    const checkInstalled = setInterval(() => {
      installAttempt.value++
      
      if (isInstalled(app.id)) {
        clearInterval(checkInstalled)
        installing.value = null
        installAttempt.value = 0
        setTimeout(() => {
          router.push('/dashboard/apps')
        }, 500)
      } else if (installAttempt.value >= maxAttempts.value) {
        clearInterval(checkInstalled)
        installing.value = null
        installAttempt.value = 0
        alert('Installation timeout. Please check the backend logs or try refreshing the page.')
      }
    }, 1000)
    
  } catch (err) {
    console.error('Installation failed:', err)
    alert(`Failed to install ${app.title}: ${err}`)
    installing.value = null
    installAttempt.value = 0
  }
}

async function installCommunityApp(app: any) {
  if (installing.value || isInstalled(app.id) || !app.manifestUrl) return

  installing.value = app.id
  
  try {
    console.log(`Installing community app ${app.title} from ${app.manifestUrl}`)
    
    await rpcClient.call({
      method: 'package.install',
      params: {
        id: app.id,
        url: app.manifestUrl,
        version: app.version
      }
    })
    
    // Wait for installation to complete (poll for package to appear)
    installAttempt.value = 0
    
    const checkInstalled = setInterval(() => {
      installAttempt.value++
      
      if (isInstalled(app.id)) {
        clearInterval(checkInstalled)
        installing.value = null
        installAttempt.value = 0
        setTimeout(() => {
          router.push('/dashboard/apps')
        }, 500)
      } else if (installAttempt.value >= maxAttempts.value) {
        clearInterval(checkInstalled)
        installing.value = null
        installAttempt.value = 0
        alert('Installation timeout. Please check the backend logs or try refreshing the page.')
      }
    }, 1000)
    
  } catch (err) {
    console.error('Installation failed:', err)
    alert(`Failed to install ${app.title}: ${err}`)
    installing.value = null
    installAttempt.value = 0
  }
}

async function sideloadPackage() {
  if (!sideloadUrl.value || sideloading.value) return
  
  sideloading.value = true
  sideloadError.value = ''
  sideloadSuccess.value = ''
  
  try {
    console.log(`Sideloading package from ${sideloadUrl.value}...`)
    
    await rpcClient.call({
      method: 'package.sideload',
      params: {
        url: sideloadUrl.value
      }
    })
    
    sideloadSuccess.value = 'Package installed successfully!'
    sideloadUrl.value = ''
    
    // Close modal and navigate to apps page after short delay
    setTimeout(() => {
      showSideloadModal.value = false
      router.push('/dashboard/apps')
    }, 1500)
    
  } catch (err: any) {
    console.error('Sideload failed:', err)
    sideloadError.value = err.message || 'Failed to install package'
  } finally {
    sideloading.value = false
  }
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.src = '/assets/img/logo-neode.png'
}
</script>

<style scoped>
.marketplace-container {
  max-width: 1400px;
  margin: 0 auto;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Modal transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .glass-card,
.modal-leave-active .glass-card {
  transition: transform 0.3s ease;
}

.modal-enter-from .glass-card {
  transform: scale(0.95);
}

.modal-leave-to .glass-card {
  transform: scale(0.95);
}
</style>
