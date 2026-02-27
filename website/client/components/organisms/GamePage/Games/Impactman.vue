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

      <!-- STATE A: No user logged in — big QR -->
      <template v-if="!store.loggedInUser">
        <div class="flex flex-col items-center">
          <div class="bg-white/95 rounded-xl p-3 shadow-lg">
            <img :src="loginQrUrl" alt="Scan to Play" class="w-32 h-32 rounded" />
          </div>
          <p class="heartbeat font-retro text-[#D9FF69] text-2xl mt-3 tracking-wide">SCAN TO PLAY</p>
          <p class="text-white/50 text-xs mt-1">Scan with your phone camera</p>
        </div>
      </template>

      <!-- STATE B: User logged in, no token used yet -->
      <template v-else-if="!store.readyToPlay">
        <div class="logged-in-badge bg-[#D9FF69] rounded-lg px-5 py-2 mb-3 shadow-lg text-center border-2 border-[#16114F]">
          <p class="text-[#16114F] font-bold text-sm">Welcome back, {{ store.loggedInUser.name }}!</p>
        </div>

        <div class="flex items-center gap-3 mb-3">
          <p class="retro-blink font-retro text-lg tracking-wide">ADD TOKENS</p>
          <div class="bg-white/95 rounded-lg p-1.5 shadow-lg">
            <img :src="loginQrUrl" alt="Add Tokens QR" class="w-12 h-12 rounded" />
          </div>
        </div>

        <button
          disabled
          class="button-play font-retro uppercase py-3 px-12 border-4 border-[#16114F] text-4xl bg-[#4A4580] text-center rounded-xl">
          <span class="text-play">Play</span>
        </button>
      </template>

      <!-- STATE C: User logged in, ready to play -->
      <template v-else>
        <div class="logged-in-badge bg-[#D9FF69] rounded-lg px-5 py-2 mb-3 shadow-lg text-center border-2 border-[#16114F]">
          <p class="text-[#16114F] font-bold text-sm">Welcome back, {{ store.loggedInUser.name }}!</p>
          <p class="text-[#16114F]/80 text-xs font-bold">PRESS PLAY!</p>
        </div>

        <button
          @click="() => store.StartGame()"
          class="button-play button-flash font-retro uppercase py-3 px-12 border-4 border-[#16114F] text-4xl bg-purple text-center rounded-xl">
          <span class="text-play">Play</span>
        </button>

        <div class="flex items-center gap-2 mt-3">
          <div class="bg-white/95 rounded-lg p-1.5 shadow-lg text-center">
            <img :src="loginQrUrl" alt="Switch user QR" class="w-10 h-10 rounded" />
          </div>
          <p class="text-white/40 text-[10px]">Not you?<br>Scan here</p>
        </div>
      </template>

      <div class="text-[#FCF252] text-center font-bold whitespace-nowrap mt-4 text-sm">
        WARNING: THIS GAME REMOVES REAL-WORLD OCEAN PLASTIC!
      </div>
    </div>
    <!-- Offline indicator -->
    <div v-if="!isOnline" class="absolute top-3 right-3 bg-red-500/90 text-white text-xs font-bold px-3 py-1 rounded-full">
      OFFLINE
    </div>
    <MoleculesGamePageEggScreen />
  </AtomsBox>
</template>

<script lang="ts" setup>
import { useGameStore } from '~~/store/game';
import { useConsoleSocket } from '~~/composables/useConsoleSocket';

const store = useGameStore()
const { connect, send, on, disconnect } = useConsoleSocket()
const isOnline = ref(true)

const config = useRuntimeConfig()
const route = useRoute()

// Console identification — prefer URL param, then localStorage, then default
const consoleId = ref(process.client
  ? ((route.query.console as string) || localStorage.getItem('consoleId') || 'IMP-001')
  : 'IMP-001')
const raspiId = ref(process.client
  ? ((route.query.raspi as string) || localStorage.getItem('raspiId') || 'RPI-001')
  : 'RPI-001')

const apiBase = config.public.apiBase || 'http://localhost:3001'

// Login QR URL - links to unified play page
const loginQrUrl = computed(() => {
  const baseUrl = process.client ? window.location.origin : ''
  const playUrl = `${baseUrl}/play/${consoleId.value}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(playUrl)}`
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
  // Spacebar or Enter to start game — only when a token has been used
  if ((e.code === 'Space' || e.code === 'Enter') && store.global.gameScreen === 'menu' && store.readyToPlay) {
    e.preventDefault()
    store.StartGame()
    setTimeout(focusCanvas, 100)
  }

  // Keep canvas focused during gameplay
  if (store.global.gameScreen === 'playing') {
    focusCanvas()
  }
}

const APP_VERSION = 'v2.1.0 — QR Unified Dashboard'

// Load user and setup on mount
onMounted(() => {
  if (process.client) {
    console.log(
      `%c 🕹️ Impact-man ${APP_VERSION} `,
      'background: #D9FF69; color: #16114F; font-size: 16px; font-weight: bold; padding: 6px 12px; border-radius: 4px;'
    )
    console.log(
      `%c Console: ${consoleId.value} | ${new Date().toLocaleString()} `,
      'background: #16114F; color: #D9FF69; font-size: 11px; padding: 3px 8px; border-radius: 2px;'
    )

    // Clear any stale user — both locally AND on the API server.
    // Without the server reset, the login poll would immediately restore a stale user.
    store.clearUser()
    store.readyToPlay = false
    $fetch(`${apiBase}/api/consoles/${consoleId.value}/reset`, { method: 'POST' }).catch(() => {})

    // Persist console ID to localStorage for other pages
    localStorage.setItem('consoleId', consoleId.value)
    localStorage.setItem('raspiId', raspiId.value)

    // Connect to WebSocket as this console
    connect(consoleId.value)

    // Add keyboard listener for arcade controls
    window.addEventListener('keydown', handleKeydown)

    // Auto-focus canvas periodically to ensure keyboard input works
    const focusInterval = setInterval(() => {
      if (store.global.gameScreen === 'playing') {
        focusCanvas()
      }
    }, 500)

    // Track online/offline status
    isOnline.value = navigator.onLine
    const onOnline = () => { isOnline.value = true }
    const onOffline = () => { isOnline.value = false }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    // Poll for logged-in user as fallback (in case WebSocket doesn't connect)
    const loginPollInterval = setInterval(async () => {
      // Only poll when no user is logged in and on the menu screen
      if (!store.loggedInUser && store.global.gameScreen === 'menu') {
        try {
          const res = await $fetch<any>(`${apiBase}/api/consoles/${consoleId.value}/logged-in-user`)
          if (res.user) {
            store.loggedInUser = res.user
          }
        } catch (e) {
          // Silently fail — WebSocket is the primary mechanism
        }
      }
    }, 3000)

    // Poll for pending game (readyToPlay) as fallback when WebSocket is down
    const pendingGamePollInterval = setInterval(async () => {
      if (store.readyToPlay || store.global.gameScreen !== 'menu') return
      if (!store.loggedInUser) return
      try {
        const res = await $fetch<any>(`${apiBase}/api/consoles/${consoleId.value}/pending-game`)
        if (res.pending) {
          store.readyToPlay = true
        }
      } catch (_) {}
    }, 3000)

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeydown)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      clearInterval(focusInterval)
      clearInterval(loginPollInterval)
      clearInterval(pendingGamePollInterval)
      disconnect()
    })
  }
})

// Reset readyToPlay when game actually starts
watch(() => store.global.gameScreen, (screen) => {
  if (screen === 'playing') {
    store.readyToPlay = false
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

.heartbeat
  animation: heartbeat 2s ease-in-out infinite
  text-shadow: 0 0 8px rgba(217, 255, 105, 0.4)

@keyframes heartbeat
  0%
    transform: scale(1)
    text-shadow: 0 0 8px rgba(217, 255, 105, 0.4)
  7%
    transform: scale(1.15)
    text-shadow: 0 0 16px rgba(217, 255, 105, 0.8)
  14%
    transform: scale(1)
    text-shadow: 0 0 8px rgba(217, 255, 105, 0.4)
  21%
    transform: scale(1.15)
    text-shadow: 0 0 16px rgba(217, 255, 105, 0.8)
  28%
    transform: scale(1)
    text-shadow: 0 0 8px rgba(217, 255, 105, 0.4)
  100%
    transform: scale(1)
    text-shadow: 0 0 8px rgba(217, 255, 105, 0.4)

.retro-blink
  animation: retro-blink 0.8s steps(1) infinite
  text-shadow: 0 0 8px rgba(217, 255, 105, 0.6)

@keyframes retro-blink
  0%, 100%
    color: #D9FF69
  50%
    color: #FFFFFF
</style>

