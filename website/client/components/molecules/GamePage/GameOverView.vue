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

          <!-- Right side: QR Code -->
          <div class="rounded-xl w-full h-full bg-white p-6 flex flex-col items-center justify-center">
            <!-- Loading state -->
            <div v-if="loading" class="text-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16114F] mx-auto mb-4"></div>
              <p class="text-[#16114F] font-bold">Generating your code...</p>
            </div>

            <!-- Error state -->
            <div v-else-if="error" class="text-center">
              <p class="text-red-500 mb-4">{{ error }}</p>
              <button @click="createSession" class="bg-[#16114F] text-white px-4 py-2 rounded-lg">
                Try Again
              </button>
            </div>

            <!-- Logged-in user: score auto-saved -->
            <div v-else-if="gameStore.loggedInUser && scoreSaved" class="text-center w-full">
              <h3 class="text-xl font-bold text-[#16114F] mb-2">Score Saved!</h3>
              <p class="text-gray-600 text-sm mb-4">Nice game, {{ gameStore.loggedInUser.name }}!</p>

              <div class="bg-[#D9FF69] rounded-xl p-4 mb-4">
                <p class="text-[#16114F] font-bold text-lg">{{ gameStore.global.currentScore.toLocaleString() }} pts</p>
                <p class="text-[#16114F]/70 text-sm">Level {{ gameStore.global.currentLevel }} &bull; {{ gameStore.global.currentBags }} bags</p>
              </div>

              <button
                @click="navigateTo(`/dashboard/${gameStore.loggedInUser.id}`)"
                class="text-[#16114F] underline text-sm font-bold"
              >
                View Dashboard
              </button>
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

              <!-- Console Info (internal) -->
              <div class="text-xs text-gray-400 mt-4 border-t pt-4">
                <p>Console: {{ consoleId }} | Raspi: {{ raspiId }}</p>
                <p class="mt-1">Session: {{ sessionCode }}</p>
              </div>
            </div>

            <!-- Play Again button -->
            <button
              @click="PlayAgain"
              class="mt-6 bg-purple text-white px-12 py-4 rounded-xl font-bold text-2xl hover:bg-[#a855f7] transition border-4 border-[#16114F] shadow-[0_8px_0_#16114F] active:shadow-none active:translate-y-2"
            >
              Play Again
            </button>
            <p class="text-gray-500 text-sm mt-3">Press SPACE to continue</p>
          </div>
        </div>
      </div>
    </div>
  </MoleculesGamePageModal>
</template>

<script lang="ts" setup>
import { useGameStore } from '~~/store/game';
import NicePage from './NicePage.vue';

const config = useRuntimeConfig()
const show = ref(true)
const gameStore = useGameStore()

// Session state
const loading = ref(true)
const error = ref<string | null>(null)
const sessionCode = ref<string | null>(null)
const qrCodeUrl = ref<string>('')
const scoreSaved = ref(false)

// Console identification (can be set via env or passed from Pi)
const consoleId = ref(process.client ? (localStorage.getItem('consoleId') || 'IMP-001') : 'IMP-001')
const raspiId = ref(process.client ? (localStorage.getItem('raspiId') || 'RPI-001') : 'RPI-001')

// Computed claim URL
const claimUrl = computed(() => {
  if (!sessionCode.value) return ''
  const baseUrl = process.client ? window.location.origin : ''
  return `${baseUrl}/claim/${sessionCode.value}`
})

// Handle keyboard events for arcade cabinet
const handleKeydown = (e: KeyboardEvent) => {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault()
    PlayAgain()
  }
}

// Save or create session on mount
onMounted(() => {
  if (gameStore.loggedInUser) {
    saveScoreForUser()
  } else {
    createSession()
  }

  // Add keyboard listener for arcade controls
  if (process.client) {
    window.addEventListener('keydown', handleKeydown)
  }
})

// Cleanup
onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('keydown', handleKeydown)
  }
})

async function saveScoreForUser() {
  loading.value = true
  error.value = null

  try {
    const apiBase = config.public.apiBase || 'http://localhost:3001'
    const userId = gameStore.loggedInUser!.id

    const res = await $fetch<any>(`${apiBase}/api/users/${userId}/scores`, {
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

    scoreSaved.value = true

    // Update local user data
    if (res.user) {
      gameStore.loggedInUser = res.user
      localStorage.setItem('impactarcade_user', JSON.stringify(res.user))
    }
  } catch (e: any) {
    console.error('Failed to save score:', e)
    // Fallback to session flow
    createSession()
  } finally {
    loading.value = false
  }
}

async function createSession() {
  loading.value = true
  error.value = null

  try {
    const apiBase = config.public.apiBase || 'http://localhost:3001'

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

    // Generate QR code using Google Charts API (simple, no library needed)
    const qrData = encodeURIComponent(claimUrl.value)
    qrCodeUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`

  } catch (e: any) {
    console.error('Failed to create session:', e)
    error.value = 'Failed to generate QR code. Please try again.'
  } finally {
    loading.value = false
  }
}

const PlayAgain = () => {
  // Clear logged-in user so next person must scan QR
  gameStore.clearUser()

  // Clear console login on API
  const apiBase = config.public.apiBase || 'http://localhost:3001'
  $fetch(`${apiBase}/api/consoles/${consoleId.value}/logged-in-user`, {
    method: 'DELETE',
  }).catch(() => {})

  // Reset game state
  gameStore.$patch({
    global: {
      gameScreen: 'menu',
      currentScore: 0,
      currentLevel: 1,
      currentLives: 3,
      currentBags: 0,
    }
  })

  // Tell Unity to restart
  if (gameStore.unityInstance) {
    gameStore.unityInstance.SendMessage("StartManager", "LoadGame")
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
</style>
