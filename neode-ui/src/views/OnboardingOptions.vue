<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-6xl w-full">
      <div class="text-center mb-8">
        <div class="logo-gradient-border inline-block mb-8">
          <img 
            src="/assets/img/logo-neode.png" 
            alt="Neode" 
            class="w-20 h-20"
          />
        </div>
        <h1 class="text-4xl font-bold text-white mb-4">Choose Your Setup</h1>
        <p class="text-xl text-white/80">How would you like to get started?</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Fresh Start -->
        <button
          @click="selectOption('fresh')"
          class="glass-card p-8 text-center transition-all hover:-translate-y-1 hover:shadow-glass"
          :class="{ 'bg-white/12 shadow-[0_12px_32px_rgba(0,0,0,0.6),0_0_30px_rgba(255,255,255,0.2)]': selected === 'fresh' }"
        >
          <div class="mb-6">
            <div class="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          <h3 class="text-xl font-semibold text-white mb-3">Fresh Start</h3>
          <p class="text-white/70 text-sm">
            Set up a new server from scratch
          </p>
        </button>

        <!-- Restore Backup -->
        <button
          @click="selectOption('restore')"
          class="glass-card p-8 text-center transition-all hover:-translate-y-1 hover:shadow-glass"
          :class="{ 'bg-white/12 shadow-[0_12px_32px_rgba(0,0,0,0.6),0_0_30px_rgba(255,255,255,0.2)]': selected === 'restore' }"
        >
          <div class="mb-6">
            <div class="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
          </div>
          <h3 class="text-xl font-semibold text-white mb-3">Restore Backup</h3>
          <p class="text-white/70 text-sm">
            Restore from a previous backup
          </p>
        </button>

        <!-- Connect Existing -->
        <button
          @click="selectOption('connect')"
          class="glass-card p-8 text-center transition-all hover:-translate-y-1 hover:shadow-glass"
          :class="{ 'bg-white/12 shadow-[0_12px_32px_rgba(0,0,0,0.6),0_0_30px_rgba(255,255,255,0.2)]': selected === 'connect' }"
        >
          <div class="mb-6">
            <div class="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center">
              <svg class="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
          </div>
          <h3 class="text-xl font-semibold text-white mb-3">Connect Existing</h3>
          <p class="text-white/70 text-sm">
            Connect to an existing Neode server
          </p>
        </button>
      </div>

      <div class="mt-12 text-center">
        <button
          @click="proceed"
          :disabled="!selected"
          class="glass-button px-8 py-4 rounded-lg text-lg font-medium transition-all hover:bg-black/70 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const selected = ref<string | null>(null)

function selectOption(option: string) {
  selected.value = option
}

function proceed() {
  if (selected.value) {
    // Mark onboarding as complete
    localStorage.setItem('neode_onboarding_complete', '1')
    
    // For now, just go to login
    // In a real app, you'd have different flows for each option
    router.push('/login')
  }
}
</script>

