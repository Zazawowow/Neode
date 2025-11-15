<template>
  <div class="min-h-screen flex relative dashboard-view">
    <!-- Background container with 3D perspective -->
    <div class="bg-perspective-container">
      <!-- Background - default -->
    <div
        ref="bgDefault"
        class="bg-layer"
        :class="{ 'bg-transitioning-out': showAltBackground }"
      style="background-image: url(/assets/img/bg-4.jpg)"
    />
      <!-- Background - alternate for app details -->
      <div
        ref="bgAlt"
        class="bg-layer"
        :class="{ 'bg-transitioning-in': showAltBackground }"
        style="background-image: url(/assets/img/bg-3.jpg)"
      />
    <div class="fixed inset-0 bg-black/30 -z-10" />
      
      <!-- Glitch overlays - trigger on background change -->
      <div 
        class="bg-glitch-layer-1"
        :class="{ 'glitch-active': isGlitching }"
        style="background-image: url(/assets/img/bg-3.jpg)"
      />
      <div 
        class="bg-glitch-layer-2"
        :class="{ 'glitch-active': isGlitching }"
        style="background-image: url(/assets/img/bg-3.jpg)"
      />
      <div 
        class="bg-glitch-scan"
        :class="{ 'glitch-active': isGlitching }"
      />
    </div>

    <!-- Sidebar - Desktop Only -->
    <aside class="hidden md:flex w-[256px] border-r border-glass-border shadow-glass-sm flex-shrink-0 relative flex-col" style="background: rgba(0, 0, 0, 0.25); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);">
      <div class="p-6 flex-1">
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
            exact-active-class="nav-tab-active"
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

      <!-- User Section - Desktop Only -->
      <div class="p-6">
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
    <main class="flex-1 overflow-hidden relative pb-20 md:pb-0">
      <!-- Connection Status Banner -->
      <div v-if="isOffline && !store.isReconnecting" class="path-option-card mx-6 mt-6 px-6 py-3 border-l-4 border-yellow-500">
        <div class="flex items-center gap-2 text-yellow-200">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span class="font-medium">
            {{ isRestarting ? 'Server is restarting...' : isShuttingDown ? 'Server is shutting down...' : 'Connection lost' }}
          </span>
        </div>
      </div>

      <div class="perspective-container-wrapper">
        <div class="perspective-container">
          <RouterView v-slot="{ Component, route }">
            <Transition :name="getTransitionName(route)">
              <div :key="route.path" class="view-wrapper">
                <div class="p-4 md:p-8 pb-0 md:pb-8 overflow-y-auto h-full">
                  <component :is="Component" class="view-container" />
                </div>
              </div>
            </Transition>
          </RouterView>
        </div>
      </div>
    </main>

    <!-- Mobile Bottom Tab Bar -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 border-t border-glass-border shadow-glass z-50" style="background: rgba(0, 0, 0, 0.25); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);">
      <div class="flex justify-around items-center px-2 py-3">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex flex-col items-center justify-center gap-1 px-3 py-2.5 rounded-lg text-white/70 transition-colors min-w-0"
          exact-active-class="nav-tab-active"
        >
          <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              v-for="(path, index) in getIconPath(item.icon)" 
              :key="index"
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              :d="path" 
            />
          </svg>
          <span class="text-xs font-medium truncate max-w-full">{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'

const router = useRouter()
const route = useRoute()
const store = useAppStore()

// Background swap for app details
const showAltBackground = ref(false)
const isGlitching = ref(false)

watch(() => route.path, (newPath) => {
  // Check if we're on app details OR marketplace app details
  const isAppDetails = (newPath.includes('/apps/') && !newPath.endsWith('/apps')) || 
                       (newPath.includes('/marketplace/') && !newPath.endsWith('/marketplace'))
  const wasAppDetails = showAltBackground.value
  
  // Change background immediately
  showAltBackground.value = isAppDetails
  
  // Trigger glitch ONLY when going forward (to app details), not back
  if (isAppDetails && !wasAppDetails) {
    setTimeout(() => {
      isGlitching.value = true
      setTimeout(() => {
        isGlitching.value = false
      }, 375) // Glitch duration - 25% faster
    }, 500) // Wait for background 3D transition to complete
  }
})

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

// Track previous route for transition logic
let previousPath = ''

// Tab order for vertical transitions
const tabOrder = [
  '/dashboard',
  '/dashboard/apps',
  '/dashboard/marketplace',
  '/dashboard/server',
  '/dashboard/settings'
]

// Determine transition direction based on route depth
function getTransitionName(currentRoute: any) {
  const currentPath = currentRoute.path
  const isAppDetails = currentPath.includes('/apps/') && !currentPath.endsWith('/apps')
  const isAppsList = currentPath === '/dashboard/apps'
  const wasAppDetails = previousPath.includes('/apps/') && !previousPath.endsWith('/apps')
  const wasAppsList = previousPath === '/dashboard/apps'
  
  // Marketplace detail transitions
  const isMarketplaceDetails = currentPath.includes('/marketplace/') && !currentPath.endsWith('/marketplace')
  const isMarketplaceList = currentPath === '/dashboard/marketplace'
  const wasMarketplaceDetails = previousPath.includes('/marketplace/') && !previousPath.endsWith('/marketplace')
  const wasMarketplaceList = previousPath === '/dashboard/marketplace'
  
  let transitionName = 'none'
  
  // Horizontal depth transition: apps list <-> app details
  if (wasAppsList && isAppDetails) {
    transitionName = 'depth-forward'
  } else if (wasAppDetails && isAppsList) {
    transitionName = 'depth-back'
  }
  // Horizontal depth transition: marketplace list <-> marketplace details
  else if (wasMarketplaceList && isMarketplaceDetails) {
    transitionName = 'depth-forward'
  } else if (wasMarketplaceDetails && isMarketplaceList) {
    transitionName = 'depth-back'
  }
  // Vertical transition: between main tabs
  else {
    const currentIndex = tabOrder.indexOf(currentPath)
    const previousIndex = tabOrder.indexOf(previousPath)
    
    if (currentIndex !== -1 && previousIndex !== -1 && currentIndex !== previousIndex) {
      // Moving down the menu (visual down)
      if (currentIndex > previousIndex) {
        transitionName = 'slide-down'
      }
      // Moving up the menu (visual up)
      else {
        transitionName = 'slide-up'
      }
    }
  }
  
  // Update previous path for next transition
  previousPath = currentPath
  
  return transitionName
}
</script>

<style>
/* Wrapper to contain perspective without clipping */
.perspective-container-wrapper {
  position: relative;
  overflow: hidden;
  height: 100%;
}

/* Perspective container for 3D depth effect */
.perspective-container {
  perspective: 2000px;
  perspective-origin: 50% 50%;
  position: relative;
  height: 100%;
  overflow: hidden;
}

/* View wrapper - allows smooth transitions with absolute positioning */
.view-wrapper {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  will-change: transform, opacity;
}

.view-container {
  height: 100%;
}

/* Forward transition: Current screen pulls forward, new screen emerges from back */
.depth-forward-enter-active.view-wrapper,
.depth-forward-leave-active.view-wrapper {
  transition: all 0.45s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.depth-forward-enter-from.view-wrapper {
  opacity: 0;
  transform: translateZ(-800px) scale(0.75);
  filter: blur(4px);
}

.depth-forward-enter-to.view-wrapper {
  opacity: 1;
  transform: translateZ(0) scale(1);
  filter: blur(0px);
}

.depth-forward-leave-from.view-wrapper {
  opacity: 1;
  transform: translateZ(0) scale(1);
  filter: blur(0px);
}

.depth-forward-leave-to.view-wrapper {
  opacity: 0;
  transform: translateZ(400px) scale(1.2);
  filter: blur(8px);
}

/* Back transition: Current screen pulls back, previous screen comes forward */
.depth-back-enter-active.view-wrapper,
.depth-back-leave-active.view-wrapper {
  transition: all 0.45s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.depth-back-enter-from.view-wrapper {
  opacity: 0;
  transform: translateZ(400px) scale(1.2);
  filter: blur(8px);
}

.depth-back-enter-to.view-wrapper {
  opacity: 1;
  transform: translateZ(0) scale(1);
  filter: blur(0px);
}

.depth-back-leave-from.view-wrapper {
  opacity: 1;
  transform: translateZ(0) scale(1);
  filter: blur(0px);
}

.depth-back-leave-to.view-wrapper {
  opacity: 0;
  transform: translateZ(-800px) scale(0.75);
  filter: blur(4px);
}

/* Enhanced effect with rotation for more console-like feel */
@media (min-width: 768px) {
  .depth-forward-enter-from.view-wrapper {
    transform: translateZ(-800px) scale(0.75) rotateX(8deg);
  }
  
  .depth-forward-leave-to.view-wrapper {
    transform: translateZ(400px) scale(1.2) rotateX(-5deg);
  }
  
  .depth-back-enter-from.view-wrapper {
    transform: translateZ(400px) scale(1.2) rotateX(-5deg);
  }
  
  .depth-back-leave-to.view-wrapper {
    transform: translateZ(-800px) scale(0.75) rotateX(8deg);
  }
}

/* No transition for other cases */
.none-enter-active,
.none-leave-active {
  transition: none;
}

.none-enter-from,
.none-leave-to {
  opacity: 1;
}

/* Slide down: Moving down the menu (content slides up like a scroll) */
.slide-down-enter-active.view-wrapper {
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-down-leave-active.view-wrapper {
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from.view-wrapper {
  opacity: 0;
  transform: translateY(40vh);
}

.slide-down-enter-to.view-wrapper {
  opacity: 1;
  transform: translateY(0);
}

.slide-down-leave-from.view-wrapper {
  opacity: 1;
  transform: translateY(0);
}

.slide-down-leave-to.view-wrapper {
  opacity: 0;
  transform: translateY(-30vh);
}

/* Slide up: Moving up the menu (content slides down like a scroll) */
.slide-up-enter-active.view-wrapper {
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-up-leave-active.view-wrapper {
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94),
              opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from.view-wrapper {
  opacity: 0;
  transform: translateY(-40vh);
}

.slide-up-enter-to.view-wrapper {
  opacity: 1;
  transform: translateY(0);
}

.slide-up-leave-from.view-wrapper {
  opacity: 1;
  transform: translateY(0);
}

.slide-up-leave-to.view-wrapper {
  opacity: 0;
  transform: translateY(30vh);
}

/* Background 3D container */
.bg-perspective-container {
  position: fixed;
  inset: 0;
  z-index: -10;
  perspective: 1000px;
  perspective-origin: 50% 50%;
  overflow: hidden;
}

/* Background layers with 3D transitions */
.bg-layer {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transition: all 0.45s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transform-style: preserve-3d;
  will-change: transform, opacity;
}

/* Default state - bg-4 visible, bg-3 hidden back */
.bg-layer:first-child {
  opacity: 1;
  transform: translateZ(0) scale(1);
}

.bg-layer:nth-child(2) {
  opacity: 0;
  transform: translateZ(-200px) scale(0.9) rotateY(-15deg);
}

/* Transitioning out - bg-4 moves away */
.bg-layer.bg-transitioning-out {
  opacity: 0;
  transform: translateZ(200px) scale(1.1) rotateY(15deg) !important;
}

/* Transitioning in - bg-3 comes forward */
.bg-layer.bg-transitioning-in {
  opacity: 1;
  transform: translateZ(0) scale(1) rotateY(0deg) !important;
}

/* Background glitch effect layers - World Fair style */
.bg-glitch-layer-1,
.bg-glitch-layer-2,
.bg-glitch-scan {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 10;
  opacity: 0;
}

.bg-glitch-layer-1 {
  background-size: cover;
  background-position: center;
  mix-blend-mode: lighten;
  filter: brightness(1.8) contrast(2) saturate(1.5) hue-rotate(180deg);
  will-change: transform, clip-path, opacity;
}

.bg-glitch-layer-2 {
  background-size: cover;
  background-position: center;
  mix-blend-mode: color-dodge;
  filter: brightness(2) contrast(2) saturate(2) hue-rotate(90deg);
  will-change: transform, clip-path, opacity;
}

.bg-glitch-scan {
  background: 
    linear-gradient(90deg, 
      rgba(255,0,255,0.2) 0%, 
      rgba(0,255,255,0.2) 25%, 
      rgba(255,255,0,0.2) 50%,
      rgba(0,255,255,0.2) 75%, 
      rgba(255,0,255,0.2) 100%
    ),
    repeating-linear-gradient(0deg, 
      rgba(255,255,255,0.05) 0px, 
      rgba(255,255,255,0.05) 2px, 
      transparent 2px, 
      transparent 4px
    );
  will-change: transform, opacity;
}

/* Trigger glitch animation when active */
.bg-glitch-layer-1.glitch-active {
  animation: bg-glitch-shift 0.375s steps(15, end) forwards;
}

.bg-glitch-layer-2.glitch-active {
  animation: bg-glitch-shift-2 0.375s steps(12, end) forwards;
}

.bg-glitch-scan.glitch-active {
  animation: bg-glitch-scan 0.375s linear forwards;
}

/* World Fair style - visible but tasteful glitch */
@keyframes bg-glitch-shift {
  0% { transform: translate(0,0); clip-path: inset(0% 0 0 0); opacity: 0; }
  5% { opacity: 0.5; }
  12% { transform: translate(15px,-8px); clip-path: inset(12% 0 70% 0); }
  20% { transform: translate(-20px,10px); clip-path: inset(45% 0 35% 0); }
  28% { transform: translate(18px,-5px); clip-path: inset(68% 0 15% 0); }
  36% { transform: translate(-15px,12px); clip-path: inset(20% 0 60% 0); }
  44% { transform: translate(22px,-10px); clip-path: inset(52% 0 28% 0); }
  52% { transform: translate(-18px,8px); clip-path: inset(10% 0 75% 0); }
  60% { transform: translate(12px,-6px); clip-path: inset(58% 0 22% 0); }
  68% { transform: translate(-10px,15px); clip-path: inset(32% 0 48% 0); }
  76% { transform: translate(16px,-4px); clip-path: inset(72% 0 12% 0); }
  84% { transform: translate(-12px,7px); clip-path: inset(18% 0 65% 0); }
  92% { transform: translate(8px,-3px); clip-path: inset(42% 0 40% 0); }
  96% { opacity: 0.4; }
  100% { transform: translate(0,0); clip-path: inset(0% 0 0 0); opacity: 0; }
}

@keyframes bg-glitch-shift-2 {
  0% { transform: translate(0,0) skewX(0deg); clip-path: inset(0% 0 0 0); opacity: 0; }
  8% { opacity: 0.5; }
  15% { transform: translate(-18px,10px) skewX(4deg); clip-path: inset(25% 0 55% 0); }
  23% { transform: translate(22px,-12px) skewX(-5deg); clip-path: inset(50% 0 30% 0); }
  31% { transform: translate(-16px,8px) skewX(3deg); clip-path: inset(72% 0 12% 0); }
  39% { transform: translate(20px,-15px) skewX(-4deg); clip-path: inset(18% 0 65% 0); }
  47% { transform: translate(-22px,12px) skewX(5deg); clip-path: inset(42% 0 38% 0); }
  55% { transform: translate(18px,-8px) skewX(-3deg); clip-path: inset(62% 0 20% 0); }
  63% { transform: translate(-14px,14px) skewX(4deg); clip-path: inset(30% 0 52% 0); }
  71% { transform: translate(16px,-6px) skewX(-2deg); clip-path: inset(8% 0 78% 0); }
  79% { transform: translate(-12px,10px) skewX(3deg); clip-path: inset(55% 0 28% 0); }
  87% { transform: translate(10px,-4px) skewX(-2deg); clip-path: inset(35% 0 45% 0); }
  95% { opacity: 0.4; }
  100% { transform: translate(0,0) skewX(0deg); clip-path: inset(0% 0 0 0); opacity: 0; }
}

@keyframes bg-glitch-scan {
  0% { opacity: 0; transform: translateX(-120%); }
  5% { opacity: 0.5; }
  15% { opacity: 0.55; transform: translateX(-80%); }
  30% { opacity: 0.6; transform: translateX(-40%); }
  50% { opacity: 0.6; transform: translateX(0%); }
  70% { opacity: 0.55; transform: translateX(40%); }
  85% { opacity: 0.5; transform: translateX(80%); }
  95% { opacity: 0.45; }
  100% { opacity: 0; transform: translateX(120%); }
}
</style>

