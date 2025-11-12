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
      <div v-if="!generatedDid" class="text-center flex-shrink-0">
        <h1 class="text-[26px] font-semibold text-white/96 mb-6 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
          Take control of your new identity
        </h1>
        <p class="text-[20px] text-white/75 leading-relaxed max-w-[600px] mx-auto mb-6">
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
          <div class="text-center mb-6">
            <div class="flex justify-center mb-6">
              <div class="path-option-card cursor-default w-20 h-20 rounded-full flex items-center justify-center">
                <svg class="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p class="text-[20px] text-white/80 leading-relaxed max-w-[600px] mx-auto mb-6">
              Your decentralized identifier has been generated
            </p>
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
              <p class="text-base text-white/60">
                This identifier is stored securely on your device
              </p>
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

