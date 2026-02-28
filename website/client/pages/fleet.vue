<template>
  <div class="fleet-page min-h-screen bg-blizzardBlue">
    <div class="max-w-7xl mx-auto px-3 md:px-6 py-6">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="font-retro text-navyBlue text-2xl md:text-3xl uppercase">Fleet Monitor</h1>
          <p class="text-navyBlue/60 text-sm mt-1">Impact Arcade Mission Control</p>
        </div>
        <button
          @click="fetchData"
          :disabled="loading"
          class="font-retro text-xs uppercase py-2 px-4 bg-green text-navyBlue rounded-sm transition-all"
          :style="{ border: '2px solid #16114F', boxShadow: '0 3px 0 #16114F' }"
        >
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1.5 mb-6">
        <div class="stat-card bg-green">
          <span class="stat-value">{{ stats.online }}</span>
          <span class="stat-label">Online</span>
        </div>
        <div class="stat-card">
          <span class="stat-value text-purple">{{ stats.playing }}</span>
          <span class="stat-label">Playing</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.offline }}</span>
          <span class="stat-label">Offline</span>
        </div>
        <div class="stat-card" :class="{ 'bg-[#fff3cd]': stats.warning > 0 }">
          <span class="stat-value">{{ stats.warning }}</span>
          <span class="stat-label">Warning</span>
        </div>
        <div class="stat-card bg-green">
          <span class="stat-value">{{ (stats.totalGamesPlayed || 0).toLocaleString() }}</span>
          <span class="stat-label">Games Played</span>
        </div>
        <div class="stat-card bg-green lg:col-span-1 col-span-2">
          <span class="stat-value">{{ stats.topScore?.score?.toLocaleString() || 0 }}</span>
          <span class="stat-label">Top Score</span>
          <span v-if="stats.topScore" class="text-[0.6rem] text-navyBlue/60">
            Console {{ stats.topScore.consoleName }}
          </span>
        </div>
      </div>

      <!-- Console Grid -->
      <div v-if="consoles.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
        <MoleculesFleetConsoleCard
          v-for="c in consoles"
          :key="c.consoleId"
          :data="c"
        />
      </div>

      <div v-else-if="!loading" class="text-center py-16">
        <p class="font-retro text-navyBlue/40 text-lg uppercase">No consoles connected</p>
        <p class="text-navyBlue/40 text-sm mt-2">Consoles will appear here once they send a heartbeat</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: 'default'
})

const apiBase = resolveApiBase()

const consoles = ref<any[]>([])
const stats = ref<any>({
  online: 0,
  offline: 0,
  warning: 0,
  playing: 0,
  total: 0,
  totalGamesPlayed: 0,
  topScore: null
})
const loading = ref(true)

const fetchData = async () => {
  loading.value = true
  try {
    const [consolesData, statsData] = await Promise.all([
      $fetch<any>(`${apiBase}/api/consoles`),
      $fetch<any>(`${apiBase}/api/stats`)
    ])
    consoles.value = consolesData
    stats.value = statsData
  } catch (_) {
    // silent
  } finally {
    loading.value = false
  }
}

let interval: ReturnType<typeof setInterval>

onMounted(() => {
  fetchData()
  interval = setInterval(fetchData, 10000)
})

onUnmounted(() => {
  clearInterval(interval)
})
</script>

<style lang="sass" scoped>
.stat-card
  @apply bg-white rounded-sm py-3 px-4 flex items-center justify-between transition-all
  border: 2px solid #16114F
  box-shadow: 0 3.7px 0 #16114F

  &:hover
    transform: translateY(-2px)
    box-shadow: 0 5px 0 #16114F

.stat-value
  @apply text-xs text-navyBlue uppercase
  font-family: 'Retro'

.stat-label
  @apply text-xs text-navyBlue/70 uppercase
  font-family: 'Retro'
</style>
