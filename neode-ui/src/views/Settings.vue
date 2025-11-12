<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">Settings</h1>
      <p class="text-white/80">Configure your Neode experience</p>
    </div>

    <!-- Account Section -->
    <div class="path-option-card cursor-default px-6 py-6 mb-6">
      <h2 class="text-xl font-semibold text-white/96 mb-6">Account</h2>
      
      <!-- Info Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <!-- Server Name Card -->
        <div class="bg-black/20 rounded-xl px-5 py-4 border border-white/10">
          <div class="flex items-center gap-3 mb-2">
            <svg class="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            <p class="text-xs font-semibold text-white/60 uppercase tracking-wide">Server Name</p>
          </div>
          <p class="text-lg font-semibold text-white/95">{{ serverName }}</p>
        </div>

        <!-- Version Card -->
        <div class="bg-black/20 rounded-xl px-5 py-4 border border-white/10">
          <div class="flex items-center gap-3 mb-2">
            <svg class="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <p class="text-xs font-semibold text-white/60 uppercase tracking-wide">Version</p>
          </div>
          <p class="text-lg font-semibold text-white/95">{{ version }}</p>
        </div>

        <!-- Session Card -->
        <div class="bg-black/20 rounded-xl px-5 py-4 border border-white/10 md:col-span-2">
          <div class="flex items-center gap-3 mb-2">
            <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-xs font-semibold text-white/60 uppercase tracking-wide">Session Status</p>
          </div>
          <p class="text-base font-medium text-white/90">Currently logged in</p>
        </div>
      </div>

      <!-- Logout Button -->
      <button
        @click="handleLogout"
        class="w-full path-action-button path-action-button--continue flex items-center justify-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span>Logout</span>
      </button>
    </div>

    <!-- System Section -->
    <div class="path-option-card cursor-default px-6 py-6">
      <h2 class="text-xl font-semibold text-white/96 mb-4">System</h2>
      <div class="text-center py-8">
        <svg class="w-12 h-12 mx-auto text-white/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p class="text-white/70">Additional settings coming soon</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const router = useRouter()
const store = useAppStore()

const serverName = computed(() => store.serverName)
const version = computed(() => store.serverInfo?.version || '0.0.0')

async function handleLogout() {
  await store.logout()
  router.push('/login')
}
</script>