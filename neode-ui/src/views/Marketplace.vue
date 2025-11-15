<template>
  <div class="marketplace-container flex flex-col h-full overflow-hidden">
    <!-- Fixed Header Section -->
    <div class="flex-shrink-0">
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

      <div class="mb-8 flex items-start justify-between">
        <div>
      <h1 class="text-4xl font-bold text-white mb-2">Marketplace</h1>
          <p class="text-white/70">Discover and install apps for your new sovereign life</p>
        </div>

        <!-- Sideload Button -->
        <button
          @click="showSideloadModal = true"
          class="px-6 py-3 gradient-button rounded-lg font-medium flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Sideload
        </button>
      </div>

      <!-- Category Tabs (Desktop only) -->
      <div class="hidden md:flex mb-6 glass-card p-2 rounded-lg flex-wrap gap-2">
        <button
          v-for="category in categories"
          :key="category.id"
          @click="selectedCategory = category.id"
          :class="[
            'px-6 py-2 rounded-lg font-medium transition-all',
            selectedCategory === category.id
              ? 'bg-white/20 text-white'
              : 'text-white/60 hover:text-white/80'
          ]"
        >
          {{ category.name }}
        </button>
      </div>

      <!-- Current Category Badge (Mobile only) -->
      <div class="md:hidden mb-6 glass-card p-4 rounded-lg flex items-center justify-between">
        <div>
          <p class="text-white/60 text-xs mb-1">Viewing Category</p>
          <p class="text-white font-semibold">{{ categories.find(c => c.id === selectedCategory)?.name }}</p>
        </div>
        <button
          @click="showFilterModal = true"
          class="px-4 py-2 gradient-button rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter
        </button>
      </div>

      <!-- Search Bar -->
      <div class="mb-6">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search apps..."
          class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 transition-colors"
        />
      </div>
    </div>

    <!-- Scrollable Apps Section -->
    <div class="flex-1 overflow-y-auto pr-2 -mr-2 pb-0 md:pb-6">
      <!-- Apps Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
          v-for="app in filteredApps"
        :key="app.id"
          class="glass-card p-6 hover:bg-white/10 transition-all cursor-pointer flex flex-col"
          @click="viewAppDetails(app)"
      >
        <div class="flex items-start gap-4 mb-4">
        <img
              v-if="app.icon"
          :src="app.icon"
          :alt="app.title"
            class="w-16 h-16 rounded-lg object-cover"
            @error="handleImageError"
          />
            <div v-else class="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
              <svg class="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          <div class="flex-1">
            <h3 class="text-xl font-semibold text-white mb-1">{{ app.title }}</h3>
              <p class="text-sm text-white/60">{{ app.version ? `v${app.version}` : 'latest' }}</p>
              <p v-if="app.author" class="text-xs text-white/50 mt-1">by {{ app.author }}</p>
          </div>
        </div>
        
          <p class="text-white/80 text-sm mb-4 line-clamp-3 flex-1">
            {{ typeof app.description === 'object' ? app.description.short : (app.description || 'No description available') }}
          </p>
        
          <div class="flex gap-2 mt-auto">
        <button
          v-if="isInstalled(app.id)"
          disabled
              class="flex-1 px-4 py-2 bg-white/20 rounded-lg text-white/60 text-sm font-medium cursor-not-allowed"
        >
          Already Installed
        </button>
            <button
              v-else-if="app.source === 'local' || app.manifestUrl"
              @click.stop="app.source === 'local' ? installApp(app) : installCommunityApp(app)"
          :disabled="installing === app.id || installing !== null"
              class="flex-1 px-4 py-2 gradient-button rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
            <button
              v-else
              disabled
              class="flex-1 px-4 py-2 bg-white/10 rounded-lg text-white/40 text-sm font-medium cursor-not-allowed"
            >
              Not Available
            </button>
            <a
              v-if="app.repoUrl"
              :href="app.repoUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-all"
              @click.stop
            >
              GitHub
            </a>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredApps.length === 0" class="text-center py-12">
        <div v-if="loadingCommunity" class="flex flex-col items-center gap-4">
          <svg class="animate-spin h-12 w-12 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-white/70">Loading community apps...</p>
        </div>
        <p v-else class="text-white/70">No apps found in {{ categories.find(c => c.id === selectedCategory)?.name }}{{ searchQuery ? ` matching "${searchQuery}"` : '' }}</p>
      </div>
          </div>
    <!-- End Scrollable Apps Section -->

    <!-- Sideload Modal -->
    <Transition name="modal">
      <div
        v-if="showSideloadModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="showSideloadModal = false"
      >
        <div class="glass-card p-8 max-w-2xl w-full relative">
          <!-- Close Button -->
          <button
            @click="showSideloadModal = false"
            class="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2 class="text-2xl font-bold text-white mb-2">Sideload Package</h2>
          <p class="text-white/70 mb-6">Install a package from an s9pk file URL or local path</p>
          
          <div class="flex flex-col gap-4">
          <input
            v-model="sideloadUrl"
            type="text"
            placeholder="https://example.com/package.s9pk or /packages/package.s9pk"
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40"
              @keyup.enter="sideloadPackage"
          />
          <button
            @click="sideloadPackage"
            :disabled="!sideloadUrl || sideloading"
              class="px-8 py-3 gradient-button rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg v-if="sideloading" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ sideloading ? 'Installing...' : 'Install Package' }}
          </button>
        </div>
        
          <p v-if="sideloadError" class="mt-4 text-red-400 text-sm">{{ sideloadError }}</p>
          <p v-if="sideloadSuccess" class="mt-4 text-green-400 text-sm">{{ sideloadSuccess }}</p>

          <!-- Examples -->
          <div class="mt-6 p-4 bg-white/5 rounded-lg">
            <p class="text-white/80 text-sm font-medium mb-2">Examples:</p>
            <ul class="text-white/60 text-sm space-y-1">
              <li>• <code class="text-blue-400">https://github.com/.../releases/download/v1.0.0/app.s9pk</code></li>
              <li>• <code class="text-blue-400">/packages/myapp.s9pk</code> (local file)</li>
            </ul>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Filter Modal (Mobile only) -->
    <Transition name="modal">
      <div
        v-if="showFilterModal"
        class="fixed inset-0 z-50 flex items-end justify-center md:hidden bg-black/60 backdrop-blur-sm"
        @click.self="showFilterModal = false"
      >
        <div class="glass-card p-6 w-full rounded-t-3xl max-h-[80vh] overflow-y-auto">
          <!-- Header -->
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-white">Filter by Category</h2>
            <button
              @click="showFilterModal = false"
              class="text-white/60 hover:text-white transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Category Grid -->
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="category in categories"
              :key="category.id"
              @click="selectedCategory = category.id; showFilterModal = false"
              :class="[
                'p-4 rounded-xl font-medium transition-all text-left',
                selectedCategory === category.id
                  ? 'bg-white/20 text-white border-2 border-white/40'
                  : 'glass-card text-white/80 hover:bg-white/10'
              ]"
            >
              <div class="flex items-center gap-3">
                <!-- Category Icon -->
                <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg v-if="category.id === 'community'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <svg v-else-if="category.id === 'commerce'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <svg v-else-if="category.id === 'money'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <svg v-else-if="category.id === 'data'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                  <svg v-else-if="category.id === 'home'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <svg v-else-if="category.id === 'car'" class="w-6 h-6" viewBox="0 0 122.88 122.88" fill="currentColor">
                    <path d="M61.44,0c33.93,0,61.44,27.51,61.44,61.44c0,33.93-27.51,61.44-61.44,61.44S0,95.37,0,61.44 C0,27.51,27.51,0,61.44,0L61.44,0z M61.17,61.6c1.76,0,3.18,1.42,3.18,3.18c0,1.76-1.42,3.18-3.18,3.18 c-1.76,0-3.18-1.42-3.18-3.18C57.99,63.03,59.42,61.6,61.17,61.6L61.17,61.6z M61.2,53.28c6.34,0,11.47,5.14,11.47,11.47 c0,6.34-5.14,11.47-11.47,11.47c-6.33,0-11.47-5.14-11.47-11.47C49.73,58.41,54.87,53.28,61.2,53.28L61.2,53.28z M14.78,44.57 c4.45-12.31,13.52-22.7,24.9-28.01c15.63-7.29,34.61-7.75,50.69,4.15c9.48,7.01,12.94,12.76,17.67,22.95 c3.58,9.03,0.64,11.97-10.87,6.9c-23.79-11.77-47.84-11.24-72.12,0C16.09,56.41,11.06,51.53,14.78,44.57L14.78,44.57z M75.9,109.05 c16.62-5.23,26.32-15.81,32.27-29.3c3.87-10.43-8.26-13.97-12.52-7.1c-2.55,5.06-5.59,9.4-9.55,12.77 c-6.2,5.27-15.18,6.23-16.58,16.16C68.79,106.74,69.97,111.38,75.9,109.05L75.9,109.05z M47.26,109.05 c-16.62-5.23-26.32-15.81-32.27-29.3c-3.87-10.43,8.26-13.97,12.52-7.1c2.55,5.06,5.59,9.4,9.55,12.77 c6.2,5.27,15.18,6.23,16.58,16.16C54.37,106.74,53.19,111.38,47.26,109.05L47.26,109.05z"/>
                  </svg>
                  <svg v-else-if="category.id === 'networking'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <p class="font-semibold">{{ category.name }}</p>
                  <p v-if="selectedCategory === category.id" class="text-xs text-white/60 mt-1">Currently viewing</p>
                </div>
                <svg v-if="selectedCategory === category.id" class="w-5 h-5 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
            </button>
          </div>
      </div>
    </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { rpcClient } from '@/api/rpc-client'
import { useMarketplaceApp } from '@/composables/useMarketplaceApp'

const router = useRouter()
const store = useAppStore()
const { setCurrentApp } = useMarketplaceApp()

// Category state
const selectedCategory = ref('community')

const categories = [
  { id: 'community', name: 'Community' },
  { id: 'commerce', name: 'Commerce' },
  { id: 'money', name: 'Money' },
  { id: 'data', name: 'Data' },
  { id: 'home', name: 'Home' },
  { id: 'car', name: 'Auto' },
  { id: 'networking', name: 'Networking' },
  { id: 'other', name: 'Other' }
]

// Local apps state
const installing = ref<string | null>(null)
const installAttempt = ref(0)
const maxAttempts = ref(30)

// Sideload modal state
const showSideloadModal = ref(false)
const sideloadUrl = ref('')
const sideloading = ref(false)
const sideloadError = ref('')
const sideloadSuccess = ref('')

// Filter modal state (for mobile)
const showFilterModal = ref(false)

// Community marketplace state
const loadingCommunity = ref(false)
const communityError = ref('')
const communityApps = ref<any[]>([])
const searchQuery = ref('')

// Available apps in marketplace
const availableApps = ref([
  {
    id: 'atob',
    title: 'A to B Bitcoin',
    version: '0.1.0',
    icon: '/assets/img/atob.png',
    category: 'community',
    description: {
      short: 'Bitcoin tools and services for seamless transactions',
      long: 'A to B Bitcoin provides tools and services for Bitcoin transactions. Access the A to B platform through your Neode server with full privacy and control.'
    },
    s9pkUrl: '/packages/atob.s9pk'
  },
  {
    id: 'k484',
    title: 'K484',
    version: '0.1.0',
    icon: '/assets/img/k484.png',
    category: 'commerce',
    description: {
      short: 'Point of Sale and Admin system for Neode',
      long: 'K484 provides a complete POS and administration system for your Neode server. Choose between POS mode for transactions or Admin mode for management.'
    },
    s9pkUrl: '/packages/k484.s9pk'
  },
  {
    id: 'btcpay',
    title: 'BTCPay Server',
    version: '0.1.0',
    icon: '/assets/img/btcpay.png',
    category: 'commerce',
    description: {
      short: 'Self-hosted Bitcoin payment processor',
      long: 'BTCPay Server is a free, open-source cryptocurrency payment processor. Accept Bitcoin payments without intermediaries or fees. Complete merchant solution with invoicing, point of sale, and more.'
    },
    s9pkUrl: '/packages/btcpay.s9pk'
  },
  {
    id: 'nextcloud',
    title: 'Nextcloud',
    version: '0.1.0',
    icon: '/assets/img/nextcloud.png',
    category: 'data',
    description: {
      short: 'Self-hosted file sync and collaboration platform',
      long: 'Nextcloud provides file storage, sync, and sharing with calendar, contacts, mail, and office suite integration. Your own private cloud with complete control over your data.'
    },
    s9pkUrl: '/packages/nextcloud.s9pk'
  },
  {
    id: 'home-assistant',
    title: 'Home Assistant',
    version: '0.1.0',
    icon: '/assets/img/home-assistant.png',
    category: 'home',
    description: {
      short: 'Open-source home automation platform',
      long: 'Home Assistant is a powerful home automation hub that allows you to control and automate your smart home devices privately. No cloud required - everything runs locally on your Neode server.'
    },
    s9pkUrl: '/packages/home-assistant.s9pk'
  }
])

const installedPackages = computed(() => {
  return store.data?.['package-data'] || {}
})

// Function to categorize community apps based on their ID and description
function categorizeCommunityApp(app: any): string {
  const id = app.id.toLowerCase()
  const title = app.title?.toLowerCase() || ''
  const description = app.description?.toLowerCase() || ''
  const combined = `${id} ${title} ${description}`
  
  // Money category
  if (id.includes('bitcoin') || id.includes('btc') || id.includes('lightning') || 
      id.includes('lnd') || id.includes('cln') || id.includes('electr') || 
      id.includes('fedimint') || id.includes('cashu') || title.includes('lightning') ||
      combined.includes('wallet') || combined.includes('satoshi')) {
    return 'money'
  }
  
  // Commerce category
  if (id.includes('btcpay') || id.includes('commerce') || id.includes('shop') || 
      id.includes('store') || id.includes('pos') || id.includes('payment') ||
      combined.includes('merchant') || combined.includes('invoice')) {
    return 'commerce'
  }
  
  // Data category
  if (id.includes('cloud') || id.includes('nextcloud') || id.includes('sync') || 
      id.includes('storage') || id.includes('backup') || id.includes('file') ||
      id.includes('photo') || id.includes('immich') || id.includes('jellyfin') ||
      id.includes('plex') || id.includes('media') || id.includes('vault') ||
      combined.includes('password manager') || combined.includes('file storage')) {
    return 'data'
  }
  
  // Home category
  if (id.includes('home-assistant') || id.includes('homeassistant') || 
      id.includes('smart-home') || id.includes('automation') || id.includes('iot') ||
      combined.includes('home automation') || combined.includes('smart home')) {
    return 'home'
  }
  
  // Networking category
  if (id.includes('vpn') || id.includes('wireguard') || id.includes('tailscale') ||
      id.includes('proxy') || id.includes('dns') || id.includes('pihole') ||
      id.includes('adguard') || id.includes('nginx') || id.includes('tor') ||
      combined.includes('network') || combined.includes('firewall')) {
    return 'networking'
  }
  
  // Community category
  if (id.includes('matrix') || id.includes('synapse') || id.includes('element') ||
      id.includes('nostr') || id.includes('mastodon') || id.includes('lemmy') ||
      id.includes('messenger') || id.includes('chat') || id.includes('social') ||
      id.includes('cups') || combined.includes('communication') ||
      combined.includes('messaging')) {
    return 'community'
  }
  
  // Default to other
  return 'other'
}

// Combine local and community apps with categories
const allApps = computed(() => {
  // Local apps already have categories - normalize field names
  const local = availableApps.value.map(app => ({ 
    ...app, 
    source: 'local',
    // Add manifestUrl and url for consistency with community apps
    manifestUrl: app.s9pkUrl || app.manifestUrl,
    url: app.s9pkUrl || app.url
  }))
  
  // Categorize community apps intelligently
  const community = communityApps.value.map(app => {
    const category = categorizeCommunityApp(app)
    return {
      ...app, 
      category,
      source: 'community'
    }
  })
  
  return [...local, ...community]
})

// Filtered apps by category and search
const filteredApps = computed(() => {
  let apps = allApps.value
  
  // Filter by category
  if (selectedCategory.value && selectedCategory.value !== 'all') {
    apps = apps.filter(app => app.category === selectedCategory.value)
  }
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    apps = apps.filter(app => 
      app.title?.toLowerCase().includes(query) ||
      app.description?.toLowerCase().includes(query) ||
      (typeof app.description === 'object' && app.description?.short?.toLowerCase().includes(query)) ||
      app.id?.toLowerCase().includes(query) ||
      app.author?.toLowerCase().includes(query)
    )
  }
  
  return apps
})

// Keep for backward compatibility
const filteredCommunityApps = computed(() => {
  return communityApps.value
})

function isInstalled(appId: string): boolean {
  return appId in installedPackages.value
}

// Load community marketplace on mount
onMounted(() => {
  if (communityApps.value.length === 0 && !loadingCommunity.value) {
    loadCommunityMarketplace()
  }
})

// Load community marketplace from Start9 registry
async function loadCommunityMarketplace() {
  loadingCommunity.value = true
  communityError.value = ''
  
  try {
    // Try fetching from Start9 community registry
    const response = await fetch('https://registry.start9.com/api/v1/packages', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Transform the data to our format
    communityApps.value = Object.entries(data).map(([id, pkg]: [string, any]) => {
      const latestVersion = pkg.versions ? Object.keys(pkg.versions).sort().reverse()[0] : '0.0.0'
      const versionData = pkg.versions?.[latestVersion] || {}
      
      return {
        id,
        title: pkg.title || id,
        version: latestVersion,
        description: versionData.description || pkg.description || '',
        icon: versionData.icon || pkg.icon || null,
        author: pkg.author || versionData.author || null,
        manifestUrl: versionData.manifest || null,
        repoUrl: pkg.repository || versionData.repository || null,
      }
    })
    
    console.log(`✅ Loaded ${communityApps.value.length} apps from Start9 registry`)
  } catch (err: any) {
    console.warn('Could not connect to Start9 registry, loading comprehensive app list from GitHub:', err.message)
    
    // Try fetching from Start9Labs GitHub organization
    try {
      const githubResponse = await fetch('https://api.github.com/users/Start9Labs/repos?per_page=100&sort=updated')
      
      if (githubResponse.ok) {
        const repos = await githubResponse.json()
        
        // Filter for -startos packages and create app list with download URLs
        const startOsPackages = repos
          .filter((repo: any) => repo.name.includes('-startos') && !repo.archived)
          .map((repo: any) => {
            const appId = repo.name.replace('-startos', '').replace('_', '-')
            const appTitle = appId.split('-').map((word: string) => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')
            
            // Construct the .s9pk download URL from GitHub releases
            const downloadUrl = `https://github.com/Start9Labs/${repo.name}/releases/latest/download/${appId}.s9pk`
            
            return {
              id: appId,
              title: appTitle,
              version: 'latest',
              description: repo.description || `${appTitle} for StartOS`,
              icon: null,
              author: 'Start9',
              manifestUrl: downloadUrl,
              repoUrl: repo.html_url
            }
          })
        
        if (startOsPackages.length > 0) {
          communityApps.value = startOsPackages
          console.log(`✅ Loaded ${startOsPackages.length} Start9 packages from GitHub`)
          loadingCommunity.value = false
          return
        }
      }
    } catch (githubErr) {
      console.warn('GitHub API also unavailable, using curated list')
    }
    
    // Ultimate fallback to comprehensive curated list with real download URLs
    communityApps.value = [
      {
        id: 'bitcoin',
        title: 'Bitcoin Core',
        version: '27.0.0',
        description: 'Run a full Bitcoin node. Validate and relay blocks and transactions on the Bitcoin network. Store, validate, and relay blocks and transactions.',
        icon: '/assets/img/bitcoin.svg',
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/bitcoind-startos/releases/latest/download/bitcoind.s9pk',
        repoUrl: 'https://github.com/Start9Labs/bitcoind-startos'
      },
      {
        id: 'cln',
        title: 'Core Lightning',
        version: '24.02.2',
        description: 'Lightning Network daemon for fast, cheap Bitcoin payments. A specification-compliant Lightning Network implementation.',
        icon: '/assets/img/c-lightning.png',
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/cln-startos/releases/latest/download/cln.s9pk',
        repoUrl: 'https://github.com/Start9Labs/cln-startos'
      },
      {
        id: 'lnd',
        title: 'LND',
        version: '0.17.0',
        description: 'Lightning Network Daemon by Lightning Labs. Alternative Lightning implementation with strong ecosystem support.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/lnd-startos/releases/latest/download/lnd.s9pk',
        repoUrl: 'https://github.com/Start9Labs/lnd-startos'
      },
      {
        id: 'btcpay',
        title: 'BTCPay Server',
        version: '1.13.1',
        description: 'Self-hosted Bitcoin payment processor. Accept Bitcoin payments without intermediaries or fees. Full merchant solution.',
        icon: '/assets/img/btcpay.png',
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/btcpayserver-startos/releases/latest/download/btcpay.s9pk',
        repoUrl: 'https://github.com/Start9Labs/btcpayserver-startos'
      },
      {
        id: 'nextcloud',
        title: 'Nextcloud',
        version: '29.0.0',
        description: 'Self-hosted file sync and sharing platform. Your own private cloud storage with calendar, contacts, and office suite.',
        icon: '/assets/img/nextcloud.png',
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/nextcloud-startos/releases/latest/download/nextcloud.s9pk',
        repoUrl: 'https://github.com/Start9Labs/nextcloud-startos'
      },
      {
        id: 'synapse',
        title: 'Synapse (Matrix)',
        version: '1.96.0',
        description: 'Matrix homeserver for decentralized, encrypted communication. Host your own private messaging server.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/synapse-startos/releases/latest/download/synapse.s9pk',
        repoUrl: 'https://github.com/Start9Labs/synapse-startos'
      },
      {
        id: 'nostr-rs-relay',
        title: 'Nostr Relay',
        version: '0.8.0',
        description: 'High-performance Nostr relay written in Rust. Host your own decentralized social media relay.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/nostr-rs-relay-startos/releases/latest/download/nostr-rs-relay.s9pk',
        repoUrl: 'https://github.com/Start9Labs/nostr-rs-relay-startos'
      },
      {
        id: 'bitcoinknots',
        title: 'Bitcoin Knots',
        version: '27.0',
        description: 'Bitcoin Knots full node - a derivative of Bitcoin Core with additional features and enhancements.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/bitcoinknots-startos/releases/latest/download/bitcoinknots.s9pk',
        repoUrl: 'https://github.com/Start9Labs/bitcoinknots-startos'
      },
      {
        id: 'electrs',
        title: 'Electrs',
        version: '0.10.0',
        description: 'Efficient Electrum Server implementation in Rust. Index Bitcoin blockchain for lightweight wallets.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/electrs-startos/releases/latest/download/electrs.s9pk',
        repoUrl: 'https://github.com/Start9Labs/electrs-startos'
      },
      {
        id: 'cups-messenger',
        title: 'CUPS Messenger',
        version: '2.0.0',
        description: 'Private messaging over the Bitcoin Lightning Network. Censorship-resistant, encrypted communication.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/cups-messenger-startos/releases/latest/download/cups.s9pk',
        repoUrl: 'https://github.com/Start9Labs/cups-messenger-startos'
      },
      {
        id: 'ride-the-lightning',
        title: 'Ride The Lightning',
        version: '0.14.0',
        description: 'Web UI for managing Lightning Network nodes (LND and CLN). Beautiful interface for node management.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/ride-the-lightning-startos/releases/latest/download/ride-the-lightning.s9pk',
        repoUrl: 'https://github.com/Start9Labs/ride-the-lightning-startos'
      },
      {
        id: 'thunderhub',
        title: 'ThunderHub',
        version: '0.13.0',
        description: 'Lightning Network node management interface. Monitor channels, make payments, and manage your LND node.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/thunderhub-startos/releases/latest/download/thunderhub.s9pk',
        repoUrl: 'https://github.com/Start9Labs/thunderhub-startos'
      },
      {
        id: 'specter-desktop',
        title: 'Specter Desktop',
        version: '2.0.0',
        description: 'Multi-signature Bitcoin wallet interface. Advanced wallet management with hardware wallet support.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/specter-desktop-startos/releases/latest/download/specter-desktop.s9pk',
        repoUrl: 'https://github.com/Start9Labs/specter-desktop-startos'
      },
      {
        id: 'mempool',
        title: 'Mempool Explorer',
        version: '2.5.0',
        description: 'Self-hosted Bitcoin blockchain and mempool visualizer. Beautiful explorer for your node.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/mempool-startos/releases/latest/download/mempool.s9pk',
        repoUrl: 'https://github.com/Start9Labs/mempool-startos'
      },
      {
        id: 'vaultwarden',
        title: 'Vaultwarden',
        version: '1.30.0',
        description: 'Self-hosted password manager (Bitwarden-compatible). Secure vault for all your passwords and secrets.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/vaultwarden-startos/releases/latest/download/vaultwarden.s9pk',
        repoUrl: 'https://github.com/Start9Labs/vaultwarden-startos'
      },
      {
        id: 'jellyfin',
        title: 'Jellyfin',
        version: '10.8.0',
        description: 'Free media server system. Stream your movies, music, and photos to any device.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/jellyfin-startos/releases/latest/download/jellyfin.s9pk',
        repoUrl: 'https://github.com/Start9Labs/jellyfin-startos'
      },
      {
        id: 'photoprism',
        title: 'PhotoPrism',
        version: '231128',
        description: 'AI-powered photo management. Organize and browse your photo collection with facial recognition.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/photoprism-startos/releases/latest/download/photoprism.s9pk',
        repoUrl: 'https://github.com/Start9Labs/photoprism-startos'
      },
      {
        id: 'immich',
        title: 'Immich',
        version: '1.90.0',
        description: 'High-performance self-hosted photo and video backup solution. Mobile-first with ML features.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/immich-startos/releases/latest/download/immich.s9pk',
        repoUrl: 'https://github.com/Start9Labs/immich-startos'
      },
      {
        id: 'filebrowser',
        title: 'File Browser',
        version: '2.27.0',
        description: 'Web-based file manager. Browse, upload, and manage files on your server through a web interface.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/filebrowser-startos/releases/latest/download/filebrowser.s9pk',
        repoUrl: 'https://github.com/Start9Labs/filebrowser-startos'
      },
      {
        id: 'home-assistant',
        title: 'Home Assistant',
        version: '2023.12.0',
        description: 'Open-source home automation platform. Control and automate your smart home devices privately.',
        icon: null,
        author: 'Start9',
        manifestUrl: 'https://github.com/Start9Labs/home-assistant-startos/releases/latest/download/home-assistant.s9pk',
        repoUrl: 'https://github.com/Start9Labs/home-assistant-startos'
      }
    ]
    console.log(`📚 Using curated list of ${communityApps.value.length} popular Start9 packages`)
  } finally {
    loadingCommunity.value = false
  }
}

function viewAppDetails(app: any) {
  console.log('[Marketplace] Navigating to app detail:', app)
  
  try {
    // If app is already installed, go directly to the installed app detail page
    if (isInstalled(app.id)) {
      console.log('[Marketplace] App is installed, navigating to app details page')
      router.push({
        name: 'app-details',
        params: { id: app.id }
      })
    } else {
      // Store app data in composable for marketplace detail view
      setCurrentApp(app)
      console.log('[Marketplace] App data stored in composable')
      
      // Navigate to marketplace detail page
      router.push({
        name: 'marketplace-app-detail',
        params: { id: app.id }
      })
    }
  } catch (e) {
    console.error('[Marketplace] Navigation error:', e)
  }
}

async function installApp(app: any) {
  if (installing.value || isInstalled(app.id)) return

  installing.value = app.id
  
  try {
    const installUrl = app.url || app.manifestUrl || app.s9pkUrl
    console.log('[Marketplace] Installing local app:', { id: app.id, url: installUrl, version: app.version })
    
    await rpcClient.call({
      method: 'package.install',
      params: {
        id: app.id,
        url: installUrl,
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

async function installCommunityApp(app: any) {
  if (installing.value || isInstalled(app.id) || !app.manifestUrl) return

  installing.value = app.id
  
  try {
    console.log(`Installing community app ${app.title} from ${app.manifestUrl}`)
    
    await rpcClient.call({
      method: 'package.install',
      params: {
        id: app.id,
        url: app.manifestUrl,
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
    
    // Close modal and navigate to apps page after short delay
    setTimeout(() => {
      showSideloadModal.value = false
      router.push('/dashboard/apps')
    }, 1500)
    
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
  max-width: 1400px;
  margin: 0 auto;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Modal transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .glass-card,
.modal-leave-active .glass-card {
  transition: transform 0.3s ease;
}

.modal-enter-from .glass-card {
  transform: scale(0.95);
}

.modal-leave-to .glass-card {
  transform: scale(0.95);
}

/* Custom scrollbar styling for apps section */
.marketplace-container ::-webkit-scrollbar {
  width: 8px;
}

.marketplace-container ::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.marketplace-container ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  transition: background 0.3s ease;
}

.marketplace-container ::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Firefox scrollbar */
.marketplace-container {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
}
</style>
