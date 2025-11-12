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
        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
        :class="getStatusClass(pkg.state)"
      >
        {{ pkg.state }}
      </span>
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

function goBack() {
  router.back()
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

