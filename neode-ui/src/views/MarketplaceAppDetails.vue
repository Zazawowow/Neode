<template>
  <div class="app-details-container pb-16 md:pb-16">
    <!-- Desktop Back Button -->
    <button @click="goBack" class="hidden md:flex mb-6 items-center gap-2 text-white/70 hover:text-white transition-colors">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to App Store
    </button>

    <!-- Mobile Full-Width Back Button -->
    <button 
      @click="goBack"
      class="md:hidden fixed left-4 right-4 z-40 glass-button px-6 py-3 rounded-lg font-medium shadow-2xl flex items-center justify-center gap-2"
      :style="{
        bottom: 'calc(var(--mobile-tab-bar-height, 64px) + 16px)',
        filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.5))'
      }"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      <span>Back to App Store</span>
    </button>

    <!-- Loading State -->
    <div v-if="loading" class="glass-card p-12 text-center">
      <svg class="animate-spin h-12 w-12 text-blue-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="text-white/70">Loading app details...</p>
    </div>

    <!-- App Details -->
    <div v-else-if="app">
      <!-- Compact Hero Section -->
      <div class="glass-card p-6 mb-6">
        <!-- Desktop: Single Row Layout -->
        <div class="hidden md:flex items-center gap-6">
          <!-- App Icon -->
          <img
            v-if="app.icon"
            :src="app.icon"
            :alt="app.title"
            class="w-20 h-20 rounded-xl shadow-xl flex-shrink-0"
            @error="handleImageError"
          />
          <div v-else class="w-20 h-20 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <svg class="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          
          <!-- App Info (grows to fill space) -->
          <div class="flex-1 min-w-0">
            <h1 class="text-2xl font-bold text-white mb-1">{{ app.title }}</h1>
            <p class="text-white/70 text-sm mb-2">{{ shortDescription }}</p>
            <div class="flex items-center gap-2">
              <span
                v-if="isInstalled"
                class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-200 border border-green-500/30"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5"></span>
                Installed
              </span>
              <span class="text-white/50 text-xs">{{ app.version ? `v${app.version}` : 'latest' }}</span>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              v-if="isInstalled"
              @click="goToInstalledApp"
              class="gradient-button px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open
            </button>
            <button
              v-else
              @click="installApp"
              :disabled="installing || !app.manifestUrl"
              class="gradient-button px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="installing" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {{ installing ? 'Installing...' : 'Install' }}
            </button>
            <a
              v-if="app.repoUrl"
              :href="app.repoUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="px-4 py-2.5 glass-button rounded-lg text-sm font-medium hover:bg-white/15 transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.840 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Source
            </a>
          </div>
        </div>

        <!-- Mobile: Two Column Grid Layout -->
        <div class="md:hidden">
          <!-- Top: Icon + Info -->
          <div class="grid grid-cols-[80px_1fr] gap-4 mb-4">
            <!-- App Icon -->
            <img
              v-if="app.icon"
              :src="app.icon"
              :alt="app.title"
              class="w-20 h-20 rounded-xl shadow-xl"
              @error="handleImageError"
            />
            <div v-else class="w-20 h-20 rounded-xl bg-white/10 flex items-center justify-center">
              <svg class="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            
            <!-- App Info -->
            <div class="min-w-0">
              <h1 class="text-xl font-bold text-white mb-1">{{ app.title }}</h1>
              <p class="text-white/70 text-xs mb-2 line-clamp-2">{{ shortDescription }}</p>
              <div class="flex flex-wrap items-center gap-2">
                <span
                  v-if="isInstalled"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-200 border border-green-500/30"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-green-400 mr-1"></span>
                  Installed
                </span>
                <span class="text-white/50 text-xs">{{ app.version ? `v${app.version}` : 'latest' }}</span>
              </div>
            </div>
          </div>

          <!-- Bottom: Action Buttons -->
          <div class="grid grid-cols-2 gap-2">
            <button
              v-if="isInstalled"
              @click="goToInstalledApp"
              class="gradient-button px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open
            </button>
            <button
              v-else
              @click="installApp"
              :disabled="installing || !app.manifestUrl"
              class="gradient-button px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed col-span-2"
            >
              <svg v-if="installing" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {{ installing ? 'Installing...' : 'Install' }}
            </button>
            <a
              v-if="app.repoUrl"
              :href="app.repoUrl"
              target="_blank"
              rel="noopener noreferrer"
              :class="isInstalled ? 'col-span-1' : 'col-span-2'"
              class="px-4 py-2.5 glass-button rounded-lg text-sm font-medium hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.840 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Source
            </a>
          </div>

          <!-- Installation Error Banner (Mobile) -->
          <div v-if="installError" class="mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
            <div class="flex items-start gap-2">
              <svg class="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="flex-1">
                <p class="text-red-200 font-medium text-sm">Installation Failed</p>
                <p class="text-red-300 text-xs mt-1">{{ installError }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Installation Error Banner (Desktop) -->
        <div v-if="installError" class="hidden md:block mt-4 p-4 bg-red-500/20 border border-red-500/40 rounded-lg">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1">
              <p class="text-red-200 font-medium">Installation Failed</p>
              <p class="text-red-300 text-sm mt-1">{{ installError }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Screenshots Gallery -->
          <div class="glass-card p-6">
            <h2 class="text-2xl font-bold text-white mb-4">Screenshots</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="i in 4"
                :key="i"
                class="aspect-video rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
              >
                <svg class="w-16 h-16 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p class="text-white/60 text-sm mt-3 text-center">Screenshot placeholders - images coming soon</p>
          </div>

          <!-- Description -->
          <div class="glass-card p-6">
            <h2 class="text-2xl font-bold text-white mb-4">About {{ app.title }}</h2>
            <p class="text-white/80 leading-relaxed whitespace-pre-line">
              {{ longDescription }}
            </p>
          </div>

          <!-- Features -->
          <div class="glass-card p-6">
            <h2 class="text-2xl font-bold text-white mb-4">Features</h2>
            <ul class="space-y-3">
              <li
                v-for="(feature, index) in features"
                :key="index"
                class="flex items-start gap-3 text-white/80"
              >
                <svg class="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ feature }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- App Info Card -->
          <div class="glass-card p-6">
            <h3 class="text-lg font-bold text-white mb-4">Information</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between py-2 border-b border-white/10">
                <span class="text-white/60 text-sm">Version</span>
                <span class="text-white font-medium">{{ app.version || 'latest' }}</span>
              </div>
              <div v-if="app.author" class="flex items-center justify-between py-2 border-b border-white/10">
                <span class="text-white/60 text-sm">Developer</span>
                <span class="text-white font-medium">{{ app.author }}</span>
              </div>
              <div class="flex items-center justify-between py-2 border-b border-white/10">
                <span class="text-white/60 text-sm">Status</span>
                <span class="text-white font-medium">{{ isInstalled ? 'Installed' : 'Not Installed' }}</span>
              </div>
              <div class="flex items-center justify-between py-2 border-b border-white/10">
                <span class="text-white/60 text-sm">Category</span>
                <span class="text-white font-medium capitalize">{{ app.category || 'App' }}</span>
              </div>
              <div v-if="app.manifestUrl" class="flex items-center justify-between py-2">
                <span class="text-white/60 text-sm">Package</span>
                <span class="text-white font-medium text-xs">.s9pk</span>
              </div>
            </div>
          </div>

          <!-- Requirements Card -->
          <div class="glass-card p-6">
            <h3 class="text-lg font-bold text-white mb-4">Requirements</h3>
            <div class="space-y-3">
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <div class="flex-1">
                  <p class="text-white/80 font-medium">RAM</p>
                  <p class="text-white/60 text-sm">Minimum 512MB</p>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                <div class="flex-1">
                  <p class="text-white/80 font-medium">Storage</p>
                  <p class="text-white/60 text-sm">~100MB</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Links Card -->
          <div v-if="app.repoUrl || app.manifestUrl" class="glass-card p-6">
            <h3 class="text-lg font-bold text-white mb-4">Links</h3>
            <div class="space-y-2">
              <a
                v-if="app.repoUrl"
                :href="app.repoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.840 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub Repository
              </a>
              <a
                v-if="app.manifestUrl"
                :href="app.manifestUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Package
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- App Not Found -->
    <div v-else class="glass-card p-12 text-center">
      <svg class="w-24 h-24 text-white/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="text-2xl font-semibold text-white mb-2">App Not Found</h3>
      <p class="text-white/70">The requested application could not be found in the marketplace</p>
    </div>

    <!-- Spacer for mobile back button -->
    <div class="md:hidden h-[calc(var(--mobile-tab-bar-height,_64px)+96px)]"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'
import { rpcClient } from '../api/rpc-client'
import { useMarketplaceApp } from '../composables/useMarketplaceApp'

const router = useRouter()
const route = useRoute()
const store = useAppStore()
const { getCurrentApp } = useMarketplaceApp()

const app = ref<any>(null)
const installing = ref(false)
const installError = ref<string | null>(null)
const loading = ref(true)

const appId = computed(() => route.params.id as string)

// Check if app is already installed
const isInstalled = computed(() => {
  return !!store.packages[appId.value]
})

// Extract descriptions with safety checks
const shortDescription = computed(() => {
  try {
    if (!app.value) return ''
    const desc = app.value.description
    if (typeof desc === 'object' && desc) {
      return desc.short || desc.long || ''
    }
    return desc || ''
  } catch (e) {
    console.error('[MarketplaceAppDetails] Error in shortDescription:', e)
    return ''
  }
})

const longDescription = computed(() => {
  try {
    if (!app.value) return ''
    const desc = app.value.description
    if (typeof desc === 'object' && desc) {
      return desc.long || desc.short || ''
    }
    return desc || ''
  } catch (e) {
    console.error('[MarketplaceAppDetails] Error in longDescription:', e)
    return ''
  }
})

// Placeholder features
const features = computed(() => {
  return [
    'Self-hosted and privacy-focused',
    'Easy installation and updates',
    'Automatic backups',
    'Secure by default',
    'Open source'
  ]
})

onMounted(() => {
  console.log('[MarketplaceAppDetails] Loading app ID:', appId.value)
  
  try {
    // Get app data from composable
    const loadedApp = getCurrentApp()
    
    if (loadedApp && loadedApp.id === appId.value) {
      app.value = loadedApp
      console.log('[MarketplaceAppDetails] App loaded successfully:', app.value)
      loading.value = false
    } else {
      console.warn('[MarketplaceAppDetails] App data not found in composable')
      loading.value = false
      // Navigate back to marketplace
      setTimeout(() => {
        router.push('/dashboard/marketplace')
      }, 500)
    }
  } catch (e) {
    console.error('[MarketplaceAppDetails] Error loading app data:', e)
    loading.value = false
    setTimeout(() => {
      router.push('/dashboard/marketplace')
    }, 500)
  }
})

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.src = '/assets/img/logo-neode.png'
}

function goBack() {
  router.push('/dashboard/marketplace')
}

function goToInstalledApp() {
  router.push({
    path: `/dashboard/apps/${appId.value}`,
    query: { from: 'marketplace' }
  })
}

async function installApp() {
  if (installing.value || !app.value?.manifestUrl) {
    console.warn('[MarketplaceAppDetails] Cannot install - no manifestUrl:', app.value)
    return
  }

  installing.value = true
  installError.value = null

  try {
    const installUrl = app.value.url || app.value.manifestUrl
    console.log('[MarketplaceAppDetails] Installing app:', {
      id: app.value.id,
      url: installUrl,
      version: app.value.version,
      source: app.value.source
    })

    if (app.value.source === 'local') {
      await rpcClient.call({
        method: 'package.install',
        params: {
          id: app.value.id,
          url: installUrl,
          version: app.value.version,
        },
      })
    } else {
      // Community marketplace app
      await rpcClient.call({
        method: 'package.install',
        params: {
          id: app.value.id,
          url: installUrl,
          version: app.value.version || 'latest',
        },
      })
    }

    // Wait a moment for the package to be registered
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Navigate to the installed app
    router.push(`/dashboard/apps/${appId.value}`)
  } catch (err: any) {
    installError.value = err.message || 'Installation failed. Please try again.'
    console.error('[MarketplaceAppDetails] Failed to install app:', err)
  } finally {
    installing.value = false
  }
}
</script>

