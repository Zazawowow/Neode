<template>
  <Transition name="splash-fade">
    <div v-if="showSplash" class="fixed inset-0 z-[2000] flex items-center justify-center bg-black">
      <!-- Background overlay -->
      <div 
        class="absolute inset-0 opacity-0 transition-opacity duration-1000"
        :class="{ 'opacity-100': showBackground }"
        :style="{ backgroundImage: 'url(/assets/img/bg.jpg)', backgroundSize: 'auto 100vh', backgroundPosition: 'center top', backgroundRepeat: 'no-repeat' }"
      />

      <!-- Alien Intro -->
      <Transition name="fade">
        <div 
          v-if="!alienIntroComplete" 
          class="absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-800"
          :class="{ 'opacity-0': fadeAlienIntro }"
        >
          <div class="font-mono text-white px-5 max-w-[90vw] md:max-w-[1200px] text-[24px] leading-relaxed">
            <div v-if="showLine1" class="flex items-start mb-6 opacity-0" :class="{ 'opacity-100': showLine1 }">
              <span class="text-[#00ff41] mr-6 flex-shrink-0">></span>
              <span class="text-white" :class="{ 'typing-text': typingLine1 }">
                In the future there will be 3 types of humans
              </span>
            </div>
            <div v-if="showLine2" class="flex items-start mb-6 opacity-0" :class="{ 'opacity-100': showLine2 }">
              <span class="text-[#00ff41] mr-6 flex-shrink-0">></span>
              <span class="text-white" :class="{ 'typing-text': typingLine2 }">
                Government Employees
              </span>
            </div>
            <div v-if="showLine3" class="flex items-start mb-6 opacity-0" :class="{ 'opacity-100': showLine3 }">
              <span class="text-[#00ff41] mr-6 flex-shrink-0">></span>
              <span class="text-white" :class="{ 'typing-text': typingLine3 }">
                Corporate Employees
              </span>
            </div>
            <div v-if="showLine4" class="flex items-start mb-12 opacity-0" :class="{ 'opacity-100': showLine4 }">
              <span class="text-[#00ff41] mr-6 flex-shrink-0">></span>
              <span class="text-white" :class="{ 'typing-text': typingLine4 }">
                And Noderunners...
              </span>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Welcome Message -->
      <Transition name="fade">
        <div 
          v-if="showWelcome" 
          class="absolute inset-0 z-[15] flex items-center justify-center font-mono text-4xl md:text-5xl"
          :class="{ 'animate-fade-out': fadeWelcome }"
        >
          <div class="typing-container">
            <span class="text-white" :class="{ 'typing-text': typingWelcome }">
            Welcome Noderunner
          </span>
          </div>
        </div>
      </Transition>

      <!-- Logo - Original NEODE text logo for splash -->
      <Transition name="fade">
        <div v-if="showLogo" class="relative z-20">
          <img 
            src="/assets/img/logo-large.svg" 
            alt="Neode" 
            class="w-[min(60vw,450px)] max-w-[85vw] h-auto filter drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)] m-5 object-contain"
          />
        </div>
      </Transition>

      <!-- Skip Button -->
      <button
        v-if="!alienIntroComplete"
        @click="skipIntro"
        class="absolute bottom-8 right-8 z-20 bg-black/60 border border-white/30 text-white/70 font-mono text-xs px-4 py-2 rounded backdrop-blur-[10px] hover:bg-black/80 hover:text-white/90 hover:border-white/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
      >
        Skip Intro
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emit = defineEmits<{
  complete: []
}>()

const showSplash = ref(true)
const showBackground = ref(false)
const alienIntroComplete = ref(false)
const fadeAlienIntro = ref(false)
const showWelcome = ref(false)
const fadeWelcome = ref(false)
const typingWelcome = ref(false)
const showLogo = ref(false)
const showLine1 = ref(false)
const showLine2 = ref(false)
const showLine3 = ref(false)
const showLine4 = ref(false)
const typingLine1 = ref(false)
const typingLine2 = ref(false)
const typingLine3 = ref(false)
const typingLine4 = ref(false)

// Check if user has seen intro
const seenIntro = localStorage.getItem('neode_intro_seen') === '1'

function skipIntro() {
  // Jump to "Welcome Noderunner" part
  alienIntroComplete.value = true
  fadeAlienIntro.value = true
  showWelcome.value = true
  typingWelcome.value = true
  
  // Stop alien intro typing animations
  typingLine1.value = false
  typingLine2.value = false
  typingLine3.value = false
  typingLine4.value = false
  
  // Continue with welcome fade out after typing (2s) + cursor continues (1.5s) + 3 blinks (1.35s)
  setTimeout(() => {
    fadeWelcome.value = true
    typingWelcome.value = false
  }, 4850)
  
  // Show logo
  setTimeout(() => {
    showWelcome.value = false
    showLogo.value = true
    showBackground.value = true
  }, 5850)
  
  // Complete splash
  setTimeout(() => {
    showSplash.value = false
    document.body.classList.add('splash-complete')
    localStorage.setItem('neode_intro_seen', '1')
    emit('complete')
  }, 9250)
}

function startAlienIntro() {
  // Line 1 - types and blinks
  setTimeout(() => {
    showLine1.value = true
    typingLine1.value = true
  }, 500)

  // Line 2 - wait for line 1 typing (4s) + blinking (1.5s)
  setTimeout(() => {
    typingLine1.value = false
    showLine2.value = true
    typingLine2.value = true
  }, 6000)

  // Line 3 - wait for line 2 typing (4s) + blinking (1.5s)
  setTimeout(() => {
    typingLine2.value = false
    showLine3.value = true
    typingLine3.value = true
  }, 11500)

  // Line 4 - wait for line 3 typing (4s) + blinking (1.5s)
  setTimeout(() => {
    typingLine3.value = false
    showLine4.value = true
    typingLine4.value = true
  }, 17000)

  // Fade out alien intro - wait for line 4 typing (4s) + blinking (1.5s)
  setTimeout(() => {
    typingLine4.value = false
    fadeAlienIntro.value = true
  }, 22500)

  // Show welcome
  setTimeout(() => {
    alienIntroComplete.value = true
    showWelcome.value = true
    typingWelcome.value = true
  }, 23300)

  // Fade out welcome - typing (2s) + cursor continues (1.5s) + 3 blinks (1.35s) = 4.85s
  setTimeout(() => {
    fadeWelcome.value = true
    typingWelcome.value = false
  }, 28150)

  // Show logo (1 second after welcome starts fading)
  setTimeout(() => {
    showWelcome.value = false
    showLogo.value = true
    showBackground.value = true
  }, 29950)

  // Complete splash
  setTimeout(() => {
    showSplash.value = false
    document.body.classList.add('splash-complete')
    localStorage.setItem('neode_intro_seen', '1')
    emit('complete')
  }, 33350)
}

onMounted(() => {
  if (seenIntro) {
    // Skip intro if already seen
    showSplash.value = false
    document.body.classList.add('splash-complete')
    emit('complete')
  } else {
    // Play intro
    startAlienIntro()
  }
})
</script>

<style scoped>
.splash-fade-enter-active,
.splash-fade-leave-active {
  transition: opacity 0.5s ease;
}

.splash-fade-enter-from,
.splash-fade-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Container to keep the typing text centered */
.typing-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 0;
}
</style>

