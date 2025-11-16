<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">My Apps</h1>
      <p class="text-white/70">Manage your installed applications</p>
    </div>

    <!-- Empty State -->
    <div v-if="Object.keys(packages).length === 0" class="text-center py-16">
      <div class="glass-card p-12 max-w-md mx-auto">
        <svg class="w-16 h-16 mx-auto text-white/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 class="text-xl font-semibold text-white mb-2">No Apps Installed</h3>
        <p class="text-white/70 mb-6">Get started by browsing the app store</p>
        <RouterLink
          to="/dashboard/marketplace"
          class="inline-block glass-button px-6 py-3 rounded-lg font-medium transition-all hover:bg-black/70 hover:border-white/30"
        >
          Browse App Store
        </RouterLink>
      </div>
    </div>

    <!-- Apps Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="(pkg, id) in packages"
        :key="id"
        class="glass-card p-6 transition-all hover:-translate-y-1 cursor-pointer relative"
        @click="goToApp(id as string)"
      >
        <!-- Uninstall Icon -->
        <button
          @click.stop="showUninstallModal(id as string, pkg)"
          class="absolute top-4 right-4 p-2 rounded-lg text-white/60 hover:text-red-400 hover:bg-red-500/20 transition-colors z-10"
          title="Uninstall"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        <div class="flex items-start gap-4">
          <img
            :src="pkg['static-files'].icon"
            :alt="pkg.manifest.title"
            class="w-16 h-16 rounded-lg"
          />
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-semibold text-white mb-1 truncate">
              {{ pkg.manifest.title }}
            </h3>
            <p class="text-sm text-white/70 mb-2 truncate">
              {{ pkg.manifest.description.short }}
            </p>
            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                :class="getStatusClass(pkg.state)"
              >
                {{ pkg.state }}
              </span>
              <span class="text-xs text-white/50">
                v{{ pkg.manifest.version }}
              </span>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mt-4 flex gap-2">
          <button
            v-if="canLaunch(pkg)"
            @click.stop="launchApp(id as string, pkg)"
            class="flex-1 px-4 py-2 gradient-button rounded-lg text-sm font-medium"
          >
            Launch
          </button>
          <button
            v-if="pkg.state === 'stopped'"
            @click.stop="startApp(id as string)"
            class="flex-1 px-4 py-2 bg-green-500/20 border border-green-500/40 rounded-lg text-green-200 text-sm font-medium hover:bg-green-500/30 transition-colors"
          >
            Start
          </button>
          <button
            v-if="pkg.state === 'running'"
            @click.stop="stopApp(id as string)"
            class="flex-1 px-4 py-2 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-yellow-200 text-sm font-medium hover:bg-yellow-500/30 transition-colors"
          >
            Stop
          </button>
        </div>
      </div>
    </div>

    <!-- Uninstall Confirmation Modal -->
    <Transition name="modal">
      <div
        v-if="uninstallModal.show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click="uninstallModal.show = false"
      >
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div
          @click.stop
          class="glass-card p-6 max-w-md w-full relative z-10"
        >
          <div class="flex items-start gap-4 mb-4">
            <div class="p-3 bg-red-500/20 rounded-lg">
              <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-xl font-semibold text-white mb-2">Uninstall App?</h3>
              <p class="text-white/70">
                Are you sure you want to uninstall <span class="text-white font-medium">{{ uninstallModal.appTitle }}</span>?
                This will remove the app and stop its container.
              </p>
            </div>
          </div>

          <div class="flex gap-3 justify-end">
            <button
              @click="uninstallModal.show = false"
              class="px-4 py-2 glass-button rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
            <button
              @click="confirmUninstall"
              class="px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Uninstall
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAppStore } from '../stores/app'
import { PackageState } from '../types/api'

const router = useRouter()
const store = useAppStore()

const packages = computed(() => store.packages)

const uninstallModal = ref({
  show: false,
  appId: '',
  appTitle: ''
})

function canLaunch(pkg: any): boolean {
  const hasUI = pkg.manifest.interfaces?.main?.ui
  const isRunning = pkg.state === 'running'
  return hasUI && isRunning
}

function launchApp(id: string, pkg: any) {
  const isDev = import.meta.env.DEV
  
  // Special handling for apps with Docker containers
  const appUrls: Record<string, { dev: string, prod: string }> = {
    'atob': {
      dev: 'http://localhost:8102',
      prod: 'https://app.atobitcoin.io'
    },
    'k484': {
      dev: 'http://localhost:8103',
      prod: 'http://localhost:8103' // Self-hosted splash screen
    }
  }
  
  if (appUrls[id]) {
    const url = isDev ? appUrls[id].dev : appUrls[id].prod
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  
  // For other apps, navigate to app details which has launch functionality
  router.push(`/dashboard/apps/${id}`)
}

function getStatusClass(state: PackageState): string {
  switch (state) {
    case PackageState.Running:
      return 'bg-green-500/20 text-green-200'
    case PackageState.Stopped:
      return 'bg-gray-500/20 text-gray-200'
    case PackageState.Starting:
    case PackageState.Stopping:
    case PackageState.Restarting:
      return 'bg-yellow-500/20 text-yellow-200'
    case PackageState.Installing:
      return 'bg-blue-500/20 text-blue-200'
    default:
      return 'bg-gray-500/20 text-gray-200'
  }
}

function goToApp(id: string) {
  router.push(`/dashboard/apps/${id}`)
}

async function startApp(id: string) {
  try {
    await store.startPackage(id)
  } catch (err) {
    console.error('Failed to start app:', err)
  }
}

async function stopApp(id: string) {
  try {
    await store.stopPackage(id)
  } catch (err) {
    console.error('Failed to stop app:', err)
  }
}

async function restartApp(id: string) {
  try {
    await store.restartPackage(id)
  } catch (err) {
    console.error('Failed to restart app:', err)
  }
}

function showUninstallModal(id: string, pkg: any) {
  uninstallModal.value = {
    show: true,
    appId: id,
    appTitle: pkg.manifest.title
  }
}

async function confirmUninstall() {
  const { appId } = uninstallModal.value
  uninstallModal.value.show = false
  
  try {
    await store.uninstallPackage(appId)
  } catch (err) {
    console.error('Failed to uninstall app:', err)
    alert('Failed to uninstall app')
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .glass-card,
.modal-leave-active .glass-card {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .glass-card,
.modal-leave-to .glass-card {
  transform: scale(0.95);
  opacity: 0;
}
</style>
