<template>
  <div>
    <!-- Header + Environment -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="font-retro text-navyBlue text-lg uppercase">Payments</h2>
      <span class="env-pill" :class="config.environment">
        {{ config.environment?.toUpperCase() || 'LOADING' }}
      </span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-16">
      <p class="font-retro text-navyBlue/40 text-sm uppercase">Loading payment config...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-16">
      <p class="font-retro text-red-600 text-sm uppercase">{{ error }}</p>
      <button
        @click="fetchConfig"
        class="font-retro text-xs uppercase py-2 px-4 bg-green text-navyBlue rounded-sm mt-4 transition-all"
        :style="{ border: '2px solid #16114F', boxShadow: '0 3px 0 #16114F' }"
      >
        Retry
      </button>
    </div>

    <!-- Provider Cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <!-- Stripe Card -->
      <button
        class="provider-card"
        :class="{ active: config.activeProvider === 'stripe' }"
        @click="switchProvider('stripe')"
        :disabled="switching"
      >
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center gap-2">
            <div class="provider-icon">S</div>
            <div class="text-left">
              <div class="font-retro text-xs text-navyBlue uppercase">Stripe</div>
              <div class="text-[0.65rem] text-navyBlue/50">Payment Element</div>
            </div>
          </div>
          <span class="status-dot" :class="config.providers?.stripe?.configured ? 'configured' : 'not-configured'">
            {{ config.providers?.stripe?.configured ? 'Configured' : 'Not configured' }}
          </span>
        </div>

        <div class="text-[0.65rem] text-navyBlue/40 text-left font-mono truncate">
          {{ maskedKey(config.providers?.stripe?.publishableKey) }}
        </div>

        <div v-if="config.activeProvider === 'stripe'" class="active-badge">
          <span class="active-dot"></span> Active
        </div>
      </button>

      <!-- Bolt Card -->
      <button
        class="provider-card"
        :class="{ active: config.activeProvider === 'bolt' }"
        @click="switchProvider('bolt')"
        :disabled="switching"
      >
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center gap-2">
            <div class="provider-icon">B</div>
            <div class="text-left">
              <div class="font-retro text-xs text-navyBlue uppercase">Bolt</div>
              <div class="text-[0.65rem] text-navyBlue/50">Checkout Modal</div>
            </div>
          </div>
          <span class="status-dot" :class="config.providers?.bolt?.configured ? 'configured' : 'not-configured'">
            {{ config.providers?.bolt?.configured ? 'Configured' : 'Not configured' }}
          </span>
        </div>

        <div class="text-[0.65rem] text-navyBlue/40 text-left font-mono truncate">
          {{ maskedKey(config.providers?.bolt?.publishableKey) }}
        </div>

        <div v-if="config.activeProvider === 'bolt'" class="active-badge">
          <span class="active-dot"></span> Active
        </div>
      </button>
    </div>

    <!-- Switch feedback -->
    <div v-if="switchSuccess" class="mt-3 text-center">
      <span class="font-retro text-xs text-green-700 uppercase">Provider switched!</span>
    </div>
    <div v-if="switchError" class="mt-3 text-center">
      <span class="font-retro text-xs text-red-600 uppercase">{{ switchError }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
const runtimeConfig = useRuntimeConfig()
const apiBase = runtimeConfig.public.apiBase || 'http://localhost:3001'

const loading = ref(true)
const error = ref<string | null>(null)
const switching = ref(false)
const switchSuccess = ref(false)
const switchError = ref<string | null>(null)

const config = ref<any>({
  environment: null,
  activeProvider: null,
  providers: { stripe: {}, bolt: {} },
})

function getAuthHeaders() {
  const token = process.client ? localStorage.getItem('impactarcade_token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function maskedKey(key: string | null | undefined): string {
  if (!key) return '(not set)'
  if (key.length <= 12) return key
  return key.slice(0, 8) + '...' + key.slice(-4)
}

async function fetchConfig() {
  loading.value = true
  error.value = null
  try {
    const res = await $fetch<any>(`${apiBase}/api/payments/config`)
    config.value = res
  } catch (e: any) {
    error.value = e.data?.error || 'Failed to load payment config'
  } finally {
    loading.value = false
  }
}

async function switchProvider(provider: string) {
  if (config.value.activeProvider === provider) return

  switching.value = true
  switchError.value = null
  switchSuccess.value = false

  try {
    const res = await $fetch<any>(`${apiBase}/api/admin/payments/provider`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: { provider },
    })

    config.value.activeProvider = res.activeProvider
    switchSuccess.value = true
    setTimeout(() => { switchSuccess.value = false }, 2000)
  } catch (e: any) {
    switchError.value = e.data?.error || 'Failed to switch provider'
  } finally {
    switching.value = false
  }
}

onMounted(() => {
  fetchConfig()
})
</script>

<style lang="sass" scoped>
.env-pill
  @apply text-[0.6rem] uppercase py-1 px-3 rounded-sm
  font-family: 'Retro'
  border: 2px solid #16114F

  &.sandbox
    background: #FFF3CD
    color: #856404

  &.production
    background: #D4EDDA
    color: #155724

.provider-card
  @apply bg-white rounded-sm p-4 text-left transition-all relative cursor-pointer
  border: 2px solid #16114F
  box-shadow: 0 3.7px 0 #16114F

  &:hover
    transform: translateY(-2px)
    box-shadow: 0 5px 0 #16114F

  &.active
    border-color: #00DC82
    box-shadow: 0 3.7px 0 #00DC82, 0 0 12px rgba(0, 220, 130, 0.2)

    &:hover
      box-shadow: 0 5px 0 #00DC82, 0 0 16px rgba(0, 220, 130, 0.3)

  &:disabled
    opacity: 0.6
    cursor: wait

.provider-icon
  @apply w-8 h-8 rounded-sm flex items-center justify-center text-xs text-white
  font-family: 'Retro'
  background: #16114F

.status-dot
  @apply text-[0.55rem] uppercase py-0.5 px-2 rounded-sm
  font-family: 'Retro'

  &.configured
    background: #D4EDDA
    color: #155724

  &.not-configured
    background: #F8D7DA
    color: #721C24

.active-badge
  @apply absolute bottom-2 right-3 flex items-center gap-1 text-[0.55rem] uppercase
  font-family: 'Retro'
  color: #155724

.active-dot
  @apply w-2 h-2 rounded-full inline-block animate-pulse
  background: #00DC82
</style>
