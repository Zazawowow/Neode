<template>
  <div class="min-h-screen flex">
    <!-- Sidebar -->
    <aside class="w-70 glass border-r border-glass-border shadow-glass-sm flex-shrink-0">
      <div class="p-6">
        <div class="flex items-center gap-3 mb-8">
          <div class="logo-gradient-border flex-shrink-0">
            <img src="/assets/img/logo-neode.png" alt="Neode" class="w-14 h-14" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-white">{{ serverName }}</h2>
            <p class="text-xs text-white/60">v{{ version }}</p>
          </div>
        </div>

        <nav class="space-y-2">
          <RouterLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            active-class="bg-white/15 text-white font-medium"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                v-for="(path, index) in getIconPath(item.icon)" 
                :key="index"
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                :d="path" 
              />
            </svg>
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>
      </div>

      <!-- User Section -->
      <div class="absolute bottom-0 left-0 right-0 p-6 border-t border-glass-border">
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto">
      <!-- Connection Status Banner -->
      <div v-if="isOffline" class="bg-yellow-500/20 border-b border-yellow-500/40 px-6 py-3 text-yellow-200">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span class="font-medium">
            {{ isRestarting ? 'Server is restarting...' : isShuttingDown ? 'Server is shutting down...' : 'Connection lost' }}
          </span>
        </div>
      </div>

      <div class="p-8">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const router = useRouter()
const store = useAppStore()

const serverName = computed(() => store.serverName)
const version = computed(() => store.serverInfo?.version || '0.0.0')
const isOffline = computed(() => store.isOffline)
const isRestarting = computed(() => store.isRestarting)
const isShuttingDown = computed(() => store.isShuttingDown)

const navItems = [
  {
    path: '/dashboard',
    label: 'Home',
    icon: 'home',
  },
  {
    path: '/dashboard/apps',
    label: 'Apps',
    icon: 'apps',
  },
  {
    path: '/dashboard/marketplace',
    label: 'Marketplace',
    icon: 'marketplace',
  },
  {
    path: '/dashboard/server',
    label: 'Server',
    icon: 'server',
  },
  {
    path: '/dashboard/settings',
    label: 'Settings',
    icon: 'settings',
  },
]

function getIconPath(iconName: string): string[] {
  const icons: Record<string, string[]> = {
    home: ['M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'],
    apps: ['M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'],
    marketplace: ['M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'],
    server: ['M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01'],
    settings: [
      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    ],
  }
  return icons[iconName] || []
}

async function handleLogout() {
  await store.logout()
  router.push('/login')
}
</script>

