<template>
  <div class="min-h-screen flex items-center justify-center p-4 relative z-10">
    <!-- Dark overlay -->
    <div class="absolute inset-0 bg-black/35 z-0 pointer-events-none" />

    <div class="w-full max-w-md relative z-20">
      <!-- Login Card -->
      <div class="glass-card p-8 pt-20 relative login-card">
        <!-- Logo - half in, half out of container -->
        <div class="absolute -top-10 left-1/2 -translate-x-1/2 z-10">
          <div class="logo-gradient-border">
            <img 
              src="/assets/img/logo-neode.png" 
              alt="Neode" 
              class="w-20 h-20"
            />
          </div>
        </div>

        <!-- Title -->
        <h1 class="text-2xl font-semibold text-white/96 text-center mb-8 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
          Welcome to Neode
        </h1>

        <!-- Error Message -->
        <div v-if="error" class="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200 text-sm">
          {{ error }}
        </div>

        <!-- Password Input -->
        <div class="mb-6">
          <label for="password" class="block text-sm font-medium text-white/80 mb-2">
            Password
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="w-full px-4 py-3 bg-transparent border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-colors"
            placeholder="Enter your password"
            @keyup.enter="handleLogin"
            :disabled="loading"
          />
        </div>

        <!-- Login Button -->
        <button
          @click="handleLogin"
          :disabled="loading || !password"
          class="w-full glass-button px-6 py-3 rounded-lg font-medium transition-all hover:bg-black/70 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="!loading">Login</span>
          <span v-else class="flex items-center justify-center">
            <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Logging in...
          </span>
        </button>

        <!-- Footer Links -->
        <div class="mt-6 text-center text-sm text-white/60">
          <a href="#" class="hover:text-white/80 transition-colors">Forgot password?</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'

const router = useRouter()
const store = useAppStore()

const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function handleLogin() {
  if (!password.value) return

  loading.value = true
  error.value = null

  try {
    await store.login(password.value)
    router.push('/dashboard')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed. Please check your password.'
  } finally {
    loading.value = false
  }
}
</script>

