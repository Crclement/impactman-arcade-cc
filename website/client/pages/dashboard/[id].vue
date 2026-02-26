<template>
  <div class="min-h-screen bg-[#16114F]">
    <!-- Header with Logo -->
    <div class="py-6 px-4">
      <div class="max-w-4xl mx-auto">
        <img src="/images/impact-arcade-logo.png" alt="Impact Arcade" class="h-14 mx-auto" />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D9FF69]"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-4xl mx-auto p-4">
      <div class="bg-white rounded-xl p-8 text-center shadow-lg">
        <h2 class="text-xl font-bold text-[#16114F] mb-2">User not found</h2>
        <p class="text-gray-600">{{ error }}</p>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="max-w-4xl mx-auto px-4 pb-12">
      <!-- Welcome + Name -->
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-white">{{ userData?.name }}</h1>
        <p class="text-white/40 text-sm">{{ userData?.email }}</p>
      </div>

      <!-- Play Credits (prominent, top) -->
      <div class="bg-gradient-to-r from-[#D9FF69] to-[#00DC82] rounded-2xl p-6 mb-6">
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

        <!-- Buy More Credits -->
        <div v-if="credits.freePlayUsed" class="mt-4 pt-4 border-t border-[#16114F]/20">
          <div v-if="paymentLoading" class="flex justify-center py-3">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#16114F]"></div>
          </div>
          <div v-else-if="applePaySupported" id="apple-pay-button" class="apple-pay-button-container"></div>
          <p v-else class="text-[#16114F]/60 text-sm text-center">Apple Pay not available on this device</p>
          <div v-if="paymentError" class="mt-2 text-center text-red-600 text-sm font-bold">{{ paymentError }}</div>
          <div v-if="paymentSuccess" class="mt-2 text-center text-[#16114F] font-bold">Credit added!</div>
        </div>
      </div>

      <!-- Play Again on Console -->
      <div v-if="consoleId" class="mb-6">
        <button
          v-if="credits.availablePlays > 0 && !playAgainSent"
          @click="triggerPlayAgain"
          :disabled="playAgainLoading"
          class="w-full bg-[#9b5de5] text-white py-5 rounded-2xl font-bold text-2xl hover:bg-[#a855f7] transition disabled:opacity-50 border-4 border-[#16114F] shadow-[0_6px_0_#16114F] active:shadow-none active:translate-y-1.5"
        >
          {{ playAgainLoading ? 'Sending...' : 'Play Again' }}
        </button>
        <div v-else-if="playAgainSent" class="bg-[#00DC82]/20 border border-[#00DC82]/40 rounded-2xl p-4 text-center">
          <p class="text-[#00DC82] font-bold text-lg">Ready!</p>
          <p class="text-white/50 text-sm mt-1">Press Play on the arcade</p>
        </div>
        <div v-else class="bg-white/10 rounded-2xl p-4 text-center">
          <p class="text-white/60 font-bold">No credits remaining</p>
          <p class="text-white/40 text-sm mt-1">Add credits above to play again</p>
        </div>
        <div v-if="playAgainError" class="mt-2 text-center text-red-400 text-sm">{{ playAgainError }}</div>
      </div>

      <!-- Real-World Impact (prominent) -->
      <div class="bg-gradient-to-r from-[#00DC82]/20 to-[#4D8BEC]/20 rounded-2xl p-6 mb-6 border border-white/10">
        <p class="text-white/60 text-sm mb-1 uppercase font-bold">Your Real-World Impact</p>
        <div class="flex items-baseline gap-2">
          <span class="text-5xl font-bold text-[#D9FF69]">{{ (gameStats.totalBags * 0.1).toFixed(1) }}</span>
          <span class="text-white/60 text-lg">lbs of ocean plastic removed</span>
        </div>
        <div class="flex gap-6 mt-3 text-sm">
          <span class="text-white/50">{{ gameStats.totalBags }} bags collected</span>
          <span class="text-white/50">{{ gameStats.gamesPlayed }} games played</span>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-3 gap-3 mb-6">
        <div class="bg-white/10 rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-white">{{ gameStats.highScore?.toLocaleString() || 0 }}</div>
          <div class="text-xs text-white/50 uppercase">High Score</div>
        </div>
        <div class="bg-white/10 rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-[#D9FF69]">{{ gameStats.gamesPlayed || 0 }}</div>
          <div class="text-xs text-white/50 uppercase">Games</div>
        </div>
        <div class="bg-white/10 rounded-xl p-4 text-center">
          <div class="text-2xl font-bold text-[#00DC82]">L{{ gameStats.bestLevel || 1 }}</div>
          <div class="text-xs text-white/50 uppercase">Best Level</div>
        </div>
      </div>

      <!-- Recent Games -->
      <div v-if="scores?.length > 0" class="mb-6">
        <h2 class="text-white/60 font-bold text-sm mb-3 uppercase">Recent Games</h2>
        <div class="bg-white rounded-2xl overflow-hidden shadow-lg">
          <div class="divide-y">
            <div v-for="(score, index) in scores.slice(0, 5)" :key="index" class="p-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-[#D9FF69] rounded-lg flex items-center justify-center font-bold text-[#16114F]">
                  {{ index + 1 }}
                </div>
                <div>
                  <div class="font-bold text-[#16114F]">{{ score.score?.toLocaleString() }} pts</div>
                  <div class="text-xs text-gray-500">
                    Level {{ score.level }} &bull; {{ score.bags }} bags
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm text-gray-400">{{ formatDate(score.playedAt) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- More Games Coming -->
      <div class="bg-white/5 rounded-2xl border-2 border-dashed border-white/20 p-8 text-center">
        <h3 class="text-white/30 font-bold text-lg">More Games Coming!</h3>
        <p class="text-white/20 text-sm mt-1">Stay tuned for new titles</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: 'naked'
})

const route = useRoute()
const config = useRuntimeConfig()

// Console ID from query params (passed through from login page)
const consoleId = computed(() => route.query.console as string || '')

const loading = ref(true)
const error = ref<string | null>(null)

function getAuthHeaders() {
  const token = process.client ? localStorage.getItem('impactarcade_token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Play again state
const playAgainLoading = ref(false)
const playAgainSent = ref(false)
const playAgainError = ref<string | null>(null)
const userData = ref<any>(null)
const scores = ref<any[]>([])
const gameStats = ref<any>({
  highScore: 0,
  gamesPlayed: 0,
  totalScore: 0,
  totalBags: 0,
  avgScore: 0,
  bestLevel: 1,
})

// Payment state
const credits = ref({
  freePlayUsed: false,
  paidCredits: 0,
  availablePlays: 1,
})
const paymentLoading = ref(false)
const paymentError = ref<string | null>(null)
const paymentSuccess = ref(false)
const applePaySupported = ref(false)
const squarePayments = ref<any>(null)
const applePay = ref<any>(null)

onMounted(async () => {
  const apiBase = config.public.apiBase || 'http://localhost:3001'

  try {
    const userId = route.params.id as string
    const res = await $fetch<any>(`${apiBase}/api/users/${userId}/scores`)

    userData.value = res.user
    scores.value = res.scores

    // Calculate game stats
    if (res.scores && res.scores.length > 0) {
      gameStats.value = {
        highScore: Math.max(...res.scores.map((s: any) => s.score || 0)),
        gamesPlayed: res.scores.length,
        totalScore: res.scores.reduce((sum: number, s: any) => sum + (s.score || 0), 0),
        totalBags: res.scores.reduce((sum: number, s: any) => sum + (s.bags || 0), 0),
        avgScore: Math.floor(res.scores.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / res.scores.length),
        bestLevel: Math.max(...res.scores.map((s: any) => s.level || 1)),
      }
    }

    // Fetch credits
    const creditsRes = await $fetch<any>(`${apiBase}/api/users/${userId}/credits`)
    credits.value = creditsRes
  } catch (e: any) {
    error.value = e.data?.error || 'Failed to load dashboard'
  } finally {
    loading.value = false
  }

  // Initialize Square Web Payments SDK for Apple Pay
  if (process.client) {
    await initializeApplePay()
  }
})

async function initializeApplePay() {
  const apiBase = config.public.apiBase || 'http://localhost:3001'

  try {
    const paymentConfig = await $fetch<any>(`${apiBase}/api/payments/config`)

    if (!paymentConfig.applicationId) {
      console.log('Square not configured')
      return
    }

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
  } catch (e) {
    console.error('Failed to initialize Apple Pay:', e)
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
  } catch (e) {
    console.log('Apple Pay not available:', e)
    applePaySupported.value = false
  }
}

async function handleApplePayClick() {
  if (!applePay.value || !userData.value) return

  paymentLoading.value = true
  paymentError.value = null
  paymentSuccess.value = false

  try {
    const tokenResult = await applePay.value.tokenize()

    if (tokenResult.status === 'OK') {
      const apiBase = config.public.apiBase || 'http://localhost:3001'
      const result = await $fetch<any>(`${apiBase}/api/payments/apple-pay`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: {
          userId: userData.value.id,
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
    console.error('Apple Pay error:', e)
    paymentError.value = e.data?.error || 'Payment failed'
  } finally {
    paymentLoading.value = false
  }
}

async function triggerPlayAgain() {
  if (!consoleId.value || !userData.value) return

  playAgainLoading.value = true
  playAgainError.value = null

  try {
    const apiBase = config.public.apiBase || 'http://localhost:3001'
    const res = await $fetch<any>(`${apiBase}/api/consoles/${consoleId.value}/start-game`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: { userId: userData.value.id },
    })

    playAgainSent.value = true

    // Update credits display
    if (res.creditsRemaining !== undefined) {
      credits.value.paidCredits = res.creditsRemaining
      credits.value.availablePlays = res.availablePlays
    }
  } catch (e: any) {
    if (e.data?.needsPayment) {
      playAgainError.value = 'No credits — add more above!'
    } else {
      playAgainError.value = e.data?.error || 'Failed to start game'
    }
  } finally {
    playAgainLoading.value = false
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
</script>

<style scoped>
.apple-pay-button {
  -webkit-appearance: -apple-pay-button;
  -apple-pay-button-type: buy;
  -apple-pay-button-style: black;
}

.apple-pay-button-container {
  min-height: 48px;
}
</style>
