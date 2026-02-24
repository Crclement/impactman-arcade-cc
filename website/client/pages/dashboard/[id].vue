<template>
  <div class="min-h-screen bg-[#16114F]">
    <!-- Header with Logo -->
    <div class="py-8 px-4">
      <div class="max-w-4xl mx-auto">
        <img src="/images/impact-arcade-logo.png" alt="Impact Arcade" class="h-16 mx-auto" />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D9FF69]"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-4xl mx-auto p-4">
      <div class="bg-white rounded-xl p-8 text-center shadow-lg">
        <div class="text-6xl mb-4">😢</div>
        <h2 class="text-xl font-bold text-[#16114F] mb-2">User not found</h2>
        <p class="text-gray-600">{{ error }}</p>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="max-w-4xl mx-auto px-4 pb-12">
      <!-- Welcome Banner -->
      <div class="bg-gradient-to-r from-[#D9FF69] to-[#00DC82] rounded-2xl p-6 mb-8">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-[#16114F] rounded-full flex items-center justify-center text-3xl">
            🎮
          </div>
          <div>
            <h1 class="text-2xl font-bold text-[#16114F]">{{ userData?.name }}</h1>
            <p class="text-[#16114F]/70 text-sm">{{ userData?.email }}</p>
          </div>
        </div>
      </div>

      <!-- Games Section -->
      <div class="mb-6">
        <h2 class="text-[#D9FF69] font-bold text-xl mb-4 flex items-center gap-2">
          <span>🕹️</span> Your Games
        </h2>

        <!-- Game Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Impact-man Card -->
          <div class="bg-white rounded-2xl overflow-hidden shadow-lg">
            <!-- Game Preview Image -->
            <div class="relative">
              <img src="/images/impacman_background.png" alt="Impact-man" class="w-full h-48 object-cover" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div class="absolute bottom-4 left-4">
                <h3 class="text-white font-bold text-2xl">Impact-man</h3>
                <p class="text-white/80 text-sm">Remove ocean plastic!</p>
              </div>
            </div>

            <!-- Stats -->
            <div class="p-4">
              <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-[#16114F]">{{ gameStats.highScore?.toLocaleString() || 0 }}</div>
                  <div class="text-xs text-gray-500">High Score</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-[#00DC82]">{{ gameStats.gamesPlayed || 0 }}</div>
                  <div class="text-xs text-gray-500">Games</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-[#4D8BEC]">{{ gameStats.totalBags || 0 }}</div>
                  <div class="text-xs text-gray-500">Bags</div>
                </div>
              </div>

              <!-- Additional Stats -->
              <div class="border-t pt-4 grid grid-cols-2 gap-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Total Score</span>
                  <span class="font-bold text-[#16114F]">{{ gameStats.totalScore?.toLocaleString() || 0 }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Avg Score</span>
                  <span class="font-bold text-[#16114F]">{{ gameStats.avgScore?.toLocaleString() || 0 }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Best Level</span>
                  <span class="font-bold text-[#16114F]">{{ gameStats.bestLevel || 1 }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Plastic Removed</span>
                  <span class="font-bold text-[#00DC82]">{{ (gameStats.totalBags * 0.1).toFixed(1) }} lbs</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Coming Soon Card -->
          <div class="bg-white/10 rounded-2xl overflow-hidden border-2 border-dashed border-white/30 flex items-center justify-center min-h-[320px]">
            <div class="text-center p-6">
              <div class="text-5xl mb-3 opacity-50">🎲</div>
              <h3 class="text-white/50 font-bold text-xl">More Games Coming!</h3>
              <p class="text-white/30 text-sm mt-2">Stay tuned for new titles</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Games -->
      <div v-if="scores?.length > 0">
        <h2 class="text-[#D9FF69] font-bold text-xl mb-4 flex items-center gap-2">
          <span>📊</span> Recent Games
        </h2>
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
                    Level {{ score.level }} • {{ score.bags }} bags
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm text-gray-400">{{ formatDate(score.playedAt) }}</div>
                <div class="text-xs text-gray-300">Console #{{ score.consoleId }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Play Credits Section -->
      <div class="mt-8">
        <h2 class="text-[#D9FF69] font-bold text-xl mb-4 flex items-center gap-2">
          <span>🎟️</span> Play Credits
        </h2>
        <div class="bg-white rounded-2xl p-6 shadow-lg">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="text-3xl font-bold text-[#16114F]">{{ credits.availablePlays }}</div>
              <div class="text-sm text-gray-500">plays available</div>
            </div>
            <div class="text-right text-sm text-gray-400">
              <div v-if="!credits.freePlayUsed" class="text-[#00DC82] font-bold">First play FREE!</div>
              <div v-else>{{ credits.paidCredits }} paid credits</div>
            </div>
          </div>

          <!-- Apple Pay Button -->
          <div v-if="credits.availablePlays === 0 || credits.freePlayUsed" class="mt-4">
            <p class="text-sm text-gray-600 mb-3 text-center">Add more plays for $1 each</p>

            <!-- Apple Pay Loading -->
            <div v-if="paymentLoading" class="flex justify-center py-4">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#16114F]"></div>
            </div>

            <!-- Apple Pay Button Container -->
            <div v-else-if="applePaySupported" id="apple-pay-button" class="apple-pay-button-container"></div>

            <!-- Fallback for non-Apple Pay -->
            <div v-else class="text-center py-4">
              <p class="text-sm text-gray-500">Apple Pay not available on this device</p>
              <p class="text-xs text-gray-400 mt-1">Visit on iPhone or Safari to use Apple Pay</p>
            </div>

            <!-- Payment Error -->
            <div v-if="paymentError" class="mt-3 text-center text-red-500 text-sm">
              {{ paymentError }}
            </div>

            <!-- Payment Success -->
            <div v-if="paymentSuccess" class="mt-3 text-center text-[#00DC82] font-bold">
              Payment successful! Credit added.
            </div>
          </div>
        </div>
      </div>

      <!-- Impact Footer -->
      <div class="mt-8 text-center">
        <div class="bg-gradient-to-r from-[#00DC82]/20 to-[#4D8BEC]/20 rounded-xl p-6 border border-white/10">
          <p class="text-white/60 text-sm mb-2">Your Real-World Impact</p>
          <div class="text-4xl font-bold text-[#D9FF69]">
            {{ (gameStats.totalBags * 0.1).toFixed(1) }} lbs
          </div>
          <p class="text-white/40 text-sm mt-1">of ocean plastic removed</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute()
const config = useRuntimeConfig()

const loading = ref(true)
const error = ref<string | null>(null)
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
  availablePlays: 1, // Default to 1 (free play)
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
    // Get Square config
    const paymentConfig = await $fetch<any>(`${apiBase}/api/payments/config`)

    if (!paymentConfig.applicationId) {
      console.log('Square not configured')
      return
    }

    // Load Square SDK
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

    // Check if Apple Pay is available
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

      // Render Apple Pay button
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
    // Tokenize the payment
    const tokenResult = await applePay.value.tokenize()

    if (tokenResult.status === 'OK') {
      // Send to our API
      const apiBase = config.public.apiBase || 'http://localhost:3001'
      const result = await $fetch<any>(`${apiBase}/api/payments/apple-pay`, {
        method: 'POST',
        body: {
          userId: userData.value.id,
          sourceId: tokenResult.token,
        },
      })

      if (result.success) {
        paymentSuccess.value = true
        credits.value.paidCredits = result.credits
        credits.value.availablePlays = result.availablePlays

        // Reset success message after 3 seconds
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
/* Apple Pay button styling */
.apple-pay-button {
  -webkit-appearance: -apple-pay-button;
  -apple-pay-button-type: buy;
  -apple-pay-button-style: black;
}

.apple-pay-button-container {
  min-height: 48px;
}
</style>
