<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <!-- Background -->
    <div
      class="absolute inset-0 bg-cover bg-center"
      :style="{ backgroundImage: 'url(/assets/img/bg-3.jpg)' }"
    />
    <div class="absolute inset-0 bg-black/30" />

    <!-- Main Glass Container -->
    <div class="max-w-[800px] w-full relative z-10 path-glass-container">
      <!-- Success Content -->
      <div class="text-center space-y-6">
        <!-- Success Icon -->
        <div class="flex justify-center mb-6">
          <div class="path-option-card cursor-default w-20 h-20 rounded-full flex items-center justify-center">
            <svg class="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <!-- Description -->
        <p class="text-[20px] text-white/80 leading-relaxed max-w-[600px] mx-auto mb-8">
          Your sovereign identity is ready. You can now log in and start your journey as a noderunner.
        </p>

        <!-- Features Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-[700px] mx-auto">
          <div class="path-option-card cursor-default py-6">
            <svg class="w-10 h-10 mx-auto mb-3 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 class="text-sm font-semibold text-white/90">Sovereign Identity</h3>
          </div>

          <div class="path-option-card cursor-default py-6">
            <svg class="w-10 h-10 mx-auto mb-3 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h3 class="text-sm font-semibold text-white/90">Encrypted Backup</h3>
          </div>

          <div class="path-option-card cursor-default py-6">
            <svg class="w-10 h-10 mx-auto mb-3 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <h3 class="text-sm font-semibold text-white/90">Ready to Use</h3>
          </div>
        </div>

        <!-- Go to Login Button -->
        <button
          @click="goToLogin"
          class="path-action-button path-action-button--continue mx-auto"
        >
          Go to Login
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goToLogin() {
  router.push('/login')
}
</script>

