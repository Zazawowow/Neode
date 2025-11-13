<template>
  <div>
    <button @click="goBack" class="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to Apps
    </button>

    <div v-if="pkg" class="glass-card p-12 text-center">
      <img
        :src="pkg['static-files'].icon"
        :alt="pkg.manifest.title"
        class="w-24 h-24 rounded-lg mx-auto mb-4"
      />
      <h1 class="text-3xl font-bold text-white mb-2">{{ pkg.manifest.title }}</h1>
      <p class="text-white/70 mb-4">{{ pkg.manifest.description.long }}</p>
      <span
        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-6"
        :class="getStatusClass(pkg.state)"
      >
        {{ pkg.state }}
      </span>

      <!-- Launch Button -->
      <div v-if="canLaunch" class="mt-6">
        <button
          @click="launchApp"
          class="gradient-button px-8 py-3 rounded-lg text-lg font-semibold"
        >
          Launch {{ pkg.manifest.title }}
        </button>
      </div>

      <!-- Action Buttons -->
      <div class="mt-6 flex gap-3 justify-center">
        <button
          v-if="pkg.state === 'stopped'"
          @click="startApp"
          class="px-6 py-2 bg-green-500/20 border border-green-500/40 rounded-lg text-green-200 font-medium hover:bg-green-500/30 transition-colors"
        >
          Start
        </button>
        <button
          v-if="pkg.state === 'running'"
          @click="stopApp"
          class="px-6 py-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200 font-medium hover:bg-red-500/30 transition-colors"
        >
          Stop
        </button>
        <button
          @click="restartApp"
          class="px-6 py-2 glass-button rounded-lg font-medium hover:bg-black/70 transition-colors"
        >
          Restart
        </button>
        <button
          @click="uninstallApp"
          class="px-6 py-2 bg-red-600/20 border border-red-600/40 rounded-lg text-red-300 font-medium hover:bg-red-600/30 transition-colors"
        >
          Uninstall
        </button>
      </div>
    </div>

    <div v-else class="glass-card p-12 text-center">
      <h3 class="text-xl font-semibold text-white mb-2">App Not Found</h3>
      <p class="text-white/70">The requested application could not be found</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'
import { PackageState } from '../types/api'

const router = useRouter()
const route = useRoute()
const store = useAppStore()

const appId = computed(() => route.params.id as string)
const pkg = computed(() => store.packages[appId.value])

// Check if app has a UI interface and is running
const canLaunch = computed(() => {
  if (!pkg.value) return false
  const hasUI = pkg.value.manifest.interfaces?.main?.ui
  const isRunning = pkg.value.state === 'running'
  return hasUI && isRunning
})

function goBack() {
  router.back()
}

function launchApp() {
  if (!pkg.value) return
  
  // Special handling for ATOB - opens local Docker container
  if (appId.value === 'atob') {
    // Use the Docker container running on port 8102
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    const atobUrl = `${protocol}//${hostname}:8102`
    window.open(atobUrl, '_blank', 'noopener,noreferrer')
    return
  }
  
  // For other apps, construct the launch URL
  // In a real deployment, this would use the Tor or LAN address from interfaces
  const torAddress = pkg.value.manifest.interfaces?.main?.['tor-config']
  const lanConfig = pkg.value.manifest.interfaces?.main?.['lan-config']
  
  if (torAddress || lanConfig) {
    // In development, just alert - in production would open the actual interface
    alert(`Would launch ${pkg.value.manifest.title} interface`)
  }
}

async function startApp() {
  try {
    await store.startPackage(appId.value)
  } catch (err) {
    console.error('Failed to start app:', err)
  }
}

async function stopApp() {
  try {
    await store.stopPackage(appId.value)
  } catch (err) {
    console.error('Failed to stop app:', err)
  }
}

async function restartApp() {
  try {
    await store.restartPackage(appId.value)
  } catch (err) {
    console.error('Failed to restart app:', err)
  }
}

async function uninstallApp() {
  if (!confirm(`Are you sure you want to uninstall ${pkg.value?.manifest.title}?`)) {
    return
  }
  
  try {
    await store.uninstallPackage(appId.value)
    // Navigate back to apps after uninstall
    router.push('/dashboard/apps')
  } catch (err) {
    console.error('Failed to uninstall app:', err)
    alert('Failed to uninstall app')
  }
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
</script>

