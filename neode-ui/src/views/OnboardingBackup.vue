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
      <div class="text-center mb-6 flex-shrink-0">
        <h1 class="text-[26px] font-semibold text-white/96 mb-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
          Backup Your Identity
        </h1>
        <p class="text-sm text-white/75 leading-relaxed max-w-[600px] mx-auto">
          Create a secure backup of your identity. Set a passphrase and download your encrypted backup file.
        </p>
      </div>

      <!-- Content Area -->
      <div class="flex flex-col items-center gap-6 mb-6">
        <div class="w-full max-w-[600px] space-y-6">
          <!-- Passphrase Input -->
          <div class="path-option-card cursor-default px-6 py-6">
            <div class="text-left w-full">
              <label class="block text-sm font-semibold text-white/80 mb-3 uppercase tracking-wide">
                Backup Passphrase
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg class="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  v-model="passphrase"
                  type="password"
                  placeholder="Enter a strong passphrase"
                  class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 pl-12 text-white/95 placeholder-white/40 focus:outline-none focus:border-white/30 focus:bg-black/50 transition-all"
                />
              </div>
              <div class="flex items-start gap-2 mt-3 text-xs text-white/60">
                <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Keep this passphrase safe. You'll need it to restore your identity from backup.</span>
              </div>
            </div>
          </div>

          <!-- Download Button -->
          <button
            @click="downloadBackup"
            :disabled="!passphrase || isDownloading"
            class="path-action-button path-action-button--continue w-full"
          >
            <span v-if="!isDownloading && !downloaded">Download Backup</span>
            <span v-else-if="isDownloading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Downloading...
            </span>
            <span v-else class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Downloaded
            </span>
          </button>

          <!-- Success Message -->
          <div v-if="downloaded" class="text-center">
            <p class="text-sm text-white/70">
              Backup saved as <span class="font-mono text-white/90">neode-did-backup.json</span>
            </p>
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
          @click="proceed"
          :disabled="!passphrase"
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
const passphrase = ref('')
const isDownloading = ref(false)
const downloaded = ref(false)

async function downloadBackup() {
  if (!passphrase.value) return
  
  isDownloading.value = true
  
  // Simulate backup creation
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Get DID from localStorage
  const didStateStr = localStorage.getItem('neode_did_state')
  const didState = didStateStr ? JSON.parse(didStateStr) : { did: 'did:key:unknown', kid: 'kid:mock' }
  
  // Create backup data
  const backupData = {
    version: '1.0',
    did: didState.did,
    kid: didState.kid,
    encrypted: true,
    timestamp: new Date().toISOString(),
    // In production, this would be properly encrypted with the passphrase
    note: 'This is a mock backup. In production, this would contain encrypted key material.'
  }
  
  // Create and download file
  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'neode-did-backup.json'
  a.click()
  URL.revokeObjectURL(a.href)
  
  downloaded.value = true
  isDownloading.value = false
  
  // Store passphrase hint (not the actual passphrase!)
  localStorage.setItem('neode_backup_created', '1')
}

function proceed() {
  router.push('/onboarding/verify')
}

function skipForNow() {
  router.push('/onboarding/verify')
}
</script>

