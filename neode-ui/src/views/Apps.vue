<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Apps</h1>
      <p class="text-white/70">Manage your installed applications</p>
    </div>

    <!-- Empty State -->
    <div v-if="Object.keys(packages).length === 0" class="text-center py-16">
      <div class="glass-card p-12 max-w-md mx-auto">
        <svg class="w-16 h-16 mx-auto text-white/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 class="text-xl font-semibold text-white mb-2">No Apps Installed</h3>
        <p class="text-white/70 mb-6">Get started by browsing the marketplace</p>
        <RouterLink
          to="/dashboard/marketplace"
          class="inline-block glass-button px-6 py-3 rounded-lg font-medium transition-all hover:bg-black/70 hover:border-white/30"
        >
          Browse Marketplace
        </RouterLink>
      </div>
    </div>

    <!-- Apps Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="(pkg, id) in packages"
        :key="id"
        class="glass-card p-6 transition-all hover:-translate-y-1 cursor-pointer"
        @click="goToApp(id as string)"
      >
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
            v-if="pkg.state === 'stopped'"
            @click.stop="startApp(id as string)"
            class="flex-1 px-4 py-2 bg-green-500/20 border border-green-500/40 rounded-lg text-green-200 text-sm font-medium hover:bg-green-500/30 transition-colors"
          >
            Start
          </button>
          <button
            v-if="pkg.state === 'running'"
            @click.stop="stopApp(id as string)"
            class="flex-1 px-4 py-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200 text-sm font-medium hover:bg-red-500/30 transition-colors"
          >
            Stop
          </button>
          <button
            @click.stop="restartApp(id as string)"
            class="flex-1 px-4 py-2 glass-button rounded-lg text-sm font-medium hover:bg-black/70 transition-colors"
          >
            Restart
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAppStore } from '../stores/app'
import { PackageState } from '../types/api'

const router = useRouter()
const store = useAppStore()

const packages = computed(() => store.packages)

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
</script>

