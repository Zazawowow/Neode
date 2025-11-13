<template>
  <div class="marketplace-container">
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
          :disabled="installing === app.id"
          class="w-full px-4 py-2 gradient-button rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {{ installing === app.id ? 'Installing...' : 'Install' }}
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
  if (!store.data || !store.data['package-data']) {
    return {}
  }
  return store.data['package-data']
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
    console.log(`Installing ${app.title} from ${app.s9pkUrl}...`)
    
    await rpcClient.call({
      method: 'package.install',
      params: {
        id: app.id,
        url: app.s9pkUrl,
        version: app.version
      }
    })
    
    console.log(`${app.title} installed successfully!`)
    
    // Navigate to apps page after short delay
    setTimeout(() => {
      router.push('/dashboard/apps')
    }, 1500)
    
  } catch (err) {
    console.error('Installation failed:', err)
    alert(`Failed to install ${app.title}: ${err}`)
  } finally {
    installing.value = null
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
