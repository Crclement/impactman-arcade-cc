<template>
  <div class="min-h-screen bg-[#16114F] flex flex-col">
    <!-- Header -->
    <div class="p-4 text-center">
      <h1 class="text-[#D9FF69] text-2xl font-bold">Impact Arcade</h1>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col items-center justify-center p-6">
      <!-- Loading -->
      <div v-if="loading" class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-[#D9FF69] border-t-transparent mx-auto mb-4"></div>
        <p class="text-white/70">Connecting to console...</p>
      </div>

      <!-- Console Not Found -->
      <div v-else-if="!consoleConnected" class="text-center">
        <div class="text-6xl mb-4">😢</div>
        <h2 class="text-white text-xl font-bold mb-2">Console Not Ready</h2>
        <p class="text-white/60">Please wait for the game to load</p>
        <button @click="checkConsole" class="mt-6 bg-white/20 text-white px-6 py-3 rounded-xl">
          Try Again
        </button>
      </div>

      <!-- Game Starting -->
      <div v-else-if="gameStarting" class="text-center">
        <div class="text-8xl mb-4 animate-bounce">🎮</div>
        <h2 class="text-[#D9FF69] text-3xl font-bold mb-2">GO!</h2>
        <p class="text-white/70">Press PLAY on the arcade!</p>
      </div>

      <!-- Ready to Play -->
      <div v-else class="text-center w-full max-w-sm">
        <!-- Returning User -->
        <div v-if="user" class="mb-6">
          <div class="text-5xl mb-2">👋</div>
          <h2 class="text-white text-xl font-bold">Welcome back, {{ user.name }}!</h2>
          <p class="text-white/60 text-sm">{{ credits.availablePlays }} plays available</p>
        </div>

        <!-- Guest User -->
        <div v-else class="mb-6">
          <div class="text-5xl mb-2">🎮</div>
          <h2 class="text-white text-2xl font-bold">Ready to Play?</h2>
          <p class="text-[#D9FF69] text-lg font-bold mt-1">First game is FREE!</p>
        </div>

        <!-- Play Button (Guest or Has Credits) -->
        <button
          v-if="!user || credits.availablePlays > 0"
          @click="startGame"
          :disabled="starting"
          class="w-full bg-gradient-to-r from-[#D9FF69] to-[#00DC82] text-[#16114F] text-2xl font-bold py-6 rounded-2xl shadow-lg transform active:scale-95 transition disabled:opacity-50"
        >
          {{ starting ? 'Starting...' : (user ? 'PLAY' : 'PLAY FREE') }}
        </button>

        <!-- Need to Pay -->
        <div v-else class="space-y-4">
          <p class="text-white/70">Add a play credit to continue</p>

          <!-- Apple Pay Button -->
          <div v-if="applePaySupported" id="apple-pay-button" class="w-full"></div>

          <!-- Fallback -->
          <div v-else class="bg-white/10 rounded-xl p-4 text-center">
            <p class="text-white/60 text-sm">Apple Pay not available</p>
          </div>
        </div>

        <!-- Error -->
        <p v-if="error" class="mt-4 text-red-400 text-sm">{{ error }}</p>

        <!-- Sign in prompt for guests after play -->
        <div v-if="!user && showSignInPrompt" class="mt-8 bg-white/10 rounded-xl p-4">
          <p class="text-white/80 text-sm mb-3">Save your scores?</p>
          <button
            @click="signInWithApple"
            class="w-full bg-black text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Sign in with Apple
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="p-4 text-center">
      <p class="text-[#D9FF69] text-xs font-bold">
        WARNING: This game removes REAL ocean plastic!
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute()
const config = useRuntimeConfig()

const consoleId = computed(() => route.params.consoleId as string)

const loading = ref(true)
const consoleConnected = ref(false)
const gameStarting = ref(false)
const starting = ref(false)
const error = ref<string | null>(null)
const showSignInPrompt = ref(false)

const user = ref<any>(null)
const credits = ref({ availablePlays: 1, freePlayUsed: false })
const applePaySupported = ref(false)

// Get API base - use tunnel URL if available
const apiBase = computed(() => {
  if (process.client && window.location.hostname.includes('trycloudflare.com')) {
    return 'https://heavy-random-exhibits-alto.trycloudflare.com'
  }
  return config.public.apiBase || 'http://localhost:3001'
})

onMounted(async () => {
  // Check for saved user
  if (process.client) {
    const savedUser = localStorage.getItem('impactarcade_user')
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
        // Fetch credits
        await fetchCredits()
      } catch (e) {
        localStorage.removeItem('impactarcade_user')
      }
    }
  }

  await checkConsole()
  loading.value = false

  // Setup Apple Pay if needed
  if (user.value && credits.value.availablePlays === 0) {
    await setupApplePay()
  }
})

async function checkConsole() {
  try {
    const res = await $fetch<any>(`${apiBase.value}/api/consoles/${consoleId.value}/status`)
    consoleConnected.value = res.connected
  } catch (e) {
    consoleConnected.value = false
  }
}

async function fetchCredits() {
  if (!user.value) return
  try {
    const res = await $fetch<any>(`${apiBase.value}/api/users/${user.value.id}/credits`)
    credits.value = res
  } catch (e) {
    console.error('Failed to fetch credits:', e)
  }
}

async function startGame() {
  starting.value = true
  error.value = null

  try {
    if (user.value) {
      // Logged in user - use credits system
      const res = await $fetch<any>(`${apiBase.value}/api/consoles/${consoleId.value}/start-game`, {
        method: 'POST',
        body: { userId: user.value.id },
      })

      if (res.success) {
        gameStarting.value = true
        credits.value.availablePlays = res.availablePlays
      }
    } else {
      // Guest user - start as guest
      const res = await $fetch<any>(`${apiBase.value}/api/consoles/${consoleId.value}/start-guest`, {
        method: 'POST',
      })

      if (res.success) {
        gameStarting.value = true
        // Store guest session ID for later score claiming
        if (process.client) {
          localStorage.setItem('impactarcade_guest_session', res.guestSessionId)
        }
        // Show sign in prompt after a delay
        setTimeout(() => {
          showSignInPrompt.value = true
        }, 3000)
      }
    }
  } catch (e: any) {
    error.value = e.data?.error || 'Failed to start game'
    if (e.data?.needsPayment) {
      await setupApplePay()
    }
  } finally {
    starting.value = false
  }
}

async function setupApplePay() {
  // Check if Apple Pay is available
  if (process.client && (window as any).ApplePaySession?.canMakePayments()) {
    applePaySupported.value = true
    // Setup Apple Pay button would go here
  }
}

async function signInWithApple() {
  // Apple Sign In implementation
  // For now, fallback to email modal
  const email = prompt('Enter your email to save scores:')
  if (email) {
    try {
      const res = await $fetch<any>(`${apiBase.value}/api/users/login`, {
        method: 'POST',
        body: { email, name: email.split('@')[0] },
      })

      user.value = res.user
      if (process.client) {
        localStorage.setItem('impactarcade_user', JSON.stringify(res.user))
        localStorage.setItem('impactarcade_token', res.token)
      }

      // Claim any guest session
      const guestSession = localStorage.getItem('impactarcade_guest_session')
      if (guestSession) {
        // TODO: Claim guest session scores
        localStorage.removeItem('impactarcade_guest_session')
      }

      showSignInPrompt.value = false
      await fetchCredits()
    } catch (e: any) {
      error.value = e.data?.error || 'Failed to sign in'
    }
  }
}
</script>
