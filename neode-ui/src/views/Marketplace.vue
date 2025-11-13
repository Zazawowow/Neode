<template>
  <div>
    <div class="mb-8 flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-white mb-2">Marketplace</h1>
        <p class="text-white/70">Discover and install new applications</p>
      </div>
      <button 
        @click="showSideloadModal = true"
        class="glass-button px-6 py-3 rounded-lg flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Sideload Package
      </button>
    </div>

    <!-- Marketplace Tabs -->
    <div class="glass-card p-2 mb-6 flex gap-2">
      <button
        v-for="marketplace in marketplaces"
        :key="marketplace.url"
        @click="selectedMarketplace = marketplace.url"
        :class="[
          'px-6 py-3 rounded-lg transition-all',
          selectedMarketplace === marketplace.url
            ? 'bg-white/20 text-white'
            : 'text-white/70 hover:text-white hover:bg-white/10'
        ]"
      >
        {{ marketplace.name }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="glass-card p-12 text-center">
      <div class="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-white/70">Loading marketplace...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="glass-card p-12 text-center">
      <svg class="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="text-xl font-semibold text-white mb-2">Error Loading Marketplace</h3>
      <p class="text-white/70 mb-4">{{ error }}</p>
      <button @click="loadMarketplace" class="glass-button px-6 py-3 rounded-lg">
        Try Again
      </button>
    </div>

    <!-- Apps Grid -->
    <div v-else-if="apps.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="app in apps"
        :key="app.id"
        class="glass-card p-6 hover:bg-white/10 transition-all cursor-pointer"
        @click="selectedApp = app"
      >
        <img
          v-if="app.icon"
          :src="app.icon"
          :alt="app.title"
          class="w-16 h-16 rounded-xl mb-4 object-cover"
        />
        <h3 class="text-xl font-semibold text-white mb-2">{{ app.title }}</h3>
        <p class="text-white/70 text-sm mb-4 line-clamp-2">{{ app.description }}</p>
        <div class="flex items-center justify-between">
          <span class="text-white/60 text-sm">v{{ app.version }}</span>
          <button
            @click.stop="installApp(app)"
            class="gradient-button px-4 py-2 rounded-lg text-sm"
          >
            Install
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="glass-card p-12 text-center">
      <svg class="w-16 h-16 mx-auto text-white/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      <h3 class="text-xl font-semibold text-white mb-2">No Apps Available</h3>
      <p class="text-white/70">Check back later or try a different marketplace</p>
    </div>

    <!-- Sideload Modal -->
    <Transition name="fade">
      <div
        v-if="showSideloadModal"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showSideloadModal = false"
      >
        <div class="glass-card p-8 max-w-lg w-full">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-white">Sideload Package</h2>
            <button
              @click="showSideloadModal = false"
              class="text-white/70 hover:text-white transition"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="mb-6">
            <label class="block text-white mb-2">Upload .s9pk file</label>
            <input
              type="file"
              accept=".s9pk"
              @change="handleFileSelect"
              class="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20 transition"
            />
          </div>

          <div v-if="sideloadError" class="mb-4 p-4 rounded-lg bg-red-500/20 border border-red-500/50">
            <p class="text-red-200 text-sm">{{ sideloadError }}</p>
          </div>

          <div v-if="sideloading" class="text-center py-4">
            <div class="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-white/70">Uploading package...</p>
          </div>
        </div>
      </div>
    </Transition>

    <!-- App Detail Modal -->
    <Transition name="fade">
      <div
        v-if="selectedApp"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="selectedApp = null"
      >
        <div class="glass-card p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div class="flex justify-between items-start mb-6">
            <div class="flex items-start gap-4">
              <img
                v-if="selectedApp.icon"
                :src="selectedApp.icon"
                :alt="selectedApp.title"
                class="w-20 h-20 rounded-xl object-cover"
              />
              <div>
                <h2 class="text-2xl font-bold text-white mb-1">{{ selectedApp.title }}</h2>
                <p class="text-white/60">v{{ selectedApp.version }}</p>
              </div>
            </div>
            <button
              @click="selectedApp = null"
              class="text-white/70 hover:text-white transition"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p class="text-white/80 mb-6">{{ selectedApp.description }}</p>

          <button
            @click="installApp(selectedApp)"
            class="gradient-button w-full py-3 rounded-lg"
          >
            Install {{ selectedApp.title }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()

// Default StartOS marketplace
const DEFAULT_MARKETPLACE = 'https://registry.start9.com'

const marketplaces = ref([
  { name: 'Start9 Registry', url: DEFAULT_MARKETPLACE },
  { name: 'Community Registry', url: 'https://community-registry.start9.com' },
])

const selectedMarketplace = ref(DEFAULT_MARKETPLACE)
const loading = ref(false)
const error = ref<string | null>(null)
const apps = ref<any[]>([])
const selectedApp = ref<any | null>(null)
const showSideloadModal = ref(false)
const sideloading = ref(false)
const sideloadError = ref<string | null>(null)

async function loadMarketplace() {
  loading.value = true
  error.value = null
  apps.value = []

  try {
    // Check if authenticated
    if (!store.isAuthenticated) {
      error.value = 'Please login first to access the marketplace'
      loading.value = false
      return
    }

    const data = await store.getMarketplace(selectedMarketplace.value)
    
    // Parse marketplace data - format may vary
    if (Array.isArray(data)) {
      apps.value = data
    } else if (data && typeof data === 'object') {
      // Handle different marketplace response formats
      apps.value = data.packages || data.apps || []
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load marketplace'
    
    // Check for specific error types
    if (errorMessage.includes('Method not found')) {
      error.value = 'Backend marketplace API not available. Ensure Neode backend is running and up to date.'
    } else if (errorMessage.includes('authenticated') || errorMessage.includes('401')) {
      error.value = 'Authentication required. Please login first.'
    } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
      error.value = 'Cannot connect to backend. Ensure Neode backend is running on port 5959.'
    } else {
      error.value = errorMessage
    }
    
    console.error('Marketplace error:', err)
  } finally {
    loading.value = false
  }
}

async function installApp(app: any) {
  try {
    const jobId = await store.installPackage(
      app.id,
      selectedMarketplace.value,
      app.version
    )
    console.log('Installation started:', jobId)
    selectedApp.value = null
    // TODO: Show installation progress
  } catch (err) {
    console.error('Installation error:', err)
    alert(`Failed to install ${app.title}: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }
}

async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (!file) return
  
  sideloading.value = true
  sideloadError.value = null

  try {
    // Read file and convert to base64 for upload
    const arrayBuffer = await file.arrayBuffer()
    const blob = new Blob([arrayBuffer])
    
    // TODO: Parse s9pk to extract manifest and icon
    // For now, this is a placeholder - actual implementation needs s9pk parsing
    alert('S9pk sideloading requires additional parsing. Use backend CLI: startos package.sideload')
    
  } catch (err) {
    sideloadError.value = err instanceof Error ? err.message : 'Upload failed'
  } finally {
    sideloading.value = false
  }
}

watch(selectedMarketplace, () => {
  loadMarketplace()
})

onMounted(() => {
  loadMarketplace()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

