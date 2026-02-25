<template>
  <AtomsBox class="h-full bg-white w-fit">
    <AtomsGamePageUnityGame game="impactman" />
    <div class="absolute -bottom-14 flex gap-2 w-full">
      <div v-if="store.global.gameScreen === 'playing'" class="flex gap-2 mb-2">
        <img v-for="i in store.global.currentLives" :key="i" class="w-8 h-8" src="/images/newship.png" />
      </div>

      <div class="ml-auto select-none	">
        <div @click="store.$patch({ sound: false })" v-show="store.sound" class="inline-flex items-center h-full cursor-pointer">
          <span class="font-bold mr-2">SOUND ON</span> <img src="/images/sound/on.png" />
        </div>
        <div @click="store.$patch({ sound: true })" v-show="!store.sound" class="inline-flex items-center h-full cursor-pointer">
          <span class="font-bold mr-2">SOUND OFF</span> <img src="/images/sound/off.png" />
        </div>
      </div>

      <div v-if="store.global.gameScreen === 'playing'" class="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
        <div class="flex gap-2 font-bold font-agrandir text-lg text-[#282828]">
          <span :class="{'text-[#B9B7B7]': store.global.currentLevel < i}" v-for="i in 7">L{{ i }}</span>
        </div>
      </div>

    </div>
    <div v-if="store.global.gameScreen === 'menu'"
      class="absolute left-1/2 -translate-x-1/2 bottom-8 flex flex-col items-center">

      <!-- Logged-in user greeting -->
      <div v-if="store.loggedInUser" class="logged-in-badge bg-[#D9FF69] rounded-lg px-5 py-2 mb-3 shadow-lg text-center border-2 border-[#16114F]">
        <p class="text-[#16114F] font-bold text-sm">{{ store.loggedInUser.name }}</p>
        <p class="text-[#16114F]/60 text-xs">Scores will auto-save</p>
      </div>

      <!-- Play button and QR code inline -->
      <div class="flex items-center gap-4">
        <button
          @click="() => store.StartGame()"
          :class="{ 'button-flash': store.loggedInUser }"
          class="button-play font-retro uppercase py-3 px-12 border-4 border-[#16114F] text-4xl bg-purple text-center rounded-xl">
          <span class="text-play">Play</span>
        </button>

        <!-- QR Code Box (only show if not logged in) -->
        <div v-if="!store.loggedInUser" class="bg-white/95 rounded-lg p-2 shadow-lg">
          <img :src="loginQrUrl" alt="Login QR" class="w-16 h-16 rounded" />
        </div>
      </div>

      <div class="text-[#FCF252] text-center font-bold whitespace-nowrap mt-4 text-sm">
        WARNING: THIS GAME REMOVES REAL-WORLD OCEAN PLASTIC!
      </div>
    </div>
    <MoleculesGamePageEggScreen />
  </AtomsBox>
</template>

<script lang="ts" setup>
import { useGameStore } from '~~/store/game';

const store = useGameStore()

// Console identification
const consoleId = ref(process.client ? (localStorage.getItem('consoleId') || 'IMP-001') : 'IMP-001')
const raspiId = ref(process.client ? (localStorage.getItem('raspiId') || 'RPI-001') : 'RPI-001')

// Login QR URL - links to login page with console info
const loginQrUrl = computed(() => {
  const baseUrl = process.client ? window.location.origin : ''
  const loginUrl = `${baseUrl}/login?console=${consoleId.value}&raspi=${raspiId.value}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(loginUrl)}`
})

// Focus the Unity canvas for keyboard input
const focusCanvas = () => {
  const canvas = document.getElementById('unity-canvas')
  if (canvas) {
    canvas.focus()
  }
}

// Handle keyboard events for arcade cabinet
const handleKeydown = (e: KeyboardEvent) => {
  // Spacebar or Enter to start game when on menu
  if ((e.code === 'Space' || e.code === 'Enter') && store.global.gameScreen === 'menu') {
    e.preventDefault()
    store.StartGame()
    // Focus canvas after starting
    setTimeout(focusCanvas, 100)
  }

  // Keep canvas focused during gameplay
  if (store.global.gameScreen === 'playing') {
    focusCanvas()
  }
}

const config = useRuntimeConfig()

// Poll API for console login (user logs in on phone, arcade detects it)
const pollForLogin = async () => {
  if (store.global.gameScreen !== 'menu' || store.loggedInUser) return
  try {
    const apiBase = config.public.apiBase || 'http://localhost:3001'
    const res = await $fetch<any>(`${apiBase}/api/consoles/${consoleId.value}/logged-in-user`)
    if (res.user && !store.loggedInUser) {
      store.loggedInUser = res.user
    }
  } catch (e) {
    // Silently ignore poll errors
  }
}

// Load user and setup on mount
onMounted(() => {
  if (process.client) {
    store.loadUser()

    // Add keyboard listener for arcade controls
    window.addEventListener('keydown', handleKeydown)

    // Poll API for login changes every 2s
    const loginPoll = setInterval(pollForLogin, 2000)

    // Auto-focus canvas periodically to ensure keyboard input works
    const focusInterval = setInterval(() => {
      if (store.global.gameScreen === 'playing') {
        focusCanvas()
      }
    }, 500)

    // Cleanup on unmount
    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeydown)
      clearInterval(focusInterval)
      clearInterval(loginPoll)
    })
  }
})

// Watch sound state and notify Unity
watch(() => store.sound, (soundOn) => {
  if (store.unityInstance) {
    store.unityInstance.SendMessage("GameManager", "OnWebMessage", JSON.stringify({
      Event: "Sound",
      Payload: { Enabled: soundOn }
    }))
  }
})
</script>

<style lang="sass" scoped>
.text-play
  -webkit-text-stroke: 2px black
  letter-spacing: -4px
  @apply text-white

.button-play
  box-shadow: 0px 8px 0px #16114F

  @apply transition-all

  &:active
    box-shadow: 0px 0px 0px #16114F
    transform: translateY(8px)

.button-flash
  animation: pulse-glow 1.5s ease-in-out infinite

@keyframes pulse-glow
  0%, 100%
    box-shadow: 0px 8px 0px #16114F
  50%
    box-shadow: 0px 8px 0px #16114F, 0 0 20px #D9FF69, 0 0 40px #D9FF69

.logged-in-badge
  animation: slide-in 0.4s ease-out
  box-shadow: 0px 3px 0px #16114F

@keyframes slide-in
  from
    opacity: 0
    transform: translateY(-10px)
  to
    opacity: 1
    transform: translateY(0)
</style>

