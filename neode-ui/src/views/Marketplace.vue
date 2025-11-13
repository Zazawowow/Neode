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

    <div class="mb-8">
      <h1 class="text-4xl font-bold text-white mb-2">Marketplace</h1>
      <p class="text-white/70">Discover and install apps for your Neode server</p>
    </div>

    <!-- Available Apps -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="app in availableApps"
        :key="app.id"
        class="glass-card p-6 hover:bg-white/10 transition-all cursor-pointer"
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
        
        <p class="text-white/80 text-sm mb-4">{{ app.description.short }}</p>
        
        <button
          v-if="isInstalled(app.id)"
          disabled
          class="w-full px-4 py-2 bg-white/20 rounded-lg text-white/60 text-sm font-medium cursor-not-allowed"
        >
          Already Installed
        </button>
            <button
          v-else
          @click.stop="installApp(app)"
          :disabled="installing === app.id || installing !== null"
          class="w-full px-4 py-2 gradient-button rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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

    <!-- Sideload Section -->
    <div class="mt-12">
      <div class="glass-card p-8">
        <h2 class="text-2xl font-bold text-white mb-4">Sideload Package</h2>
        <p class="text-white/70 mb-6">Install a package from an s9pk file URL</p>
        
        <div class="flex gap-4">
          <input
            v-model="sideloadUrl"
            type="text"
            placeholder="https://example.com/package.s9pk or /packages/package.s9pk"
            class="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
          />
          <button
            @click="sideloadPackage"
            :disabled="!sideloadUrl || sideloading"
            class="px-8 py-3 gradient-button rounded-lg font-medium disabled:opacity-50"
          >
            {{ sideloading ? 'Installing...' : 'Install' }}
          </button>
        </div>
        
        <p v-if="sideloadError" class="mt-3 text-red-400 text-sm">{{ sideloadError }}</p>
        <p v-if="sideloadSuccess" class="mt-3 text-green-400 text-sm">{{ sideloadSuccess }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { rpcClient } from '@/api/rpc-client'

const router = useRouter()
const store = useAppStore()

const installing = ref<string | null>(null)
const installAttempt = ref(0)
const maxAttempts = ref(30)
const sideloadUrl = ref('')
const sideloading = ref(false)
const sideloadError = ref('')
const sideloadSuccess = ref('')

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
  }
])

const installedPackages = computed(() => {
  return store.data?.['package-data'] || {}
})

function isInstalled(appId: string): boolean {
  return appId in installedPackages.value
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
    
    // Navigate to apps page after short delay
    setTimeout(() => {
      router.push('/dashboard/apps')
    }, 2000)
    
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
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}
</style>
