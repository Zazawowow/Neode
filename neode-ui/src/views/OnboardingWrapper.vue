<template>
  <div class="min-h-screen relative overflow-hidden">
    <!-- Background layers with 3D perspective and zoom effect -->
    <div class="bg-perspective-container">
      <!-- Background layer with zoom animation -->
      <div 
        class="bg-layer bg-zoom"
        :class="{ 'bg-zoom-in': isTransitioning }"
        :style="{ backgroundImage: `url('/assets/img/${currentBackground}')` }"
        :key="currentBackground"
      ></div>
      
      <!-- Glitch overlay layer -->
      <div v-show="isGlitching" class="bg-glitch-layer"></div>
    </div>

    <!-- Content with 3D transitions -->
    <div class="perspective-container-wrapper">
      <div class="perspective-container">
        <RouterView v-slot="{ Component, route }">
          <Transition name="depth-forward">
            <div :key="route.path" class="view-wrapper">
              <component :is="Component" class="view-container" />
            </div>
          </Transition>
        </RouterView>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const currentBackground = ref('bg-4.jpg')
const isGlitching = ref(false)
const isTransitioning = ref(false)

// Map each route to a specific background image
const routeBackgrounds: Record<string, string> = {
  '/onboarding/intro': 'bg-4.jpg',
  '/onboarding/options': 'bg-5.jpg',
  '/onboarding/path': 'bg-3.jpg',
  '/onboarding/did': 'bg-6.jpg',
  '/onboarding/backup': 'bg-7.jpg',
  '/onboarding/verify': 'bg-2.jpg',
  '/onboarding/done': 'bg-1.jpg',
  '/login': 'bg-1.jpg'
}

// Watch route changes for background swaps, zoom, and glitch
watch(() => route.path, (newPath, oldPath) => {
  const newBg = routeBackgrounds[newPath]
  
  // Only update if we have a defined background for this route and it's different
  if (newBg && newBg !== currentBackground.value) {
    // Trigger zoom animation
    isTransitioning.value = true
    
    // Change background
    currentBackground.value = newBg
    
    // Trigger glitch after the 3D transition completes
    setTimeout(() => {
      isGlitching.value = true
      setTimeout(() => {
        isGlitching.value = false
      }, 500) // Match glitch duration
      
      // Reset zoom after glitch
      isTransitioning.value = false
    }, 700 + 50) // Wait for 3D transition (700ms) + small delay
  }
})

// Initialize background on mount based on current route
onMounted(() => {
  const bg = routeBackgrounds[route.path]
  if (bg) {
    currentBackground.value = bg
  }
})
</script>

<style scoped>
/* Wrapper to contain perspective without clipping */
.perspective-container-wrapper {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
}

/* Perspective container for 3D depth effect */
.perspective-container {
  perspective: 1200px;
  perspective-origin: 50% 50%;
  position: relative;
  min-height: 100vh;
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
  transition: all 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.depth-forward-enter-from.view-wrapper {
  opacity: 0;
  transform: translateZ(-1500px) scale(0.5);
  filter: blur(8px);
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
  transform: translateZ(600px) scale(1.4);
  filter: blur(12px);
}

/* Background zoom effect - makes you feel like you're going deeper */
.bg-zoom {
  transition: transform 1.5s cubic-bezier(0.4, 0, 0.2, 1);
  transform: scale(1);
}

.bg-zoom-in {
  transform: scale(1.15);
}

/* Enhanced effect with rotation for more console-like feel */
@media (min-width: 768px) {
  .depth-forward-enter-from.view-wrapper {
    transform: translateZ(-1500px) scale(0.5) rotateX(15deg);
  }
  
  .depth-forward-leave-to.view-wrapper {
    transform: translateZ(600px) scale(1.4) rotateX(-10deg);
  }
}

/* Background 3D container */
.bg-perspective-container {
  position: fixed;
  inset: 0;
  perspective: 1000px;
  perspective-origin: 50% 50%;
  z-index: -10;
  overflow: hidden;
}

.bg-layer {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

.bg-static {
  opacity: 1;
  transform: translateZ(0) scale(1);
}

/* Glitch overlay layer */
.bg-glitch-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
  background: rgba(255, 255, 255, 0.1);
  mix-blend-mode: overlay;
  opacity: 0;
  animation: bg-glitch-flash 500ms ease-in-out;
}

@keyframes bg-glitch-flash {
  0%, 100% {
    opacity: 0;
    transform: translateX(0);
  }
  10% {
    opacity: 0.3;
    transform: translateX(-3px);
  }
  20% {
    opacity: 0;
    transform: translateX(3px);
  }
  30% {
    opacity: 0.4;
    transform: translateX(-2px);
  }
  40% {
    opacity: 0;
    transform: translateX(2px);
  }
  50% {
    opacity: 0.2;
    transform: translateX(-1px);
  }
  60% {
    opacity: 0;
    transform: translateX(1px);
  }
}
</style>

