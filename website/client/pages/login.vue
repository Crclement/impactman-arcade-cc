<template>
  <div class="min-h-screen bg-gradient-to-b from-[#B7DDE7] to-white flex flex-col items-center justify-center p-4">
    <div class="bg-white rounded-xl p-6 shadow-lg max-w-md w-full">
      <!-- Header -->
      <div class="text-center mb-6">
        <div class="text-5xl mb-2">🎮</div>
        <h1 class="text-2xl font-bold text-[#16114F]">Impact Arcade</h1>
        <p class="text-gray-500 text-sm">Login to track your scores</p>
        <p v-if="consoleId" class="text-xs text-gray-400 mt-2">
          Console: {{ consoleId }} | Raspi: {{ raspiId }}
        </p>
      </div>

      <!-- Success State -->
      <div v-if="loggedIn" class="text-center">
        <div class="text-6xl mb-4">✅</div>
        <h2 class="text-xl font-bold text-[#16114F] mb-2">You're logged in!</h2>
        <p class="text-gray-600 mb-4">Welcome back, {{ user?.name }}!</p>
        <p class="text-sm text-gray-500 mb-6">
          Your scores will now be automatically saved when you play.
        </p>
        <button
          @click="navigateTo(`/dashboard/${user?.id}`)"
          class="w-full bg-[#16114F] text-white py-3 rounded-lg font-bold"
        >
          View My Dashboard
        </button>
      </div>

      <!-- Login Form -->
      <form v-else @submit.prevent="login" class="space-y-4">
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

        <div v-if="error" class="text-red-500 text-sm text-center">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-[#16114F] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#2a2470] transition disabled:opacity-50"
        >
          {{ loading ? 'Logging in...' : 'Login / Sign Up' }}
        </button>
      </form>

      <p class="text-center text-xs text-gray-400 mt-4">
        We'll create an account if you don't have one yet.
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute()
const config = useRuntimeConfig()

const email = ref('')
const name = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const loggedIn = ref(false)
const user = ref<any>(null)

// Get console info from query params
const consoleId = computed(() => route.query.console as string || '')
const raspiId = computed(() => route.query.raspi as string || '')

async function login() {
  loading.value = true
  error.value = null

  try {
    const apiBase = config.public.apiBase || 'http://localhost:3001'
    const res = await $fetch<any>(`${apiBase}/api/users/login`, {
      method: 'POST',
      body: {
        email: email.value,
        name: name.value || undefined,
      },
    })

    user.value = res.user
    loggedIn.value = true

    // Store in localStorage
    if (process.client) {
      localStorage.setItem('impactarcade_token', res.token)
      localStorage.setItem('impactarcade_user', JSON.stringify(res.user))
    }
  } catch (e: any) {
    error.value = e.data?.error || 'Failed to login. Please try again.'
  } finally {
    loading.value = false
  }
}

// Check if already logged in
onMounted(() => {
  if (process.client) {
    const savedUser = localStorage.getItem('impactarcade_user')
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
        loggedIn.value = true
      } catch (e) {
        // Invalid saved user, ignore
      }
    }
  }
})
</script>
