<template>
  <div class="rounded-lg canvas-game relative bg-[#4D8BEC]">
    <!-- Canvas always present, behind video during menu -->
    <canvas
      ref="canvasRef"
      id="unity-canvas"
      class="rounded-lg game-layer"
      :class="{ 'opacity-0': showMenuVideo, 'opacity-100': !showMenuVideo }"
      tabindex="0"
    ></canvas>
    <!-- Menu background video — crossfades out when game starts -->
    <video
      ref="menuVideoRef"
      class="rounded-lg game-layer"
      :class="{ 'opacity-100': showMenuVideo, 'opacity-0 pointer-events-none': !showMenuVideo }"
      autoplay
      loop
      muted
      playsinline
    >
      <source src="/game-sprites/menu/bg-loop.webm" type="video/webm" />
      <source src="/game-sprites/menu/bg-loop.mp4" type="video/mp4" />
    </video>
  </div>
</template>

<script lang="ts" setup>
import { type GamePossibleScreens, useGameStore } from '~~/store/game'
import { GameEngine } from '~~/game/engine'

const gameStore = useGameStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const menuVideoRef = ref<HTMLVideoElement | null>(null)
let engine: GameEngine | null = null

const showMenuVideo = computed(() => {
  const screen = gameStore.global.gameScreen
  return screen === 'loading' || screen === 'menu'
})

onMounted(async () => {
  if (!canvasRef.value) return

  // Resume AudioContext on first user gesture
  const resumeAudio = () => {
    const ctx = (window as any).AudioContext || (window as any).webkitAudioContext
    if (ctx) {
      const ac = new ctx()
      ac.resume().then(() => ac.close())
    }
    document.removeEventListener('click', resumeAudio)
    document.removeEventListener('touchstart', resumeAudio)
    document.removeEventListener('keydown', resumeAudio)
  }
  document.addEventListener('click', resumeAudio, { once: true })
  document.addEventListener('touchstart', resumeAudio, { once: true })
  document.addEventListener('keydown', resumeAudio, { once: true })

  gameStore.$patch({ global: { gameScreen: 'loading' } })

  engine = new GameEngine(canvasRef.value)

  try {
    await engine.init({
      onScoreChange: (score: number) => {
        gameStore.$patch({ global: { currentScore: score } })
      },
      onLivesChange: (lives: number) => {
        gameStore.$patch({ global: { currentLives: lives } })
      },
      onLevelChange: (level: number) => {
        gameStore.$patch({ global: { currentLevel: level } })
      },
      onScreenChange: (screen: string) => {
        gameStore.$patch({ global: { gameScreen: screen as GamePossibleScreens } })
      },
      onBagsChange: (bags: number) => {
        gameStore.$patch({ global: { currentBags: bags } })
      },
      onEggBagsChange: (bags: number) => {
        gameStore.$patch({ global: { eggBags: bags } })
      },
    })

    // Store engine reference for game store actions
    gameStore.$patch({ gameInstance: engine })
  } catch (e: any) {
    console.error('[CanvasGame] Failed to init:', e.message || e)
    gameStore.$patch({ global: { gameScreen: 'menu' } })
  }
})

onBeforeRouteLeave(() => {
  engine?.destroy()
  engine = null
})

onUnmounted(() => {
  engine?.destroy()
  engine = null
})
</script>

<style lang="sass" scoped>
.canvas-game
  z-index: 0
  isolation: isolate
  width: 600px
  height: 664px

  @screen lg
    width: 650px
    height: 720px

.game-layer
  position: absolute
  top: 0
  left: 0
  width: 100%
  height: 100%
  transition: opacity 0.4s ease-in-out

video.game-layer
  object-fit: cover
</style>
