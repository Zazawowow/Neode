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
      <!-- Header -->
      <div v-if="!generatedDid" class="text-center mb-6 flex-shrink-0">
        <h1 class="text-[26px] font-semibold text-white/96 mb-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
          Take control of your new identity
        </h1>
        <p class="text-sm text-white/75 leading-relaxed max-w-[600px] mx-auto">
          Generate a Decentralized Identifier (DID) for secure, passwordless authentication. Your identity, your control.
        </p>
      </div>

      <!-- Content Area -->
      <div class="flex flex-col items-center gap-6 mb-6">
        <!-- Generate Button (if no DID yet) -->
        <button
          v-if="!generatedDid"
          @click="generateDid"
          :disabled="isGenerating"
          class="path-action-button path-action-button--continue"
        >
          <span v-if="!isGenerating">Generate DID</span>
          <span v-else class="flex items-center gap-2">
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </span>
        </button>

        <!-- Generated DID Display -->
        <div v-if="generatedDid" class="w-full max-w-[600px] space-y-4">
          <!-- Success Message -->
          <div class="text-center mb-4">
            <svg class="w-16 h-16 mx-auto mb-3 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 8px rgba(255, 255, 255, 0.3));">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-lg font-semibold text-white/96 mb-1">Identity Created Successfully</p>
            <p class="text-sm text-white/70">Your decentralized identifier has been generated</p>
          </div>

          <!-- DID Display Card -->
          <div class="path-option-card cursor-default px-6 py-6">
            <div class="text-left">
              <h3 class="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">Your DID</h3>
              <div class="bg-black/40 rounded-lg p-4 mb-3 backdrop-blur-sm border border-white/10">
                <p class="text-white/95 font-mono text-sm break-all leading-relaxed">
                  {{ generatedDid }}
                </p>
              </div>
              <div class="flex items-center gap-2 text-xs text-white/60">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>This identifier is stored securely on your device</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-4 max-w-[600px] mx-auto flex-shrink-0">
        <button
          @click="skipForNow"
          class="path-action-button path-action-button--skip"
        >
          Skip
        </button>
        <button
          v-if="generatedDid"
          @click="proceed"
          class="path-action-button path-action-button--continue"
        >
          Continue
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const generatedDid = ref<string>('')
const isGenerating = ref(false)

async function generateDid() {
  isGenerating.value = true
  
  // Simulate DID generation (replace with actual implementation)
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Mock DID generation - in production, this would call the backend
  const mockDid = `did:key:z6Mk${generateRandomString(44)}`
  generatedDid.value = mockDid
  
  // Store in localStorage
  localStorage.setItem('neode_did', mockDid)
  
  isGenerating.value = false
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function proceed() {
  // Store DID state and continue to backup
  if (generatedDid.value) {
    localStorage.setItem('neode_did_state', JSON.stringify({ 
      did: generatedDid.value,
      kid: 'kid:mock' 
    }))
    router.push('/onboarding/backup')
  }
}

function skipForNow() {
  // Skip to backup screen
  router.push('/onboarding/backup')
}
</script>

