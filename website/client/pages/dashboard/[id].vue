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

onMounted(async () => {
  try {
    const userId = route.params.id as string
    const apiBase = config.public.apiBase || 'http://localhost:3001'
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
  })
}
</script>
