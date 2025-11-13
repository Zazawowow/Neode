<template>
  <div class="min-h-screen relative overflow-hidden">
    <!-- Background layers with 3D perspective -->
    <div class="bg-perspective-container">
      <!-- Default background -->
      <div 
        class="bg-layer"
        :class="{
          'bg-transitioning-out': showAltBackground,
          'bg-transitioning-in': !showAltBackground
        }"
        style="background-image: url('/assets/img/bg-4.jpg');"
      ></div>
      
      <!-- Alternate background for certain screens -->
      <div 
        class="bg-layer"
        :class="{
          'bg-transitioning-in': showAltBackground,
          'bg-transitioning-out': !showAltBackground
        }"
        style="background-image: url('/assets/img/bg-3.jpg');"
      ></div>
      
      <!-- Glitch overlay layers -->
      <div v-show="isGlitching" class="bg-glitch-layer-1"></div>
      <div v-show="isGlitching" class="bg-glitch-layer-2"></div>
      <div v-show="isGlitching" class="bg-glitch-scan"></div>
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
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const showAltBackground = ref(false)
const isGlitching = ref(false)

// Screens that should trigger background swap and glitch
const altBackgroundScreens = [
  '/onboarding/path',
  '/onboarding/did',
  '/onboarding/backup',
  '/onboarding/verify',
  '/onboarding/done'
]

// Watch route changes for background swaps and glitch
watch(() => route.path, (newPath, oldPath) => {
  const isAltScreen = altBackgroundScreens.includes(newPath)
  const wasAltScreen = altBackgroundScreens.includes(oldPath)
  
  // Update background
  showAltBackground.value = isAltScreen
  
  // Trigger glitch when transitioning TO an alt background screen
  if (isAltScreen && !wasAltScreen) {
    // Trigger glitch after the 3D transition completes
    setTimeout(() => {
      isGlitching.value = true
      setTimeout(() => {
        isGlitching.value = false
      }, 500) // Match glitch duration
    }, 700 + 50) // Wait for 3D transition (700ms) + small delay
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
  transition: all 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

.bg-transitioning-out {
  opacity: 0;
  transform: translateZ(-500px) scale(0.7) rotateY(10deg);
}

.bg-transitioning-in {
  opacity: 1;
  transform: translateZ(0) scale(1) rotateY(0deg);
}

/* Glitch overlay layers */
.bg-glitch-layer-1,
.bg-glitch-layer-2,
.bg-glitch-scan {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

.bg-glitch-layer-1 {
  background: linear-gradient(90deg, 
    rgba(255, 0, 0, 0.6) 0%,
    transparent 20%,
    transparent 80%,
    rgba(0, 255, 255, 0.6) 100%);
  mix-blend-mode: color-dodge;
  opacity: 0;
  filter: brightness(1.8) contrast(1.5) saturate(2);
  animation: bg-glitch-shift 500ms ease-in-out;
}

.bg-glitch-layer-2 {
  background: linear-gradient(180deg,
    rgba(0, 255, 0, 0.5) 0%,
    transparent 50%,
    rgba(255, 0, 255, 0.5) 100%);
  mix-blend-mode: lighten;
  opacity: 0;
  filter: brightness(1.6) contrast(1.4) hue-rotate(45deg);
  animation: bg-glitch-shift-2 500ms ease-in-out;
}

.bg-glitch-scan {
  background: linear-gradient(0deg,
    transparent 0%,
    rgba(255, 0, 0, 0.4) 33%,
    rgba(0, 255, 0, 0.4) 66%,
    rgba(0, 0, 255, 0.4) 100%);
  mix-blend-mode: screen;
  opacity: 0;
  filter: brightness(1.5);
  animation: bg-glitch-scan 500ms linear;
}

@keyframes bg-glitch-shift {
  0%, 100% {
    opacity: 0;
    transform: translateX(0) skewX(0deg);
  }
  20% {
    opacity: 0.7;
    transform: translateX(-15px) skewX(4deg);
  }
  40% {
    opacity: 0.8;
    transform: translateX(12px) skewX(-5deg);
  }
  60% {
    opacity: 0.7;
    transform: translateX(-8px) skewX(3deg);
  }
  80% {
    opacity: 0.5;
    transform: translateX(6px) skewX(-2deg);
  }
}

@keyframes bg-glitch-shift-2 {
  0%, 100% {
    opacity: 0;
    transform: translateY(0) skewY(0deg);
  }
  25% {
    opacity: 0.6;
    transform: translateY(10px) skewY(-4deg);
  }
  50% {
    opacity: 0.8;
    transform: translateY(-12px) skewY(5deg);
  }
  75% {
    opacity: 0.5;
    transform: translateY(8px) skewY(-3deg);
  }
}

@keyframes bg-glitch-scan {
  0% {
    opacity: 0;
    transform: translateY(-100%);
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 0;
    transform: translateY(100%);
  }
}
</style>

