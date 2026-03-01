<template>
  <div :class="viewMode === 'arcade' ? 'arcade-root' : 'game-container min-h-screen pt-4'">

  <!-- DEV SETTINGS MENU -->
  <ClientOnly><div class="fixed top-4 right-4 z-[9999]">
    <button
      @click="devMenuOpen = !devMenuOpen"
      class="w-10 h-10 rounded-lg bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
      title="Dev settings"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    </button>
    <div v-if="devMenuOpen" class="absolute top-12 right-0 bg-gray-900/95 backdrop-blur-sm rounded-xl p-4 min-w-[220px] text-white text-sm shadow-2xl border border-white/10">
      <div class="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
        <span class="text-[10px] uppercase tracking-widest text-white/40 font-bold">Dev Settings</span>
        <span class="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/40 font-mono">{{ viewMode }} / {{ playFlow }}</span>
      </div>

      <div class="mb-3">
        <div class="text-[11px] text-white/50 mb-1.5 font-medium">View Mode</div>
        <div class="flex gap-1 bg-white/5 rounded-lg p-0.5">
          <button
            @click="setViewMode('web')"
            class="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            :class="viewMode === 'web' ? 'bg-white/20 text-white shadow-sm' : 'text-white/40 hover:text-white/70'"
          >Web</button>
          <button
            @click="setViewMode('arcade')"
            class="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            :class="viewMode === 'arcade' ? 'bg-white/20 text-white shadow-sm' : 'text-white/40 hover:text-white/70'"
          >Arcade</button>
        </div>
      </div>

      <div>
        <div class="text-[11px] text-white/50 mb-1.5 font-medium">Play Flow</div>
        <div class="flex gap-1 bg-white/5 rounded-lg p-0.5">
          <button
            @click="setPlayFlow('qr')"
            class="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            :class="playFlow === 'qr' ? 'bg-white/20 text-white shadow-sm' : 'text-white/40 hover:text-white/70'"
          >QR Code</button>
          <button
            @click="setPlayFlow('freeplay')"
            class="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            :class="playFlow === 'freeplay' ? 'bg-white/20 text-white shadow-sm' : 'text-white/40 hover:text-white/70'"
          >Free Play</button>
        </div>
      </div>
    </div>
  </div></ClientOnly>

    <!-- ARCADE: stats bar -->
    <div v-show="viewMode === 'arcade'" class="arcade-stats">
      <div class="arcade-stat">
        <div class="arcade-stat__label">Ocean Plastic Removed</div>
        <div class="arcade-stat__value">
          <img src="/images/icons/bags.png" class="h-6 mr-1.5" />
          <span class="arcade-score">
            <span class="relative">{{ gameStore.global.currentBags }}
              <span class="arcade-score__ontop absolute left-0">{{ gameStore.global.currentBags }}</span>
            </span>
          </span>
          <span class="text-[10px] font-bold ml-1.5 uppercase leading-tight">plastic<br>bags worth</span>
        </div>
      </div>
      <div class="arcade-divider"></div>
      <div class="arcade-stat">
        <div class="arcade-stat__label">Score</div>
        <div class="arcade-stat__value">
          <span class="arcade-score arcade-score--large">
            <span class="relative">{{ formattedScore }}
              <span class="arcade-score__ontop absolute left-0">{{ formattedScore }}</span>
            </span>
          </span>
        </div>
      </div>
      <div class="arcade-divider"></div>
      <div class="arcade-stat">
        <div class="arcade-stat__label">Animals Saved</div>
        <div class="arcade-stat__value">
          <span class="text-2xl">🐢</span>
        </div>
      </div>
    </div>

    <!-- WEB: left sidebar -->
    <div v-show="viewMode === 'web'" class="web-sidebar">
      <AtomsContainer fluid class="game-page">
        <div class="flex flex-col gap-5 game-page__section w-full">
          <OrganismsGamePageRealImpact class="md:hidden" />
          <OrganismsGamePageImpactCounter v-if="gameStore.consoleTotalBags > 0" :impact="gameStore.consoleTotalBags" :goal="200" />
          <OrganismsGamePageSummaryList v-if="showLastGameStats" class="hidden md:block" />
          <OrganismsGamePageLeaderboard class="hidden md:block" />
        </div>
      </AtomsContainer>
    </div>

    <!-- GAME CANVAS — always mounted, never destroyed -->
    <div class="game-canvas-area" ref="gameAreaRef">
      <div ref="gameInnerRef" :class="viewMode === 'arcade' ? 'arcade-game-inner' : 'web-game-inner'">
        <slot name="game"></slot>
        <MoleculesGamePageLoading />
      </div>
      <Transition name="fade">
        <div v-if="showYouAreHere" class="you-are-here">
          <div class="you-are-here__label">You are here!</div>
          <div class="you-are-here__arrow">&#9660;</div>
        </div>
      </Transition>
    </div>

    <!-- WEB: right sidebar -->
    <div v-show="viewMode === 'web'" class="web-sidebar">
      <AtomsContainer fluid class="game-page">
        <div class="relative z-0 flex flex-col gap-5 game-page__section w-full">
          <OrganismsGamePageSummaryList v-if="showLastGameStats" class="md:hidden" />
          <OrganismsGamePageAllies />
          <OrganismsGamePageRealImpact class="hidden md:block" />
          <OrganismsGamePageLeaderboard class="md:hidden" />
        </div>
      </AtomsContainer>
    </div>

    <!-- ARCADE: bottom bar -->
    <div v-show="viewMode === 'arcade'" class="arcade-bottom">
      <div class="arcade-bottom__lives">
        <template v-if="gameStore.global.gameScreen === 'playing'">
          <img v-for="i in gameStore.global.currentLives" :key="i" class="w-8 h-8" src="/images/newship.png" />
        </template>
      </div>
      <div class="arcade-bottom__levels">
        <template v-if="gameStore.global.gameScreen === 'playing'">
          <span
            v-for="i in 7"
            :key="i"
            class="font-bold font-agrandir text-lg"
            :class="gameStore.global.currentLevel >= i ? 'text-[#282828]' : 'text-[#B9B7B7]'"
          >L{{ i }}</span>
        </template>
      </div>
    </div>

    <MoleculesGamePageWinPage v-if="gameStore.global.gameScreen === 'win'" />

    <!-- Game Over overlay — covers everything during score save + reload -->
    <div v-if="gameStore.global.gameScreen === 'gameover'" class="gameover-overlay">
      <div class="text-center">
        <AtomsTextHighlight class="font-retro stroke-2 text-limeGreen text-4xl md:text-6xl">
          Game Over
        </AtomsTextHighlight>
        <div class="mt-8">
          <p class="text-white/80 font-bold text-xl">
            Score: {{ gameStore.global.currentScore.toLocaleString() }}
          </p>
          <p class="text-white/50 text-sm mt-2">
            Level {{ gameStore.global.currentLevel }} &bull; {{ gameStore.global.currentBags }} bags collected
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useGameStore } from '~~/store/game'
import { useOfflineQueue } from '~~/composables/useOfflineQueue'
import { resolveApiBase } from '~~/composables/useApiBase'

const gameStore = useGameStore()
const route = useRoute()
const { enqueue, startAutoSync } = useOfflineQueue()

// --- Dev settings menu ---
const devMenuOpen = ref(false)

const viewMode = ref<'web' | 'arcade'>(
  process.client
    ? (localStorage.getItem('impactarcade_viewMode') as 'web' | 'arcade') || 'web'
    : 'web'
)

const playFlow = ref<'qr' | 'freeplay'>(
  process.client
    ? (localStorage.getItem('impactarcade_playFlow') as 'qr' | 'freeplay') || 'qr'
    : 'qr'
)

provide('viewMode', viewMode)
provide('playFlow', playFlow)

const setViewMode = (mode: 'web' | 'arcade') => {
  viewMode.value = mode
  if (process.client) localStorage.setItem('impactarcade_viewMode', mode)
  nextTick(applyArcadeScale)
}

const setPlayFlow = (flow: 'qr' | 'freeplay') => {
  playFlow.value = flow
  if (process.client) localStorage.setItem('impactarcade_playFlow', flow)
}

const formattedScore = computed(() => {
  return gameStore.global.currentScore.toLocaleString()
})

// --- "You are here!" indicator ---
const showYouAreHere = ref(false)
let youAreHereTimer: ReturnType<typeof setTimeout> | null = null

// --- Arcade view canvas scaling ---
const gameAreaRef = ref<HTMLElement | null>(null)
const gameInnerRef = ref<HTMLElement | null>(null)

const CANVAS_W = 600
const CANVAS_H = 664

const applyArcadeScale = () => {
  const area = gameAreaRef.value
  const inner = gameInnerRef.value
  if (!area || !inner) return

  if (viewMode.value === 'arcade') {
    const areaW = area.clientWidth
    const areaH = area.clientHeight
    const scale = Math.min(areaW / CANVAS_W, areaH / CANVAS_H)

    inner.style.width = `${CANVAS_W}px`
    inner.style.height = `${CANVAS_H}px`
    inner.style.transform = `scale(${scale})`
    inner.style.transformOrigin = 'top center'
  } else {
    inner.style.width = ''
    inner.style.height = ''
    inner.style.transform = ''
    inner.style.transformOrigin = ''
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  nextTick(() => {
    applyArcadeScale()
    if (gameAreaRef.value) {
      resizeObserver = new ResizeObserver(applyArcadeScale)
      resizeObserver.observe(gameAreaRef.value)
    }
  })
})

// Console identification — defaults to 'ONLINE' for web players (no physical console)
const consoleId = process.client
  ? ((route.query.console as string) || localStorage.getItem('consoleId') || 'ONLINE')
  : 'ONLINE'

const apiBase = resolveApiBase()

// Only show score/level/tickets after a game has ended (not on menu)
const showLastGameStats = computed(() => {
  return gameStore.global.gameScreen === 'gameover' || gameStore.global.gameScreen === 'playing'
})

// --- Scroll lock ---
const preventScroll = (e: Event) => { e.preventDefault() }

onMounted(() => {
  gameStore.fetchLeaderboard()
  gameStore.fetchConsoleTotalBags(consoleId)
  // Sync any pending offline scores from previous sessions
  if (process.client) {
    startAutoSync()
    // Lock scrolling to prevent wiggle during gameplay
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.addEventListener('touchmove', preventScroll, { passive: false })
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  if (youAreHereTimer) clearTimeout(youAreHereTimer)
  if (process.client) {
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
    document.removeEventListener('touchmove', preventScroll)
  }
})

watch(() => gameStore.global.gameScreen, async (newVal, oldVal) => {
  // Show "You are here!" only at the start of a new level (not returning from egg screen)
  if (newVal === 'playing' && (oldVal === 'menu' || oldVal === 'win')) {
    showYouAreHere.value = true
    if (youAreHereTimer) clearTimeout(youAreHereTimer)
    youAreHereTimer = setTimeout(() => {
      showYouAreHere.value = false
    }, 3000)
  }

  // Stop egg music when level is beaten
  if (newVal === 'win' && gameStore.unityInstance) {
    try {
      gameStore.SendMessage(JSON.stringify({ Action: 'stopEggMusic' }))
    } catch {}
  }

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
// ==============================
// WEB VIEW (existing layout)
// ==============================
.game-container
  background: linear-gradient(157.64deg, #B7DDE7 12.88%, #FFFFFF 66.19%)
  @apply relative min-h-screen
  display: flex
  flex-direction: column
  overflow: hidden
  overscroll-behavior: none

  &::before
    content: ''
    background-color: linear-gradient(157.64deg, #B7DDE7 12.88%, #FFFFFF 66.19%)
    background-image: url('/images/backgrounds/game-page.svg')
    background-repeat: no-repeat
    @apply absolute top-0 left-0 w-full h-full bg-contain xl:bg-cover z-0

  // In web mode, lay out sidebars + game horizontally
  @screen md
    flex-direction: row
    justify-content: center
    gap: 1.25rem

  .web-sidebar
    @apply relative z-10
    @screen md
      max-width: 380px
      width: 100%

  .game-canvas-area
    @apply relative z-50
    width: fit-content
    height: fit-content

  .web-game-inner
    @apply hidden md:block w-fit

.game-page
  @apply flex flex-col justify-center w-full relative

  .game-page__section
    @apply relative z-10
    @screen md
      max-width: 380px
  .game-page__section--full
    @screen md
      max-width: 100%

// ==============================
// ARCADE VIEW
// ==============================
.arcade-root
  width: 100vw
  height: 100vh
  background: #4a4a4a
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  overflow: hidden
  overscroll-behavior: none
  touch-action: none
  padding: 20px 60px

  // Hide web sidebars entirely in arcade
  .web-sidebar
    display: none !important

  // Arcade stats bar
  .arcade-stats
    background: #d5e8ee
    border-radius: 12px 12px 0 0
    width: 100%
    max-width: min(calc((100vh - 40px) * 9 / 16), calc(100vw - 120px))
    flex-shrink: 0

  // Game area fills remaining space
  .game-canvas-area
    background: #d5e8ee
    flex: 1
    width: 100%
    max-width: min(calc((100vh - 40px) * 9 / 16), calc(100vw - 120px))
    min-height: 0
    display: flex
    align-items: flex-start
    justify-content: center
    overflow: hidden
    position: relative

  .arcade-game-inner
    flex-shrink: 0
    // Dimensions and transform set dynamically via JS

    :deep(#unity-canvas)
      width: 600px !important
      height: 664px !important

    :deep(.unity-game)
      width: 600px
      height: 664px

  // Bottom bar
  .arcade-bottom
    background: #d5e8ee
    border-radius: 0 0 12px 12px
    width: 100%
    max-width: min(calc((100vh - 40px) * 9 / 16), calc(100vw - 120px))
    flex-shrink: 0

// --- Arcade stats bar ---
.arcade-stats
  display: grid
  grid-template-columns: 1fr auto 1fr auto 1fr
  align-items: center
  padding: 10px 16px
  gap: 0

.arcade-stat
  display: flex
  flex-direction: column
  align-items: center
  text-align: center
  gap: 2px

.arcade-stat__label
  font-size: 10px
  font-weight: 700
  text-transform: uppercase
  color: #16114F
  letter-spacing: 0.5px

.arcade-stat__value
  display: flex
  align-items: center
  justify-content: center

.arcade-divider
  width: 1px
  height: 32px
  background: #16114F
  opacity: 0.15

// Score text with stroke
.arcade-score
  font-weight: 700
  font-size: 24px
  line-height: 24px
  color: #D9FF69
  -webkit-text-stroke: 3px #16114F
  text-shadow: 0px 2px 0px #5935B4, 0px 3px 0px #000000
  display: inline-flex
  align-items: center

  .arcade-score__ontop
    -webkit-text-stroke: 1px #16114F

.arcade-score--large
  font-size: 30px
  line-height: 30px
  -webkit-text-stroke: 3.5px #16114F

  .arcade-score__ontop
    -webkit-text-stroke: 1px #16114F

// --- Bottom bar ---
.arcade-bottom
  display: flex
  align-items: center
  justify-content: space-between
  padding: 8px 20px

.arcade-bottom__lives
  display: flex
  gap: 4px

.arcade-bottom__levels
  display: flex
  gap: 8px

// --- "You are here!" indicator ---
.you-are-here
  position: absolute
  left: 50%
  bottom: 6%
  transform: translateX(-50%)
  z-index: 60
  text-align: center
  pointer-events: none

  &__label
    background: rgba(0, 0, 0, 0.85)
    color: #D9FF69
    font-size: 13px
    font-weight: 700
    padding: 5px 12px
    border-radius: 8px
    white-space: nowrap
    margin-bottom: 2px

  &__arrow
    color: #D9FF69
    font-size: 20px
    line-height: 1
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5))
    animation: bounce-arrow 0.8s ease-in-out infinite

@keyframes bounce-arrow
  0%, 100%
    transform: translateY(0)
  50%
    transform: translateY(4px)

// --- Fade transition ---
.fade-enter-active, .fade-leave-active
  transition: opacity 0.4s ease

.fade-enter-from, .fade-leave-to
  opacity: 0

// --- Game Over overlay ---
.gameover-overlay
  position: fixed
  inset: 0
  z-index: 200
  background: rgba(22, 17, 79, 0.92)
  backdrop-filter: blur(8px)
  display: flex
  align-items: center
  justify-content: center
</style>
