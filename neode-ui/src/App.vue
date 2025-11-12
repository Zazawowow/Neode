<template>
  <div id="app">
    <!-- Splash Screen (only on first visit) -->
    <SplashScreen v-if="showSplash" @complete="handleSplashComplete" />

    <!-- Main App Content -->
    <RouterView v-if="!showSplash" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SplashScreen from './components/SplashScreen.vue'

const router = useRouter()
const route = useRoute()
const showSplash = ref(true)

onMounted(() => {
  // Check if we're on a route that should skip splash
  const skipSplashRoutes = ['/login', '/onboarding/intro', '/onboarding/options']
  const currentPath = route.path
  
  // Check if user has seen intro or is on a specific route
  const seenIntro = localStorage.getItem('neode_intro_seen') === '1'
  const shouldSkipSplash = seenIntro || skipSplashRoutes.includes(currentPath)
  
  if (shouldSkipSplash) {
    showSplash.value = false
    document.body.classList.add('splash-complete')
  }
})

function handleSplashComplete() {
  showSplash.value = false
  // Navigate to onboarding if needed
  const seenOnboarding = localStorage.getItem('neode_onboarding_complete') === '1'
  if (!seenOnboarding) {
    router.push('/onboarding/intro')
  } else {
    router.push('/login')
  }
}
</script>

<style>
/* Global styles are in style.css */
</style>
