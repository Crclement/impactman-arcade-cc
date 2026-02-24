<template>
  <div class="min-h-screen bg-gradient-to-b from-[#B7DDE7] to-white flex flex-col items-center justify-center p-4">
    <!-- Loading State -->
    <div v-if="loading" class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16114F] mx-auto"></div>
      <p class="mt-4 text-[#16114F] font-bold">Loading your score...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center bg-white rounded-xl p-8 shadow-lg max-w-md">
      <div class="text-6xl mb-4">😢</div>
      <h1 class="text-2xl font-bold text-[#16114F] mb-2">Oops!</h1>
      <p class="text-gray-600">{{ error }}</p>
      <button @click="navigateTo('/')" class="mt-6 bg-[#16114F] text-white px-6 py-3 rounded-lg font-bold">
        Go Home
      </button>
    </div>

    <!-- Already Claimed -->
    <div v-else-if="session?.claimed" class="text-center bg-white rounded-xl p-8 shadow-lg max-w-md">
      <div class="text-6xl mb-4">✅</div>
      <h1 class="text-2xl font-bold text-[#16114F] mb-2">Already Claimed!</h1>
      <p class="text-gray-600">This score has already been saved.</p>
      <button @click="navigateTo('/dashboard')" class="mt-6 bg-[#16114F] text-white px-6 py-3 rounded-lg font-bold">
        View Dashboard
      </button>
    </div>

    <!-- Claim Form -->
    <div v-else-if="session && !claimed" class="bg-white rounded-xl p-6 shadow-lg max-w-md w-full">
      <!-- Score Display -->
      <div class="text-center mb-6">
        <div class="text-6xl mb-2">🎮</div>
        <h1 class="text-2xl font-bold text-[#16114F]">Nice Game!</h1>
        <p class="text-gray-500 text-sm">Console #{{ session.consoleId }}</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-[#FCF252] rounded-lg p-3 text-center">
          <div class="text-2xl font-bold text-[#16114F]">{{ session.score.toLocaleString() }}</div>
          <div class="text-xs text-[#16114F] font-medium">SCORE</div>
        </div>
        <div class="bg-[#00DC82] rounded-lg p-3 text-center">
          <div class="text-2xl font-bold text-white">{{ session.level }}</div>
          <div class="text-xs text-white font-medium">LEVEL</div>
        </div>
        <div class="bg-[#4D8BEC] rounded-lg p-3 text-center">
          <div class="text-2xl font-bold text-white">{{ session.bags }}</div>
          <div class="text-xs text-white font-medium">BAGS</div>
        </div>
      </div>

      <!-- Claim Form -->
      <form @submit.prevent="claimScore" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="your@email.com"
            class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#16114F] focus:outline-none"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
          <input
            v-model="name"
            type="text"
            placeholder="Your name"
            class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#16114F] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          :disabled="claiming"
          class="w-full bg-[#16114F] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#2a2470] transition disabled:opacity-50"
        >
          {{ claiming ? 'Saving...' : 'Save My Score' }}
        </button>
      </form>

      <p class="text-center text-xs text-gray-400 mt-4">
        Your score will be linked to your account for future games.
      </p>
    </div>

    <!-- Success State -->
    <div v-else-if="claimed" class="text-center bg-white rounded-xl p-8 shadow-lg max-w-md">
      <div class="text-6xl mb-4">🎉</div>
      <h1 class="text-2xl font-bold text-[#16114F] mb-2">Score Saved!</h1>
      <p class="text-gray-600 mb-4">Welcome, {{ user?.name }}!</p>

      <div class="bg-gray-100 rounded-lg p-4 mb-6">
        <div class="text-sm text-gray-500">Total Score</div>
        <div class="text-3xl font-bold text-[#16114F]">{{ user?.totalScore?.toLocaleString() }}</div>
        <div class="text-sm text-gray-500 mt-2">{{ user?.gamesPlayed }} games played</div>
      </div>

      <button @click="navigateTo(`/dashboard/${user?.id}`)" class="w-full bg-[#16114F] text-white py-4 rounded-lg font-bold text-lg">
        View My Dashboard
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute()
const config = useRuntimeConfig()

const loading = ref(true)
const error = ref<string | null>(null)
const session = ref<any>(null)
const claimed = ref(false)
const claiming = ref(false)
const user = ref<any>(null)
const email = ref('')
const name = ref('')

// Fetch session on mount
onMounted(async () => {
  try {
    const code = route.params.code as string
    const apiBase = config.public.apiBase || 'http://localhost:3001'
    const res = await $fetch<any>(`${apiBase}/api/sessions/${code}`)
    session.value = res
  } catch (e: any) {
    if (e.status === 404) {
      error.value = 'Session not found. The QR code may be invalid.'
    } else if (e.status === 410) {
      error.value = 'This session has expired. Scores must be claimed within 24 hours.'
    } else {
      error.value = 'Something went wrong. Please try again.'
    }
  } finally {
    loading.value = false
  }
})

async function claimScore() {
  claiming.value = true
  try {
    const code = route.params.code as string
    const apiBase = config.public.apiBase || 'http://localhost:3001'
    const res = await $fetch<any>(`${apiBase}/api/sessions/${code}/claim`, {
      method: 'POST',
      body: {
        email: email.value,
        name: name.value || undefined,
      },
    })

    user.value = res.user
    claimed.value = true

    // Store token in localStorage for future use
    if (res.token) {
      localStorage.setItem('impactarcade_token', res.token)
      localStorage.setItem('impactarcade_user', JSON.stringify(res.user))
    }
  } catch (e: any) {
    error.value = e.data?.error || 'Failed to claim score. Please try again.'
  } finally {
    claiming.value = false
  }
}
</script>
