<template>
  <div class="min-h-screen bg-gradient-to-b from-[#B7DDE7] to-white">
    <!-- Header -->
    <div class="bg-[#16114F] text-white py-6 px-4">
      <div class="max-w-2xl mx-auto">
        <h1 class="text-2xl font-bold">Impact Arcade</h1>
        <p class="text-[#B7DDE7] text-sm">Player Dashboard</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#16114F]"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="max-w-2xl mx-auto p-4">
      <div class="bg-white rounded-xl p-8 text-center shadow-lg">
        <div class="text-6xl mb-4">😢</div>
        <h2 class="text-xl font-bold text-[#16114F] mb-2">User not found</h2>
        <p class="text-gray-600">{{ error }}</p>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="max-w-2xl mx-auto p-4 space-y-6">
      <!-- Profile Card -->
      <div class="bg-white rounded-xl p-6 shadow-lg">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-[#FCF252] rounded-full flex items-center justify-center text-2xl">
            🎮
          </div>
          <div>
            <h2 class="text-xl font-bold text-[#16114F]">{{ userData?.name }}</h2>
            <p class="text-gray-500 text-sm">{{ userData?.email }}</p>
            <p class="text-gray-400 text-xs">Playing since {{ formatDate(userData?.createdAt) }}</p>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white rounded-xl p-4 shadow-lg text-center">
          <div class="text-3xl font-bold text-[#16114F]">{{ stats?.totalScore?.toLocaleString() }}</div>
          <div class="text-sm text-gray-500">Total Score</div>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-lg text-center">
          <div class="text-3xl font-bold text-[#00DC82]">{{ stats?.highScore?.toLocaleString() }}</div>
          <div class="text-sm text-gray-500">High Score</div>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-lg text-center">
          <div class="text-3xl font-bold text-[#4D8BEC]">{{ stats?.totalGames }}</div>
          <div class="text-sm text-gray-500">Games Played</div>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-lg text-center">
          <div class="text-3xl font-bold text-[#FCF252]">{{ stats?.totalBags }}</div>
          <div class="text-sm text-gray-500">Bags Removed</div>
        </div>
      </div>

      <!-- Recent Games -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="bg-[#16114F] text-white px-4 py-3 font-bold">
          Recent Games
        </div>
        <div v-if="scores?.length === 0" class="p-8 text-center text-gray-500">
          No games played yet. Scan a QR code after playing to save your score!
        </div>
        <div v-else class="divide-y">
          <div v-for="(score, index) in scores" :key="index" class="p-4 flex items-center justify-between">
            <div>
              <div class="font-bold text-[#16114F]">{{ score.score.toLocaleString() }} pts</div>
              <div class="text-xs text-gray-500">
                Level {{ score.level }} • {{ score.bags }} bags • Console #{{ score.consoleId }}
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm text-gray-400">{{ formatDate(score.playedAt) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Impact Stats -->
      <div class="bg-gradient-to-r from-[#00DC82] to-[#4D8BEC] rounded-xl p-6 text-white shadow-lg">
        <h3 class="font-bold text-lg mb-2">Your Real-World Impact</h3>
        <p class="text-white/80 text-sm mb-4">
          Every bag you collect in the game helps remove real plastic from the ocean!
        </p>
        <div class="text-4xl font-bold">
          {{ (stats?.totalBags * 0.1).toFixed(1) }} lbs
        </div>
        <div class="text-white/80 text-sm">of ocean plastic removed</div>
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
const stats = ref<any>(null)

onMounted(async () => {
  try {
    const userId = route.params.id as string
    const apiBase = config.public.apiBase || 'http://localhost:3001'
    const res = await $fetch<any>(`${apiBase}/api/users/${userId}/scores`)

    userData.value = res.user
    scores.value = res.scores
    stats.value = res.stats
  } catch (e: any) {
    error.value = e.data?.error || 'Failed to load dashboard'
  } finally {
    loading.value = false
  }
})

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>
