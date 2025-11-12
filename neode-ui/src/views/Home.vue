<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Welcome back!</h1>
      <p class="text-white/70">Here's an overview of your server</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <!-- Server Status -->
      <div class="glass-card p-6">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium text-white/70">Status</h3>
          <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <p class="text-2xl font-bold text-white">Online</p>
      </div>

      <!-- App Count -->
      <div class="glass-card p-6">
        <h3 class="text-sm font-medium text-white/70 mb-2">Installed Apps</h3>
        <p class="text-2xl font-bold text-white">{{ appCount }}</p>
      </div>

      <!-- Running Apps -->
      <div class="glass-card p-6">
        <h3 class="text-sm font-medium text-white/70 mb-2">Running</h3>
        <p class="text-2xl font-bold text-white">{{ runningCount }}</p>
      </div>

      <!-- Version -->
      <div class="glass-card p-6">
        <h3 class="text-sm font-medium text-white/70 mb-2">Version</h3>
        <p class="text-2xl font-bold text-white">{{ version }}</p>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="glass-card p-6">
      <h2 class="text-xl font-semibold text-white mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RouterLink
          to="/dashboard/marketplace"
          class="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-3"
        >
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span class="text-white font-medium">Browse Marketplace</span>
        </RouterLink>
        
        <RouterLink
          to="/dashboard/apps"
          class="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-3"
        >
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span class="text-white font-medium">Manage Apps</span>
        </RouterLink>
        
        <RouterLink
          to="/dashboard/server"
          class="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-3"
        >
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
          <span class="text-white font-medium">Server Settings</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAppStore } from '../stores/app'
import { PackageState } from '../types/api'

const store = useAppStore()

const version = computed(() => store.serverInfo?.version || '0.0.0')
const packages = computed(() => store.packages)
const appCount = computed(() => Object.keys(packages.value).length)
const runningCount = computed(() => 
  Object.values(packages.value).filter(pkg => pkg.state === PackageState.Running).length
)
</script>

