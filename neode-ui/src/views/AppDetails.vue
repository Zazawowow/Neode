<template>
  <div class="app-details-container pb-16 md:pb-16">
    <!-- Desktop Back Button -->
    <button @click="goBack" class="hidden md:flex mb-6 items-center gap-2 text-white/70 hover:text-white transition-colors">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to Apps
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
      <span>Back to Apps</span>
    </button>

    <div v-if="pkg">
      <!-- Compact Hero Section -->
      <div class="glass-card p-6 mb-6">
        <!-- Desktop: Single Row Layout -->
        <div class="hidden md:flex items-center gap-6">
          <!-- App Icon -->
      <img
        :src="pkg['static-files'].icon"
        :alt="pkg.manifest.title"
            class="w-20 h-20 rounded-xl shadow-xl flex-shrink-0"
            @error="handleImageError"
          />
          
          <!-- App Info (grows to fill space) -->
          <div class="flex-1 min-w-0">
            <h1 class="text-2xl font-bold text-white mb-1">{{ pkg.manifest.title }}</h1>
            <p class="text-white/70 text-sm mb-2">{{ pkg.manifest.description.short }}</p>
            <div class="flex items-center gap-2">
      <span
                class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium"
        :class="getStatusClass(pkg.state)"
      >
                <span class="w-1.5 h-1.5 rounded-full mr-1.5" :class="getStatusDotClass(pkg.state)"></span>
        {{ pkg.state }}
      </span>
              <span class="text-white/50 text-xs">v{{ pkg.manifest.version }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2 flex-shrink-0">
        <button
              v-if="canLaunch"
          @click="launchApp"
              class="gradient-button px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Launch
            </button>
            <button
              v-if="pkg.state === 'stopped'"
              @click="startApp"
              class="px-4 py-2.5 bg-green-500/20 border border-green-500/40 rounded-lg text-green-200 text-sm font-medium hover:bg-green-500/30 transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              Start
            </button>
            <button
              @click="restartApp"
              class="px-4 py-2.5 glass-button rounded-lg text-sm font-medium hover:bg-white/15 transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Restart
            </button>
            <button
              v-if="pkg.state === 'running'"
              @click="stopApp"
              class="px-4 py-2.5 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-yellow-200 text-sm font-medium hover:bg-yellow-500/30 transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Stop
            </button>
            <button
              @click="uninstallApp"
              class="px-4 py-2.5 bg-red-600/20 border border-red-600/40 rounded-lg text-red-300 text-sm font-medium hover:bg-red-600/30 transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Uninstall
            </button>
          </div>
        </div>

        <!-- Mobile: Two Column Grid Layout -->
        <div class="md:hidden">
          <!-- Header: Icon + Info + Delete -->
          <div class="flex items-start gap-4 mb-4">
            <!-- App Icon -->
            <img
              :src="pkg['static-files'].icon"
              :alt="pkg.manifest.title"
              class="w-20 h-20 rounded-xl shadow-xl flex-shrink-0"
              @error="handleImageError"
            />
            
            <!-- App Info -->
            <div class="flex-1 min-w-0">
              <h1 class="text-xl font-bold text-white mb-1">{{ pkg.manifest.title }}</h1>
              <p class="text-white/70 text-xs mb-2 line-clamp-2">{{ pkg.manifest.description.short }}</p>
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="getStatusClass(pkg.state)"
                >
                  <span class="w-1.5 h-1.5 rounded-full mr-1" :class="getStatusDotClass(pkg.state)"></span>
                  {{ pkg.state }}
                </span>
                <span class="text-white/50 text-xs">v{{ pkg.manifest.version }}</span>
              </div>
            </div>

            <!-- Uninstall Icon Button -->
            <button
              @click="uninstallApp"
              class="flex-shrink-0 w-9 h-9 rounded-lg bg-red-600/20 border border-red-600/40 text-red-300 hover:bg-red-600/30 transition-colors flex items-center justify-center"
              title="Uninstall"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
        </button>
      </div>

          <!-- Action Buttons (Auto Grid) -->
          <div class="grid grid-cols-2 gap-2">
            <button
              v-if="canLaunch"
              @click="launchApp"
              class="gradient-button px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Launch
            </button>
        <button
          v-if="pkg.state === 'stopped'"
          @click="startApp"
              class="px-4 py-2.5 bg-green-500/20 border border-green-500/40 rounded-lg text-green-200 text-sm font-medium hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
        >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
          Start
        </button>
        <button
          v-if="pkg.state === 'running'"
          @click="stopApp"
              class="px-4 py-2.5 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-yellow-200 text-sm font-medium hover:bg-yellow-500/30 transition-colors flex items-center justify-center gap-2"
        >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
          Stop
        </button>
        <button
          @click="restartApp"
              :class="[canLaunch && (pkg.state === 'stopped' || pkg.state === 'running') ? 'col-span-2' : '']"
              class="px-4 py-2.5 glass-button rounded-lg text-sm font-medium hover:bg-white/15 transition-colors flex items-center justify-center gap-2"
        >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
          Restart
        </button>
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
            <h2 class="text-2xl font-bold text-white mb-4">About {{ pkg.manifest.title }}</h2>
            <p class="text-white/80 leading-relaxed whitespace-pre-line">
              {{ pkg.manifest.description.long }}
            </p>
          </div>

          <!-- Features (if available) -->
          <div v-if="features.length > 0" class="glass-card p-6">
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
                <span class="text-white font-medium">{{ pkg.manifest.version }}</span>
              </div>
              <div v-if="pkg.manifest.author" class="flex items-center justify-between py-2 border-b border-white/10">
                <span class="text-white/60 text-sm">Developer</span>
                <span class="text-white font-medium">{{ pkg.manifest.author }}</span>
              </div>
              <div class="flex items-center justify-between py-2 border-b border-white/10">
                <span class="text-white/60 text-sm">Status</span>
                <span class="text-white font-medium capitalize">{{ pkg.state }}</span>
              </div>
              <div v-if="pkg.manifest.license" class="flex items-center justify-between py-2 border-b border-white/10">
                <span class="text-white/60 text-sm">License</span>
                <span class="text-white font-medium">{{ pkg.manifest.license }}</span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-white/60 text-sm">Category</span>
                <span class="text-white font-medium">App</span>
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
          <div class="glass-card p-6">
            <h3 class="text-lg font-bold text-white mb-4">Links</h3>
            <div class="space-y-2">
              <a
                v-if="pkg.manifest.website"
                :href="pkg.manifest.website"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                Website
              </a>
              <a
                href="#"
                class="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.840 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Source Code
              </a>
              <a
                href="#"
                class="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Documentation
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
      <p class="text-white/70">The requested application could not be found</p>
    </div>

    <!-- Spacer for mobile back button -->
     <div class="md:hidden h-[calc(var(--mobile-tab-bar-height,_64px)+96px)]"></div>

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
          class="glass-card p-6 md:p-8 max-w-md w-full relative z-10"
        >
          <div class="flex items-start gap-4 mb-6">
            <div class="p-3 bg-red-500/20 rounded-lg flex-shrink-0">
              <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-xl font-semibold text-white mb-2">Uninstall App?</h3>
              <p class="text-white/70 text-sm">
                Are you sure you want to uninstall <span class="text-white font-medium">{{ uninstallModal.appTitle }}</span>?
                This will remove the app and stop its container.
              </p>
            </div>
          </div>

          <div class="flex flex-col-reverse md:flex-row gap-3 md:justify-end">
            <button
              @click="uninstallModal.show = false"
              class="w-full md:w-auto px-6 py-3 glass-button rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
            <button
              @click="confirmUninstall"
              class="w-full md:w-auto px-6 py-3 bg-red-600/80 hover:bg-red-600 rounded-lg text-white text-sm font-medium transition-colors"
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
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'
import { PackageState } from '../types/api'

const router = useRouter()
const route = useRoute()
const store = useAppStore()

const appId = computed(() => route.params.id as string)
const pkg = computed(() => store.packages[appId.value])

const uninstallModal = ref({
  show: false,
  appTitle: ''
})

// Check if app has a UI interface and is running
const canLaunch = computed(() => {
  if (!pkg.value) return false
  const hasUI = pkg.value.manifest.interfaces?.main?.ui
  const isRunning = pkg.value.state === 'running'
  return hasUI && isRunning
})

// Placeholder features - could be extracted from manifest later
const features = computed(() => {
  return [
    'Self-hosted and privacy-focused',
    'Easy installation and updates',
    'Automatic backups',
    'Secure by default'
  ]
})

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.src = '/assets/img/logo-neode.png'
}

function goBack() {
  router.back()
}

function launchApp() {
  if (!pkg.value) return
  
  const isDev = import.meta.env.DEV
  const id = appId.value
  
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

function showUninstallModal() {
  if (!pkg.value) return
  uninstallModal.value = {
    show: true,
    appTitle: pkg.value.manifest.title
  }
}

async function confirmUninstall() {
  uninstallModal.value.show = false
  
  try {
    await store.uninstallPackage(appId.value)
    // Navigate back to apps after uninstall
    router.push('/dashboard/apps')
  } catch (err) {
    console.error('Failed to uninstall app:', err)
    alert('Failed to uninstall app')
  }
}

// Keep for backwards compatibility but redirect to modal
async function uninstallApp() {
  showUninstallModal()
}

function getStatusClass(state: PackageState): string {
  switch (state) {
    case PackageState.Running:
      return 'bg-green-500/20 text-green-200 border border-green-500/30'
    case PackageState.Stopped:
      return 'bg-gray-500/20 text-gray-200 border border-gray-500/30'
    case PackageState.Starting:
    case PackageState.Stopping:
    case PackageState.Restarting:
      return 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30'
    case PackageState.Installing:
      return 'bg-blue-500/20 text-blue-200 border border-blue-500/30'
    default:
      return 'bg-gray-500/20 text-gray-200 border border-gray-500/30'
  }
}

function getStatusDotClass(state: PackageState): string {
  switch (state) {
    case PackageState.Running:
      return 'bg-green-400'
    case PackageState.Stopped:
      return 'bg-gray-400'
    case PackageState.Starting:
    case PackageState.Stopping:
    case PackageState.Restarting:
      return 'bg-yellow-400 animate-pulse'
    case PackageState.Installing:
      return 'bg-blue-400 animate-pulse'
    default:
      return 'bg-gray-400'
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
