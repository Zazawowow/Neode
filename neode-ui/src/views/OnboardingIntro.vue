<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-2xl w-full">
      <div class="glass-card p-12 pt-20 text-center animate-fade-up relative">
        <!-- Logo - half in, half out of container -->
        <div class="absolute -top-[52px] left-1/2 -translate-x-1/2">
          <div class="logo-gradient-border">
            <img 
              src="/assets/img/logo-neode.png" 
              alt="Neode" 
              class="w-20 h-20"
            />
          </div>
        </div>
        
        <h1 class="text-4xl font-bold text-white mb-4">
          Welcome to Neode
        </h1>
        
        <p class="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
          Your personal server for a sovereign digital life
        </p>
        
        <button
          @click="goToOptions"
          class="glass-button px-8 py-4 rounded-lg text-lg font-medium transition-all hover:bg-black/70 hover:border-white/30"
        >
          Get Started →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goToOptions() {
  router.push('/onboarding/path')
}
</script>

