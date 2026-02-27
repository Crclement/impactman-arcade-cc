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
    <GameOverView v-if="gameStore.global.gameScreen === 'gameover'" />

    <MoleculesGamePageWinPage v-if="gameStore.global.gameScreen === 'win'" />
</div>
</template>

<script lang="ts" setup>
import { useGameStore } from '~~/store/game'
import GameOverView from '../molecules/GamePage/GameOverView.vue';

const gameStore = useGameStore()
const route = useRoute()

// Console identification
const consoleId = process.client
  ? ((route.query.console as string) || localStorage.getItem('consoleId') || 'IMP-001')
  : 'IMP-001'

// Only show score/level/tickets after a game has ended (not on menu)
const showLastGameStats = computed(() => {
  return gameStore.global.gameScreen === 'gameover' || gameStore.global.gameScreen === 'playing'
})

onMounted(() => {
  gameStore.fetchLeaderboard()
  gameStore.fetchConsoleTotalBags(consoleId)
})

const shouldShowGame = computed(() => {
  return gameStore.global.gameScreen !== "gameover"
})

watch(() => gameStore.global.gameScreen, (newVal) => {
  if (newVal === "gameover") {
    gameStore.unityInstance?.Quit()
    // Refresh console total bags and leaderboard to include the game just played
    gameStore.fetchConsoleTotalBags(consoleId)
    gameStore.fetchLeaderboard()
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