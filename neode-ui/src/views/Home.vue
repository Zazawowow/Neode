<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">Welcome back!</h1>
      <p class="text-white/80">Here's an overview of your server</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <!-- Server Status -->
      <div class="path-option-card cursor-default px-6 py-6">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-semibold text-white/80 uppercase tracking-wide">Status</h3>
          <svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
        </div>
        <p class="text-2xl font-bold text-white/96">Online</p>
      </div>

      <!-- App Count -->
      <div class="path-option-card cursor-default px-6 py-6">
        <h3 class="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">Installed Apps</h3>
        <p class="text-2xl font-bold text-white/96">{{ appCount }}</p>
      </div>

      <!-- Running Apps -->
      <div class="path-option-card cursor-default px-6 py-6">
        <h3 class="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">Running</h3>
        <p class="text-2xl font-bold text-white/96">{{ runningCount }}</p>
      </div>

      <!-- Version -->
      <div class="path-option-card cursor-default px-6 py-6">
        <h3 class="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">Version</h3>
        <p class="text-2xl font-bold text-white/96">{{ version }}</p>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="path-option-card cursor-default px-6 py-6">
      <h2 class="text-xl font-semibold text-white/96 mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RouterLink
          to="/dashboard/marketplace"
          class="path-action-button path-action-button--continue flex items-center justify-center gap-3"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span>Browse Marketplace</span>
        </RouterLink>
        
        <RouterLink
          to="/dashboard/apps"
          class="path-action-button path-action-button--continue flex items-center justify-center gap-3"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span>Manage Apps</span>
        </RouterLink>
        
        <RouterLink
          to="/dashboard/server"
          class="path-action-button path-action-button--continue flex items-center justify-center gap-3"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
          <span>Server Settings</span>
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

