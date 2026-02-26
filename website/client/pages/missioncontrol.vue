<template>
  <div class="admin-page min-h-screen bg-blizzardBlue">
    <div class="max-w-7xl mx-auto px-3 md:px-6 py-6">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="font-retro text-navyBlue text-2xl md:text-3xl uppercase">Mission Control</h1>
          <p class="text-navyBlue/60 text-sm mt-1">Impact Arcade Test Suite</p>
        </div>
      </div>

      <!-- Tab Bar -->
      <div class="flex gap-2 mb-6 flex-wrap">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="tab-btn font-retro text-xs uppercase py-2 px-4 rounded-sm transition-all"
          :class="activeTab === tab.id ? 'active' : ''"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <MoleculesAdminSystemTests v-if="activeTab === 'system'" />
      <MoleculesAdminUxTests v-else-if="activeTab === 'ux'" />
      <MoleculesAdminDocTests v-else-if="activeTab === 'docs'" />

      <!-- Fleet UI Tab (inline) -->
      <div v-else-if="activeTab === 'fleet'">
        <!-- Stats Row -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1.5 mb-6">
          <div class="stat-card bg-green">
            <span class="stat-value">{{ fleetStats.online }}</span>
            <span class="stat-label">Online</span>
          </div>
          <div class="stat-card">
            <span class="stat-value text-purple">{{ fleetStats.playing }}</span>
            <span class="stat-label">Playing</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ fleetStats.offline }}</span>
            <span class="stat-label">Offline</span>
          </div>
          <div class="stat-card" :class="{ 'bg-[#fff3cd]': fleetStats.warning > 0 }">
            <span class="stat-value">{{ fleetStats.warning }}</span>
            <span class="stat-label">Warning</span>
          </div>
          <div class="stat-card bg-green">
            <span class="stat-value">{{ (fleetStats.totalGamesPlayed || 0).toLocaleString() }}</span>
            <span class="stat-label">Games Played</span>
          </div>
          <div class="stat-card bg-green lg:col-span-1 col-span-2">
            <span class="stat-value">{{ fleetStats.topScore?.score?.toLocaleString() || 0 }}</span>
            <span class="stat-label">Top Score</span>
            <span v-if="fleetStats.topScore" class="text-[0.6rem] text-navyBlue/60">
              Console {{ fleetStats.topScore.consoleName }}
            </span>
          </div>
        </div>

        <!-- Refresh -->
        <div class="flex justify-end mb-4">
          <button
            @click="fetchFleetData"
            :disabled="fleetLoading"
            class="font-retro text-xs uppercase py-2 px-4 bg-green text-navyBlue rounded-sm transition-all"
            :style="{ border: '2px solid #16114F', boxShadow: '0 3px 0 #16114F' }"
          >
            {{ fleetLoading ? 'Loading...' : 'Refresh' }}
          </button>
        </div>

        <!-- Console Grid -->
        <div v-if="fleetConsoles.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
          <MoleculesFleetConsoleCard
            v-for="c in fleetConsoles"
            :key="c.consoleId"
            :data="c"
          />
        </div>

        <div v-else-if="!fleetLoading" class="text-center py-16">
          <p class="font-retro text-navyBlue/40 text-lg uppercase">No consoles connected</p>
          <p class="text-navyBlue/40 text-sm mt-2">Consoles will appear here once they send a heartbeat</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: 'naked',
  middleware: 'admin',
})

const config = useRuntimeConfig()
const apiBase = config.public.apiBase || 'http://localhost:3001'

const tabs = [
  { id: 'system', label: 'System Tests' },
  { id: 'ux', label: 'UX Tests' },
  { id: 'docs', label: 'Doc Fact-Check' },
  { id: 'fleet', label: 'Fleet UI' },
]

const activeTab = ref('system')

// Fleet UI data
const fleetConsoles = ref<any[]>([])
const fleetStats = ref<any>({
  online: 0, offline: 0, warning: 0, playing: 0,
  total: 0, totalGamesPlayed: 0, topScore: null
})
const fleetLoading = ref(false)
let fleetInterval: ReturnType<typeof setInterval>

const fetchFleetData = async () => {
  fleetLoading.value = true
  try {
    const [consolesData, statsData] = await Promise.all([
      $fetch<any>(`${apiBase}/api/consoles`),
      $fetch<any>(`${apiBase}/api/stats`)
    ])
    fleetConsoles.value = consolesData
    fleetStats.value = statsData
  } catch (e: any) {
    console.error('Failed to fetch fleet data:', e)
  } finally {
    fleetLoading.value = false
  }
}

// Auto-refresh fleet data when fleet tab is active
watch(activeTab, (tab) => {
  clearInterval(fleetInterval)
  if (tab === 'fleet') {
    fetchFleetData()
    fleetInterval = setInterval(fetchFleetData, 10000)
  }
})

onMounted(() => {
  if (activeTab.value === 'fleet') {
    fetchFleetData()
    fleetInterval = setInterval(fetchFleetData, 10000)
  }
})

onUnmounted(() => {
  clearInterval(fleetInterval)
})
</script>

<style lang="sass" scoped>
.tab-btn
  background: white
  color: #16114F
  border: 2px solid #16114F
  box-shadow: 0 3.7px 0 #16114F
  cursor: pointer

  &:hover
    transform: translateY(-2px)
    box-shadow: 0 5px 0 #16114F

  &.active
    background: #16114F
    color: white

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
