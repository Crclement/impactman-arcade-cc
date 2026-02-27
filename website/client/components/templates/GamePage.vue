<template>
  <div class="game-container min-h-screen pt-4">
    <AtomsContainer fluid class="game-page">
      <div class="flex flex-col gap-5 game-page__section w-full">
        <OrganismsGamePageRealImpact class="md:hidden" />
        <OrganismsGamePageImpactCounter :impact="gameStore.consoleTotalBags" :goal="200" />
        <OrganismsGamePageSummaryList v-if="showLastGameStats" class="hidden md:block" />
        <OrganismsGamePageLeaderboard class="hidden md:block" />
      </div>
      <div class="relative z-50 rounded-xl game-page__section game-page__section--full w-fit h-full">
        <div class=" hidden md:block w-fit">
          <slot name="game"></slot>
          <MoleculesGamePageLoading />
        </div>
      </div>
      <div class="relative z-0 flex flex-col gap-5 game-page__section w-full">
        <OrganismsGamePageSummaryList v-if="showLastGameStats" class="md:hidden" />
        <OrganismsGamePageAllies />
        <OrganismsGamePageRealImpact class="hidden md:block" />
        <OrganismsGamePageLeaderboard class="md:hidden" />
      </div>
    </AtomsContainer>
    <MoleculesGamePageWinPage v-if="gameStore.global.gameScreen === 'win'" />
</div>
</template>

<script lang="ts" setup>
import { useGameStore } from '~~/store/game'
import { useOfflineQueue } from '~~/composables/useOfflineQueue'

const gameStore = useGameStore()
const route = useRoute()
const config = useRuntimeConfig()
const { enqueue, startAutoSync } = useOfflineQueue()

// Console identification — defaults to 'ONLINE' for web players (no physical console)
const consoleId = process.client
  ? ((route.query.console as string) || localStorage.getItem('consoleId') || 'ONLINE')
  : 'ONLINE'

const apiBase = config.public.apiBase || 'http://localhost:3001'

// Only show score/level/tickets after a game has ended (not on menu)
const showLastGameStats = computed(() => {
  return gameStore.global.gameScreen === 'gameover' || gameStore.global.gameScreen === 'playing'
})

onMounted(() => {
  gameStore.fetchLeaderboard()
  gameStore.fetchConsoleTotalBags(consoleId)
  // Sync any pending offline scores from previous sessions
  if (process.client) startAutoSync()
})

watch(() => gameStore.global.gameScreen, async (newVal) => {
  if (newVal === "gameover") {
    gameStore.unityInstance?.Quit()

    // Save score in background, then reload to return to home screen
    const scoreData = {
      consoleId,
      raspiId: process.client ? (localStorage.getItem('raspiId') || null) : null,
      score: gameStore.global.currentScore,
      level: gameStore.global.currentLevel,
      bags: gameStore.global.currentBags,
      plasticRemoved: gameStore.global.currentBags * 0.1,
    }

    if (gameStore.loggedInUser) {
      // Logged-in user: save score to their account
      const userId = gameStore.loggedInUser.id
      const token = process.client ? localStorage.getItem('impactarcade_token') : null
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      try {
        await Promise.race([
          $fetch(`${apiBase}/api/users/${userId}/scores`, {
            method: 'POST',
            headers,
            body: scoreData,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
        ])
      } catch {
        enqueue(`${apiBase}/api/users/${userId}/scores`, 'POST', scoreData, headers)
      }
    } else {
      // Guest: create a session so the score is still stored on the server
      try {
        await Promise.race([
          $fetch(`${apiBase}/api/sessions`, {
            method: 'POST',
            body: scoreData,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
        ])
      } catch {
        enqueue(`${apiBase}/api/sessions`, 'POST', scoreData, {})
      }
    }

    // Reload page — returns to QR scan home screen with fresh Unity
    if (process.client) {
      window.location.reload()
    }
  }
})

</script>

<style lang="sass" scoped>
.game-container
  background: linear-gradient(157.64deg, #B7DDE7 12.88%, #FFFFFF 66.19%)

  @apply relative  min-h-screen

  &::before
    content: ''
    background-color: linear-gradient(157.64deg, #B7DDE7 12.88%, #FFFFFF 66.19%)
    background-image: url('/images/backgrounds/game-page.svg')
    background-repeat: no-repeat
    @apply absolute top-0 left-0 w-full h-full bg-contain xl:bg-cover z-0
.game-page
  @apply flex flex-col justify-center md:flex-row w-full relative md:gap-5

  .game-page__section
    @apply relative z-10
    @screen md
      max-width: 380px
  .game-page__section--full
    @screen md
      max-width: 100%
</style>