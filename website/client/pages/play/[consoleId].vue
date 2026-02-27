<template>
  <div class="min-h-screen bg-[#16114F] flex flex-col">
    <!-- Header -->
    <div class="p-4 text-center">
      <h1 class="text-[#D9FF69] text-2xl font-bold">Impact-man</h1>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col items-center justify-center p-6">

      <!-- LOADING STATE -->
      <div v-if="state === 'loading'" class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-[#D9FF69] border-t-transparent mx-auto mb-4"></div>
        <p class="text-white/70">Connecting to console...</p>
      </div>

      <!-- CONSOLE ERROR STATE -->
      <div v-else-if="state === 'console-error'" class="text-center">
        <div class="text-6xl mb-4">😢</div>
        <h2 class="text-white text-xl font-bold mb-2">Console Not Ready</h2>
        <p class="text-white/60">Please wait for the game to load</p>
        <button @click="retryConsole" class="mt-6 bg-white/20 text-white px-6 py-3 rounded-xl">
          Try Again
        </button>
      </div>

      <!-- LOGIN STATE (inline, dark-themed) -->
      <div v-else-if="state === 'login'" class="text-center w-full max-w-sm">
        <h2 class="text-white text-2xl font-bold mb-1">Scan. Login. Play.</h2>
        <p class="text-[#D9FF69] text-lg font-bold mb-6">First game is FREE!</p>

        <form @submit.prevent="handleLogin" class="space-y-3">
          <input
            v-model="loginEmail"
            type="email"
            required
            placeholder="your@email.com"
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-[#D9FF69] focus:outline-none"
          />
          <input
            v-model="loginName"
            type="text"
            placeholder="Name (optional)"
            class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-[#D9FF69] focus:outline-none"
          />

          <p v-if="loginError" class="text-red-400 text-sm">{{ loginError }}</p>

          <button
            type="submit"
            :disabled="loginLoading"
            class="w-full bg-gradient-to-r from-[#D9FF69] to-[#00DC82] text-[#16114F] py-4 rounded-xl font-bold text-lg transition disabled:opacity-50"
          >
            {{ loginLoading ? 'Logging in...' : 'Login / Sign Up' }}
          </button>
        </form>

        <p class="text-white/30 text-xs mt-4">We'll create an account if you don't have one yet.</p>
      </div>

      <!-- DASHBOARD STATE (the arcade controller) -->
      <div v-else-if="state === 'dashboard'" class="w-full max-w-sm">
        <!-- User greeting + console connection -->
        <div class="text-center mb-4">
          <p class="text-white/60 text-sm">Hey, <span class="text-white font-bold">{{ user?.name }}</span></p>
          <div class="flex items-center justify-center gap-2 mt-1">
            <span class="w-2 h-2 bg-[#00DC82] rounded-full inline-block animate-pulse"></span>
            <span class="text-[#00DC82] text-xs font-bold">Connected to {{ consoleId }}</span>
          </div>
          <button @click="disconnectConsole" class="text-white/30 text-xs mt-1 hover:text-white/50 transition underline">
            Disconnect from console
          </button>
        </div>

        <!-- Total bags removed -->
        <div class="bg-gradient-to-r from-[#00DC82]/20 to-[#4D8BEC]/20 rounded-2xl p-4 mb-5 border border-white/10 text-center">
          <div class="text-3xl font-bold text-[#D9FF69]">{{ gameStats.totalBags || 0 }}</div>
          <div class="text-white/50 text-xs font-bold uppercase">Total Bags Removed from Ocean</div>
        </div>

        <!-- Token pill -->
        <div class="bg-gradient-to-r from-[#D9FF69] to-[#00DC82] rounded-2xl p-5 mb-5">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-5xl font-bold text-[#16114F]">{{ credits.availablePlays }}</div>
              <div class="text-[#16114F]/70 font-bold text-sm uppercase">Play Tokens</div>
            </div>
            <div class="text-right">
              <div v-if="!credits.freePlayUsed" class="text-[#16114F] font-bold text-sm">First play FREE!</div>
              <div v-else class="text-[#16114F]/60 text-sm">{{ credits.paidCredits }} paid</div>
            </div>
          </div>
        </div>

        <!-- Credit used success (inline) -->
        <div v-if="creditUsed" class="bg-[#00DC82]/20 border border-[#00DC82]/40 rounded-2xl p-4 text-center mb-5">
          <p class="text-[#00DC82] font-bold text-lg">Token Used!</p>
          <p class="text-white font-bold text-sm mt-1">The Play button is now flashing</p>
          <p class="text-white/50 text-sm mt-1">Press PLAY on the arcade to start!</p>
        </div>

        <!-- USE CREDIT button (when credits available and not already used) -->
        <div v-else-if="credits.availablePlays > 0">
          <button
            @click="startGame"
            :disabled="starting"
            :class="[
              'w-full bg-[#9b5de5] text-white py-5 rounded-2xl font-bold text-2xl transition border-4 border-[#16114F] shadow-[0_6px_0_#16114F] active:shadow-none active:translate-y-1.5 mb-2',
              !starting ? 'button-flash' : ''
            ]"
          >
            {{ starting ? 'Starting...' : 'Use Token' }}
          </button>
          <p class="text-white/40 text-xs text-center mb-5">
            This will activate the Play button on the arcade
          </p>
        </div>

        <!-- No credits message -->
        <div v-else class="bg-white/10 rounded-2xl p-4 text-center mb-5">
          <p class="text-white/60 font-bold">No tokens remaining</p>
          <p class="text-white/40 text-sm mt-1">Add a token below to play</p>
        </div>

        <!-- Error from start-game -->
        <p v-if="gameError" class="text-red-400 text-sm text-center mb-4">{{ gameError }}</p>

        <!-- Add Tokens section (always visible) -->
        <div class="bg-white/5 rounded-2xl p-4 mb-5 border border-white/10">
          <p class="text-white/50 text-xs font-bold uppercase mb-3 text-center">Add Tokens</p>

          <!-- Buy Token button (reveals Stripe Payment Element) -->
          <button
            v-if="!showPaymentForm && stripeReady"
            @click="handleBuyToken"
            :disabled="paymentLoading"
            class="w-full bg-white text-[#16114F] py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 mb-3 border border-white/20 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            {{ paymentLoading ? 'Loading...' : 'Buy Token — $1' }}
          </button>

          <!-- Stripe Payment Element (inline) -->
          <div v-if="showPaymentForm" class="mb-3">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00DC82" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span class="text-white/40 text-[10px]">Secured by Stripe</span>
              </div>
              <button @click="cancelPayment" class="text-white/30 text-xs hover:text-white/50">Cancel</button>
            </div>
            <div id="payment-element" class="mb-3"></div>
            <button
              v-if="paymentElementReady"
              @click="confirmPayment"
              :disabled="paymentProcessing"
              class="w-full bg-gradient-to-r from-[#D9FF69] to-[#00DC82] text-[#16114F] py-4 rounded-xl font-bold text-lg transition disabled:opacity-50"
            >
              {{ paymentProcessing ? 'Processing...' : 'Pay $1' }}
            </button>
          </div>

          <!-- Dev: Add Token -->
          <button
            @click="devAddCredit"
            :disabled="devCreditLoading"
            class="w-full border-2 border-dashed border-white/20 text-white/40 py-3 rounded-xl text-sm transition hover:border-white/40 hover:text-white/60 disabled:opacity-50"
          >
            {{ devCreditLoading ? 'Adding...' : 'Dev: Add Token' }}
          </button>

          <div v-if="paymentError" class="text-center text-red-400 text-sm mt-2">{{ paymentError }}</div>
          <div v-if="paymentSuccess" class="text-center text-[#D9FF69] font-bold mt-2">Token added!</div>
          <div v-if="devCreditSuccess" class="text-center text-[#D9FF69] font-bold mt-2">Dev token added!</div>
        </div>

        <!-- Compact stats grid -->
        <div class="grid grid-cols-3 gap-3 mb-5">
          <div class="bg-white/10 rounded-xl p-3 text-center">
            <div class="text-xl font-bold text-white">{{ gameStats.highScore?.toLocaleString() || 0 }}</div>
            <div class="text-[10px] text-white/50 uppercase">High Score</div>
          </div>
          <div class="bg-white/10 rounded-xl p-3 text-center">
            <div class="text-xl font-bold text-[#D9FF69]">{{ gameStats.gamesPlayed || 0 }}</div>
            <div class="text-[10px] text-white/50 uppercase">Games</div>
          </div>
          <div class="bg-white/10 rounded-xl p-3 text-center">
            <div class="text-xl font-bold text-[#00DC82]">L{{ gameStats.bestLevel || 1 }}</div>
            <div class="text-[10px] text-white/50 uppercase">Best Level</div>
          </div>
        </div>

        <!-- Sign out -->
        <button @click="signOut" class="w-full text-white/30 text-xs py-2 hover:text-white/50 transition">
          Sign out
        </button>
      </div>

      <!-- DISCONNECTED STATE (logged in but not connected to a console) -->
      <div v-else-if="state === 'disconnected'" class="text-center w-full max-w-sm">
        <p class="text-white/60 text-sm mb-2">Logged in as <span class="text-white font-bold">{{ user?.name }}</span></p>

        <div class="bg-white/10 rounded-2xl p-6 mb-6 border border-white/10">
          <div class="text-4xl mb-3">📱</div>
          <h2 class="text-white text-xl font-bold mb-2">Disconnected</h2>
          <p class="text-white/50 text-sm">Scan a QR code on an arcade machine to reconnect</p>
        </div>

        <button @click="reconnectConsole" class="w-full bg-gradient-to-r from-[#D9FF69] to-[#00DC82] text-[#16114F] py-4 rounded-xl font-bold text-lg transition mb-3">
          Reconnect to {{ consoleId }}
        </button>

        <button @click="signOut" class="w-full text-white/30 text-xs py-2 hover:text-white/50 transition">
          Sign out
        </button>
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
definePageMeta({
  layout: 'naked'
})

const route = useRoute()
const config = useRuntimeConfig()

const consoleId = computed(() => route.params.consoleId as string)

// State machine
const state = ref<'loading' | 'console-error' | 'login' | 'dashboard' | 'disconnected'>('loading')

// User + auth
const user = ref<any>(null)

// Login form
const loginEmail = ref('')
const loginName = ref('')
const loginLoading = ref(false)
const loginError = ref<string | null>(null)

// Dashboard data
const credits = ref({ freePlayUsed: false, paidCredits: 0, availablePlays: 1 })
const gameStats = ref<any>({ highScore: 0, gamesPlayed: 0, bestLevel: 1, totalBags: 0 })

// Game start
const starting = ref(false)
const gameError = ref<string | null>(null)
const creditUsed = ref(false)

// Stripe payments
const stripeReady = ref(false)
const stripeInstance = ref<any>(null)
const stripeElements = ref<any>(null)
const showPaymentForm = ref(false)
const paymentElementReady = ref(false)
const paymentLoading = ref(false)
const paymentProcessing = ref(false)
const paymentError = ref<string | null>(null)
const paymentSuccess = ref(false)

// Dev credit
const devCreditLoading = ref(false)
const devCreditSuccess = ref(false)

// Credit used poll — detect when arcade consumes the pending game
let creditUsedPollTimer: ReturnType<typeof setInterval> | null = null

function startCreditUsedPoll() {
  stopCreditUsedPoll()
  creditUsedPollTimer = setInterval(async () => {
    try {
      const res = await $fetch<any>(`${apiBase.value}/api/consoles/${consoleId.value}/pending-game`)
      if (!res.pending) {
        // Arcade consumed the credit — game started or expired
        creditUsed.value = false
        stopCreditUsedPoll()
        // Re-fetch credits to show updated count
        await fetchCredits()
      }
    } catch (_) {}
  }, 3000)
}

function stopCreditUsedPoll() {
  if (creditUsedPollTimer) {
    clearInterval(creditUsedPollTimer)
    creditUsedPollTimer = null
  }
}

// API base
const apiBase = computed(() => {
  if (process.client && window.location.hostname.includes('trycloudflare.com')) {
    return 'https://heavy-random-exhibits-alto.trycloudflare.com'
  }
  return config.public.apiBase || 'http://localhost:3001'
})

function getAuthHeaders() {
  const token = process.client ? localStorage.getItem('impactarcade_token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const APP_VERSION = 'v2.1.0 — QR Unified Dashboard'

onMounted(async () => {
  console.log(
    `%c 🕹️ Impact-man ${APP_VERSION} `,
    'background: #D9FF69; color: #16114F; font-size: 16px; font-weight: bold; padding: 6px 12px; border-radius: 4px;'
  )
  console.log(
    `%c Console: ${consoleId.value} | ${new Date().toLocaleString()} `,
    'background: #16114F; color: #D9FF69; font-size: 11px; padding: 3px 8px; border-radius: 2px;'
  )

  // Check for saved user
  if (process.client) {
    const savedUser = localStorage.getItem('impactarcade_user')
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (e) {
        localStorage.removeItem('impactarcade_user')
      }
    }
  }

  // Check console connectivity
  const connected = await checkConsole()
  if (!connected) {
    state.value = 'console-error'
    return
  }

  // Route to login or dashboard
  if (user.value) {
    await loadDashboardData()
    // If loadDashboardData triggered signOut (stale user), stay on login
    if (!user.value) return
    state.value = 'dashboard'
    if (process.client) await initializeStripe()
  } else {
    state.value = 'login'
  }
})

// ── Console check ──

async function checkConsole(): Promise<boolean> {
  try {
    const res = await $fetch<any>(`${apiBase.value}/api/consoles/${consoleId.value}/status`)
    return res.connected
  } catch (e) {
    return false
  }
}

async function retryConsole() {
  state.value = 'loading'
  const connected = await checkConsole()
  if (connected) {
    if (user.value) {
      await loadDashboardData()
      state.value = 'dashboard'
    } else {
      state.value = 'login'
    }
  } else {
    state.value = 'console-error'
  }
}

// ── Login ──

async function handleLogin() {
  loginLoading.value = true
  loginError.value = null

  try {
    const res = await $fetch<any>(`${apiBase.value}/api/users/login`, {
      method: 'POST',
      body: {
        email: loginEmail.value,
        name: loginName.value || undefined,
      },
    })

    user.value = res.user
    if (process.client) {
      localStorage.setItem('impactarcade_token', res.token)
      localStorage.setItem('impactarcade_user', JSON.stringify(res.user))
    }

    // Notify console
    try {
      await $fetch<any>(`${apiBase.value}/api/consoles/${consoleId.value}/login`, {
        method: 'POST',
        body: { userId: res.user.id },
      })
    } catch (e) {
      // Non-critical
    }

    // Fetch dashboard data then transition
    await loadDashboardData()
    state.value = 'dashboard'
    if (process.client) await initializeStripe()
  } catch (e: any) {
    loginError.value = e.data?.error || 'Failed to login. Please try again.'
  } finally {
    loginLoading.value = false
  }
}

// ── Dashboard data ──

async function loadDashboardData() {
  if (!user.value) return
  await Promise.all([fetchCredits(), fetchScores()])
}

async function fetchCredits() {
  if (!user.value) return
  try {
    const res = await $fetch<any>(`${apiBase.value}/api/users/${user.value.id}/credits`)
    credits.value = res
  } catch (e: any) {
    if (e.status === 404) {
      signOut()
      return
    }
  }
}

async function fetchScores() {
  if (!user.value) return
  try {
    const res = await $fetch<any>(`${apiBase.value}/api/users/${user.value.id}/scores`)
    if (res.scores && res.scores.length > 0) {
      gameStats.value = {
        highScore: Math.max(...res.scores.map((s: any) => s.score || 0)),
        gamesPlayed: res.scores.length,
        bestLevel: Math.max(...res.scores.map((s: any) => s.level || 1)),
        totalBags: res.scores.reduce((sum: number, s: any) => sum + (s.bags || 0), 0),
      }
    }
  } catch (_) {
    // silent — stats will show defaults
  }
}

// ── Start game ──

async function startGame() {
  starting.value = true
  gameError.value = null

  try {
    const res = await $fetch<any>(`${apiBase.value}/api/consoles/${consoleId.value}/start-game`, {
      method: 'POST',
      body: { userId: user.value.id },
    })

    if (res.success) {
      credits.value.availablePlays = res.availablePlays
      if (res.creditsRemaining !== undefined) {
        credits.value.paidCredits = res.creditsRemaining
      }
      creditUsed.value = true
      // Auto-dismiss the "Token Used!" message after 5 seconds
      setTimeout(() => { creditUsed.value = false }, 5000)
      // Poll until arcade consumes the credit, then reset
      startCreditUsedPoll()
    }
  } catch (e: any) {
    if (e.data?.error === 'User not found' || e.status === 404) {
      // Stale user in localStorage — force re-login
      signOut()
      return
    }
    gameError.value = e.data?.error || 'Failed to start game'
    if (e.data?.needsPayment) {
      // Refresh credits
      await fetchCredits()
    }
  } finally {
    starting.value = false
  }
}

// ── Stripe Payments ──

async function initializeStripe() {
  try {
    const paymentConfig = await $fetch<any>(`${apiBase.value}/api/payments/config`)

    if (!paymentConfig.publishableKey) return

    const { loadStripe } = await import('@stripe/stripe-js')
    const stripe = await loadStripe(paymentConfig.publishableKey)

    if (stripe) {
      stripeInstance.value = stripe
      stripeReady.value = true
    }
  } catch (_) {
    // silent — payments just won't be offered
  }
}

async function handleBuyToken() {
  if (!stripeInstance.value || !user.value) return

  paymentLoading.value = true
  paymentError.value = null
  paymentSuccess.value = false

  try {
    const res = await $fetch<any>(`${apiBase.value}/api/payments/create-intent`, {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    // Mock mode (Stripe not configured on server)
    if (res.mock) {
      credits.value.paidCredits = res.credits
      credits.value.availablePlays = res.availablePlays
      credits.value.freePlayUsed = true
      creditUsed.value = false
      paymentSuccess.value = true
      setTimeout(() => { paymentSuccess.value = false }, 3000)
      paymentLoading.value = false
      return
    }

    // Mount Payment Element
    const elements = stripeInstance.value.elements({
      clientSecret: res.clientSecret,
      appearance: {
        theme: 'night',
        variables: {
          colorPrimary: '#D9FF69',
          colorBackground: '#1e1a5c',
          colorText: '#ffffff',
          borderRadius: '12px',
        },
      },
    })

    stripeElements.value = elements

    const paymentElement = elements.create('payment', {
      layout: 'tabs',
    })

    showPaymentForm.value = true
    await nextTick()

    paymentElement.mount('#payment-element')

    paymentElement.on('ready', () => {
      paymentElementReady.value = true
    })
  } catch (e: any) {
    paymentError.value = e.data?.error || 'Failed to initialize payment'
  } finally {
    paymentLoading.value = false
  }
}

async function confirmPayment() {
  if (!stripeInstance.value || !stripeElements.value) return

  paymentProcessing.value = true
  paymentError.value = null

  try {
    const { error } = await stripeInstance.value.confirmPayment({
      elements: stripeElements.value,
      redirect: 'if_required',
    })

    if (error) {
      paymentError.value = error.message || 'Payment failed'
    } else {
      // Payment succeeded — poll for credit to appear (webhook adds it)
      showPaymentForm.value = false
      paymentElementReady.value = false
      stripeElements.value = null

      paymentSuccess.value = true
      creditUsed.value = false

      // Poll credits until the webhook adds the credit
      let attempts = 0
      const prevCredits = credits.value.availablePlays
      const poll = setInterval(async () => {
        attempts++
        await fetchCredits()
        if (credits.value.availablePlays > prevCredits || attempts >= 10) {
          clearInterval(poll)
        }
      }, 1500)

      setTimeout(() => { paymentSuccess.value = false }, 5000)
    }
  } catch (e: any) {
    paymentError.value = e.data?.error || 'Payment failed'
  } finally {
    paymentProcessing.value = false
  }
}

function cancelPayment() {
  showPaymentForm.value = false
  paymentElementReady.value = false
  stripeElements.value = null
}

// ── Dev credit ──

async function devAddCredit() {
  if (!user.value) return
  devCreditLoading.value = true
  devCreditSuccess.value = false

  try {
    const res = await $fetch<any>(`${apiBase.value}/api/users/${user.value.id}/dev-credit`, {
      method: 'POST',
    })

    if (res.success) {
      credits.value.paidCredits = res.credits
      credits.value.availablePlays = res.availablePlays
      credits.value.freePlayUsed = true
      creditUsed.value = false // Reset so Use Credit button reappears
      devCreditSuccess.value = true
      setTimeout(() => { devCreditSuccess.value = false }, 3000)
    }
  } catch (e: any) {
    if (e.status === 404) {
      signOut()
      return
    }
  } finally {
    devCreditLoading.value = false
  }
}

// ── Console disconnect/reconnect ──

async function disconnectConsole() {
  // Clear this user from the console but stay logged in
  try {
    await $fetch<any>(`${apiBase.value}/api/consoles/${consoleId.value}/logged-in-user`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
  } catch (_) {}

  creditUsed.value = false
  stopCreditUsedPoll()
  state.value = 'disconnected'
}

async function reconnectConsole() {
  state.value = 'loading'
  const connected = await checkConsole()
  if (!connected) {
    state.value = 'console-error'
    return
  }

  // Re-notify console of this user
  try {
    await $fetch<any>(`${apiBase.value}/api/consoles/${consoleId.value}/login`, {
      method: 'POST',
      body: { userId: user.value.id },
    })
  } catch (_) {}

  await loadDashboardData()
  if (!user.value) return
  state.value = 'dashboard'
}

// ── Sign out ──

function signOut() {
  if (process.client) {
    localStorage.removeItem('impactarcade_user')
    localStorage.removeItem('impactarcade_token')
  }
  user.value = null
  credits.value = { freePlayUsed: false, paidCredits: 0, availablePlays: 1 }
  gameStats.value = { highScore: 0, gamesPlayed: 0, bestLevel: 1 }
  state.value = 'login'
}
</script>

<style scoped>
.button-flash {
  animation: pulse-glow 1.5s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0px 6px 0px #16114F;
  }
  50% {
    box-shadow: 0px 6px 0px #16114F, 0 0 20px #D9FF69, 0 0 40px #D9FF69;
  }
}

</style>
