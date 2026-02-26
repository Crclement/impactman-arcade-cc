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
        <!-- User greeting -->
        <p class="text-white/60 text-sm text-center mb-4">Hey, <span class="text-white font-bold">{{ user?.name }}</span></p>

        <!-- Credit pill -->
        <div class="bg-gradient-to-r from-[#D9FF69] to-[#00DC82] rounded-2xl p-5 mb-5">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-5xl font-bold text-[#16114F]">{{ credits.availablePlays }}</div>
              <div class="text-[#16114F]/70 font-bold text-sm uppercase">Play Credits</div>
            </div>
            <div class="text-right">
              <div v-if="!credits.freePlayUsed" class="text-[#16114F] font-bold text-sm">First play FREE!</div>
              <div v-else class="text-[#16114F]/60 text-sm">{{ credits.paidCredits }} paid</div>
            </div>
          </div>
        </div>

        <!-- USE CREDIT button (when credits available) -->
        <button
          v-if="credits.availablePlays > 0"
          @click="startGame"
          :disabled="starting"
          :class="[
            'w-full bg-[#9b5de5] text-white py-5 rounded-2xl font-bold text-2xl transition border-4 border-[#16114F] shadow-[0_6px_0_#16114F] active:shadow-none active:translate-y-1.5 mb-2',
            credits.availablePlays > 0 && !starting ? 'button-flash' : ''
          ]"
        >
          {{ starting ? 'Starting...' : 'Use Credit' }}
        </button>
        <p v-if="credits.availablePlays > 0" class="text-white/40 text-xs text-center mb-5">
          This will activate the Play button on the arcade
        </p>

        <!-- No credits message -->
        <div v-else class="bg-white/10 rounded-2xl p-4 text-center mb-5">
          <p class="text-white/60 font-bold">No credits remaining</p>
          <p class="text-white/40 text-sm mt-1">Add a credit below to play</p>
        </div>

        <!-- Error from start-game -->
        <p v-if="gameError" class="text-red-400 text-sm text-center mb-4">{{ gameError }}</p>

        <!-- Add Credits section (always visible) -->
        <div class="bg-white/5 rounded-2xl p-4 mb-5 border border-white/10">
          <p class="text-white/50 text-xs font-bold uppercase mb-3 text-center">Add Credits</p>

          <!-- Apple Pay -->
          <div v-if="paymentLoading" class="flex justify-center py-3">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D9FF69]"></div>
          </div>
          <div v-else-if="applePaySupported" id="apple-pay-button" class="apple-pay-button-container"></div>

          <!-- Dev: Add Credit -->
          <button
            @click="devAddCredit"
            :disabled="devCreditLoading"
            class="w-full border-2 border-dashed border-white/20 text-white/40 py-3 rounded-xl text-sm transition hover:border-white/40 hover:text-white/60 disabled:opacity-50"
            :class="{ 'mt-3': applePaySupported }"
          >
            {{ devCreditLoading ? 'Adding...' : 'Dev: Add Credit' }}
          </button>

          <div v-if="paymentError" class="text-center text-red-400 text-sm mt-2">{{ paymentError }}</div>
          <div v-if="paymentSuccess" class="text-center text-[#D9FF69] font-bold mt-2">Credit added!</div>
          <div v-if="devCreditSuccess" class="text-center text-[#D9FF69] font-bold mt-2">Dev credit added!</div>
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

      <!-- GAME STARTING STATE -->
      <div v-else-if="state === 'game-starting'" class="text-center">
        <div class="text-8xl mb-4 animate-bounce">🎮</div>
        <h2 class="text-[#D9FF69] text-3xl font-bold mb-2">Credit Used!</h2>
        <p class="text-white text-lg font-bold mb-1">The Play button is now flashing</p>
        <p class="text-white/70 mb-4">Press PLAY on the arcade to start!</p>
        <p class="text-white/40 text-sm mb-6">{{ credits.availablePlays }} credit{{ credits.availablePlays === 1 ? '' : 's' }} remaining</p>
        <button @click="backToDashboard" class="text-white/50 text-sm underline hover:text-white/70 transition">
          Back to dashboard
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
const state = ref<'loading' | 'console-error' | 'login' | 'dashboard' | 'game-starting'>('loading')

// User + auth
const user = ref<any>(null)

// Login form
const loginEmail = ref('')
const loginName = ref('')
const loginLoading = ref(false)
const loginError = ref<string | null>(null)

// Dashboard data
const credits = ref({ freePlayUsed: false, paidCredits: 0, availablePlays: 1 })
const gameStats = ref<any>({ highScore: 0, gamesPlayed: 0, bestLevel: 1 })

// Game start
const starting = ref(false)
const gameError = ref<string | null>(null)

// Apple Pay
const applePaySupported = ref(false)
const paymentLoading = ref(false)
const paymentError = ref<string | null>(null)
const paymentSuccess = ref(false)
const squarePayments = ref<any>(null)
const applePay = ref<any>(null)

// Dev credit
const devCreditLoading = ref(false)
const devCreditSuccess = ref(false)

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
    if (process.client) await initializeApplePay()
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
    if (process.client) await initializeApplePay()
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
      state.value = 'game-starting'
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

async function backToDashboard() {
  state.value = 'loading'
  await loadDashboardData()
  state.value = 'dashboard'
  if (process.client) {
    await nextTick()
    await initializeApplePay()
  }
}

// ── Apple Pay ──

async function initializeApplePay() {
  try {
    const paymentConfig = await $fetch<any>(`${apiBase.value}/api/payments/config`)

    if (!paymentConfig.applicationId) return

    if (!(window as any).Square) {
      const script = document.createElement('script')
      script.src = paymentConfig.environment === 'production'
        ? 'https://web.squarecdn.com/v1/square.js'
        : 'https://sandbox.web.squarecdn.com/v1/square.js'
      script.onload = () => setupApplePay(paymentConfig)
      document.head.appendChild(script)
    } else {
      await setupApplePay(paymentConfig)
    }
  } catch (_) {
    // silent — Apple Pay just won't be offered
  }
}

async function setupApplePay(paymentConfig: any) {
  try {
    const payments = (window as any).Square.payments(
      paymentConfig.applicationId,
      paymentConfig.locationId
    )
    squarePayments.value = payments

    const applePayInstance = await payments.applePay({
      countryCode: 'US',
      currencyCode: 'USD',
      total: {
        amount: '1.00',
        label: 'Impact Arcade Play Credit',
      },
    })

    if (applePayInstance) {
      applePay.value = applePayInstance
      applePaySupported.value = true

      await nextTick()
      const container = document.getElementById('apple-pay-button')
      if (container) {
        container.innerHTML = ''
        const button = document.createElement('div')
        button.className = 'apple-pay-button apple-pay-button-black'
        button.style.cssText = 'width: 100%; height: 48px; cursor: pointer; border-radius: 8px;'
        button.onclick = handleApplePayClick
        container.appendChild(button)
      }
    }
  } catch (_) {
    applePaySupported.value = false
  }
}

async function handleApplePayClick() {
  if (!applePay.value || !user.value) return

  paymentLoading.value = true
  paymentError.value = null
  paymentSuccess.value = false

  try {
    const tokenResult = await applePay.value.tokenize()

    if (tokenResult.status === 'OK') {
      const result = await $fetch<any>(`${apiBase.value}/api/payments/apple-pay`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: {
          userId: user.value.id,
          sourceId: tokenResult.token,
        },
      })

      if (result.success) {
        paymentSuccess.value = true
        credits.value.paidCredits = result.credits
        credits.value.availablePlays = result.availablePlays

        setTimeout(() => {
          paymentSuccess.value = false
        }, 3000)
      } else {
        paymentError.value = result.error || 'Payment failed'
      }
    } else {
      paymentError.value = tokenResult.errors?.[0]?.message || 'Payment cancelled'
    }
  } catch (e: any) {
    paymentError.value = e.data?.error || 'Payment failed'
  } finally {
    paymentLoading.value = false
  }
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

.apple-pay-button {
  -webkit-appearance: -apple-pay-button;
  -apple-pay-button-type: buy;
  -apple-pay-button-style: black;
}

.apple-pay-button-container {
  min-height: 48px;
}
</style>
