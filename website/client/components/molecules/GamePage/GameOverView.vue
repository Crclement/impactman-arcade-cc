<template>
  <MoleculesGamePageModal v-model="show" class="w-full h-full relative z-100 mx-auto">
    <div class="mx-4 md:mx-10">
      <div class="flex flex-column">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <!-- Left side: Score display -->
          <div class="rounded-xl w-full h-full bg-gradient-pink p-6">
            <NicePage />
            <MoleculesGamePageScoreView />
          </div>

          <!-- Right side -->
          <div class="rounded-xl w-full h-full bg-white p-6 flex flex-col items-center justify-center">
            <!-- Loading state -->
            <div v-if="loading" class="text-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16114F] mx-auto mb-4"></div>
              <p class="text-[#16114F] font-bold">Saving your score...</p>
            </div>

            <!-- Error state -->
            <div v-else-if="error" class="text-center">
              <p class="text-red-500 mb-4">{{ error }}</p>
              <button @click="createSession" class="bg-[#16114F] text-white px-4 py-2 rounded-lg">
                Try Again
              </button>
            </div>

            <!-- Logged-in user: score auto-saved, waiting for phone -->
            <div v-else-if="gameStore.loggedInUser && scoreSaved" class="text-center w-full">
              <h3 class="text-xl font-bold text-[#16114F] mb-2">{{ savedOffline ? 'Score Saved Locally' : 'Score Saved!' }}</h3>
              <p v-if="savedOffline" class="text-amber-600 text-xs mb-2">Will sync when connection returns</p>
              <p class="text-gray-600 text-sm mb-4">Nice game, {{ gameStore.loggedInUser.name }}!</p>

              <div class="bg-[#D9FF69] rounded-xl p-4 mb-4">
                <p class="text-[#16114F] font-bold text-lg">{{ gameStore.global.currentScore.toLocaleString() }} pts</p>
                <p class="text-[#16114F]/70 text-sm">Level {{ gameStore.global.currentLevel }} &bull; {{ gameStore.global.currentBags }} bags</p>
              </div>

              <!-- Waiting for phone to trigger replay -->
              <div v-if="!readyToPlay" class="mt-4">
                <p class="text-[#16114F]/60 text-sm mb-3">Use a token on your phone to play again</p>
                <div class="flex items-center justify-center gap-2 text-[#16114F]/40">
                  <div class="w-2 h-2 bg-[#16114F]/30 rounded-full animate-bounce"></div>
                  <div class="w-2 h-2 bg-[#16114F]/30 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                  <div class="w-2 h-2 bg-[#16114F]/30 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                </div>
              </div>

              <!-- Ready to play (phone triggered it) -->
              <div v-else class="mt-4">
                <button
                  @click="startGame"
                  class="button-flash bg-purple text-white px-12 py-4 rounded-xl font-bold text-2xl transition border-4 border-[#16114F] shadow-[0_8px_0_#16114F] active:shadow-none active:translate-y-2"
                >
                  Play
                </button>
                <p class="text-[#00DC82] text-sm font-bold mt-3">Token used — press Play!</p>
              </div>

              <!-- Divider -->
              <div class="border-t border-gray-200 mt-6 pt-4 w-full">
                <p class="text-gray-400 text-xs mb-3">New player? Scan to start</p>
                <div class="bg-white rounded-lg p-2 shadow inline-block">
                  <img :src="loginQrUrl" alt="Login QR" class="w-20 h-20" />
                </div>
                <p class="text-gray-400 text-xs mt-3">Press SPACE for new player</p>
              </div>
            </div>

            <!-- Guest: QR Code display -->
            <div v-else-if="sessionCode" class="text-center w-full">
              <h3 class="text-xl font-bold text-[#16114F] mb-2">Save Your Score!</h3>
              <p class="text-gray-600 text-sm mb-4">Scan to link this game to your account</p>

              <!-- QR Code Image -->
              <div class="bg-white p-4 rounded-xl shadow-lg inline-block mb-4">
                <img :src="qrCodeUrl" alt="QR Code" class="w-48 h-48 mx-auto" />
              </div>

              <!-- Session Code -->
              <div class="bg-gray-100 rounded-lg p-3 mb-4">
                <p class="text-xs text-gray-500 mb-1">Or visit:</p>
                <p class="font-mono text-lg font-bold text-[#16114F]">{{ claimUrl }}</p>
                <p class="font-mono text-2xl font-bold text-[#00DC82] mt-1">{{ sessionCode }}</p>
              </div>

              <p class="text-gray-400 text-xs mt-2">Press SPACE to continue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MoleculesGamePageModal>
</template>

<script lang="ts" setup>
import { useGameStore } from '~~/store/game';
import { useConsoleSocket } from '~~/composables/useConsoleSocket';
import { useOfflineQueue } from '~~/composables/useOfflineQueue';
import NicePage from './NicePage.vue';

const show = ref(true)
const gameStore = useGameStore()
const { on, send } = useConsoleSocket()
const { enqueue, startAutoSync, stopAutoSync } = useOfflineQueue()
const savedOffline = ref(false)

// Session state
const loading = ref(true)
const error = ref<string | null>(null)
const sessionCode = ref<string | null>(null)
const qrCodeUrl = ref<string>('')
const scoreSaved = ref(false)
const readyToPlay = ref(false)

const route = useRoute()

// Console identification — prefer URL param, then localStorage, then default
const consoleId = ref(process.client
  ? ((route.query.console as string) || localStorage.getItem('consoleId') || 'IMP-001')
  : 'IMP-001')
const raspiId = ref(process.client
  ? ((route.query.raspi as string) || localStorage.getItem('raspiId') || 'RPI-001')
  : 'RPI-001')

const apiBase = resolveApiBase()

// Login QR for new players - links to unified play page
const loginQrUrl = computed(() => {
  const baseUrl = process.client ? window.location.origin : ''
  const playUrl = `${baseUrl}/play/${consoleId.value}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(playUrl)}`
})

// Claim URL for guest sessions
const claimUrl = computed(() => {
  if (!sessionCode.value) return ''
  const baseUrl = process.client ? window.location.origin : ''
  return `${baseUrl}/claim/${sessionCode.value}`
})

// Handle keyboard
const handleKeydown = (e: KeyboardEvent) => {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault()
    if (readyToPlay.value) {
      startGame()
    } else {
      returnToMenu()
    }
  }
}

// Save or create session on mount
let cleanupReadyToPlay: (() => void) | null = null
let autoReturnTimer: ReturnType<typeof setTimeout> | null = null
let pendingGamePoll: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (gameStore.loggedInUser) {
    saveScoreForUser()
  } else {
    createSession()
  }

  if (process.client) {
    window.addEventListener('keydown', handleKeydown)
    startAutoSync()

    // Listen for readyToPlay via WebSocket (phone triggered replay)
    cleanupReadyToPlay = on('readyToPlay', () => {
      readyToPlay.value = true
      // Reset auto-return timer when phone triggers replay
      if (autoReturnTimer) clearTimeout(autoReturnTimer)
    })

    // Poll for pending game as fallback (in case WebSocket is down)
    pendingGamePoll = setInterval(async () => {
      if (readyToPlay.value) return
      try {
        const res = await $fetch<any>(`${apiBase}/api/consoles/${consoleId.value}/pending-game`)
        if (res.pending) {
          readyToPlay.value = true
          if (autoReturnTimer) clearTimeout(autoReturnTimer)
        }
      } catch (_) {}
    }, 3000)

    // Auto-return to menu after 60 seconds of inactivity
    // This ensures the arcade resets if a player walks away
    autoReturnTimer = setTimeout(() => {
      if (!readyToPlay.value) {
        returnToMenu()
      }
    }, 60_000)
  }
})

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('keydown', handleKeydown)
    stopAutoSync()
    if (cleanupReadyToPlay) {
      cleanupReadyToPlay()
      cleanupReadyToPlay = null
    }
    if (autoReturnTimer) {
      clearTimeout(autoReturnTimer)
      autoReturnTimer = null
    }
    if (pendingGamePoll) {
      clearInterval(pendingGamePoll)
      pendingGamePoll = null
    }
  }
})

async function saveScoreForUser() {
  loading.value = true
  error.value = null

  try {
    const userId = gameStore.loggedInUser!.id

    const token = process.client ? localStorage.getItem('impactarcade_token') : null

    const res = await $fetch<any>(`${apiBase}/api/users/${userId}/scores`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: {
        consoleId: consoleId.value,
        raspiId: raspiId.value,
        score: gameStore.global.currentScore,
        level: gameStore.global.currentLevel,
        bags: gameStore.global.currentBags,
        plasticRemoved: gameStore.global.currentBags * 0.1,
      },
    })

    scoreSaved.value = true

    // Update local user data
    if (res.user) {
      gameStore.loggedInUser = res.user
    }
  } catch (e: any) {
    // Enqueue for offline sync
    const token = process.client ? localStorage.getItem('impactarcade_token') : null
    enqueue(`${apiBase}/api/users/${gameStore.loggedInUser!.id}/scores`, 'POST', {
      consoleId: consoleId.value,
      raspiId: raspiId.value,
      score: gameStore.global.currentScore,
      level: gameStore.global.currentLevel,
      bags: gameStore.global.currentBags,
      plasticRemoved: gameStore.global.currentBags * 0.1,
    }, token ? { Authorization: `Bearer ${token}` } : {})
    scoreSaved.value = true
    savedOffline.value = true
  } finally {
    loading.value = false
  }
}

async function createSession() {
  loading.value = true
  error.value = null

  try {
    const res = await $fetch<any>(`${apiBase}/api/sessions`, {
      method: 'POST',
      body: {
        consoleId: consoleId.value,
        raspiId: raspiId.value,
        score: gameStore.global.currentScore,
        level: gameStore.global.currentLevel,
        bags: gameStore.global.currentBags,
        plasticRemoved: gameStore.global.currentBags * 0.1,
      },
    })

    sessionCode.value = res.code
    const qrData = encodeURIComponent(claimUrl.value)
    qrCodeUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`
  } catch (e: any) {
    // If offline, show a message but don't block the user
    if (!navigator.onLine) {
      error.value = 'You\'re offline. Score will sync when connection returns.'
    } else {
      error.value = 'Failed to generate QR code. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

function startGame() {
  // Clear pending game
  $fetch(`${apiBase}/api/consoles/${consoleId.value}/pending-game`, {
    method: 'DELETE',
  }).catch(() => {})

  // Reset game state (keep user logged in!)
  gameStore.$patch({
    global: {
      gameScreen: 'menu',
      currentScore: 0,
      currentLevel: 1,
      currentLives: 3,
      currentBags: 0,
    }
  })

  // Start Unity game
  if (gameStore.unityInstance) {
    gameStore.unityInstance.SendMessage("StartManager", "LoadGame")
  }

  // Focus canvas
  setTimeout(() => {
    const canvas = document.getElementById('unity-canvas')
    if (canvas) canvas.focus()
  }, 100)
}

function returnToMenu() {
  // Clear user and reload page for a fully clean state
  // (Unity was Quit() at game over, so it can't restart without a reload)
  const token = process.client ? localStorage.getItem('impactarcade_token') : null
  gameStore.clearUser()
  gameStore.readyToPlay = false

  $fetch(`${apiBase}/api/consoles/${consoleId.value}/logged-in-user`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).catch(() => {})

  // Full page reload to restart Unity cleanly
  if (process.client) {
    window.location.reload()
  }
}
</script>

<style lang="sass" scoped>
.nicegame
  @apply relative z-10

.bg-gradient-pink
  background: linear-gradient(180deg, #FFB8D9 0%, #FF8DC7 100%)

.bg-purple
  background-color: #9b5de5

.button-flash
  animation: pulse-glow 1.5s ease-in-out infinite

@keyframes pulse-glow
  0%, 100%
    box-shadow: 0px 8px 0px #16114F
  50%
    box-shadow: 0px 8px 0px #16114F, 0 0 20px #D9FF69, 0 0 40px #D9FF69
</style>
