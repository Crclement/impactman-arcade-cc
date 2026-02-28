<template>
  <div class="rounded-lg unity-game relative w-full h-full bg-[#4D8BEC]">
    <canvas v-show="gameStore.global.gameScreen !== 'gameover'" id="unity-canvas" class="rounded-lg" width=600 height=664></canvas>
  </div>
</template>

<script lang="ts" setup>
import { GamePossibleScreens, useGameStore } from '~~/store/game';

export interface UnityGameProps {
  game: string;
}

export interface UnityWebMessage {
  Event: "GlobalVariable";
  Payload: {
    Key: "currentLevel" | "currentScore" | "gameScreen" | "currentLives" | "currentBags" | "eggBags";
    Value: string;
  };
}

const props = defineProps<UnityGameProps>()
const gameStore = useGameStore()

let unityLoading = false

const OnWebMessage = (message: string) => {
  const data: UnityWebMessage = JSON.parse(message)

  if (data.Event === "GlobalVariable") {
    switch (data.Payload.Key) {
      case "currentLevel":
        gameStore.$patch({
          global: {
            currentLevel: parseInt(data.Payload.Value)
          }
        })
        break;
      case "currentScore":
        gameStore.$patch({
          global: {
            currentScore: parseInt(data.Payload.Value)
          }
        })
        break;
      case "currentLives":
        gameStore.$patch({
          global: {
            currentLives: parseInt(data.Payload.Value)
          }
        })
        break;
      case "gameScreen":
        gameStore.$patch({
          global: {
            gameScreen: data.Payload.Value as GamePossibleScreens
          }
        })
        break;
      case "currentBags":
        gameStore.$patch({
          global: {
            currentBags: parseInt(data.Payload.Value)
          }
        })
        break;
      case "eggBags":
        gameStore.$patch({
          global: {
            eggBags: parseInt(data.Payload.Value)
          }
        })
        break;
    }
  }
}

useHead({
  script: [
    {
      key: 'unity-loader',
      src: '/unity/impactman/Build/impactman.loader.js',
      body: true,
      onload: () => {
        console.log('[Unity] loader.js onload fired, createUnityInstance available:', typeof createUnityInstance)
        loadUnityGame()
      }
    }
  ]
})

onBeforeRouteLeave(async () => {
  await gameStore.unityInstance?.Quit()
})

onBeforeMount(() => {
  window.OnWebMessage = OnWebMessage

  // Resume AudioContext on first user gesture to suppress Unity's
  // "AudioContext was not allowed to start" warnings
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

  gameStore.$patch({
    global: {
      gameScreen: 'loading'
    }
  })
})

const loadUnityGame = async () => {
  if (unityLoading) return
  unityLoading = true

  console.log('[Unity] loadUnityGame() called')

  var meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content = 'width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes';
  document.getElementsByTagName('head')[0].appendChild(meta);

  const canvas = document.querySelector("#unity-canvas") as HTMLCanvasElement | null
  console.log('[Unity] Canvas element:', canvas ? `${canvas.width}x${canvas.height}` : 'NOT FOUND')

  if (!canvas) {
    console.error('[Unity] Canvas not found, aborting')
    gameStore.$patch({ global: { gameScreen: 'menu' } })
    return
  }

  try {
    console.log('[Unity] Calling createUnityInstance...')
    const startTime = performance.now()

    const unity = await createUnityInstance(canvas, {
      dataUrl: "/unity/impactman/Build/impactman.data",
      frameworkUrl: "/unity/impactman/Build/impactman.framework.js",
      codeUrl: "/unity/impactman/Build/impactman.wasm",
      streamingAssetsUrl: "/unity/impactman/StreamingAssets",
      companyName: "Dollar Donation Club",
      productName: "ImpactMan",
      productVersion: "1.0",
      print: (msg: string) => { if (msg) console.log('[Unity]', msg) },
      printErr: (msg: string) => { if (msg) console.warn('[Unity]', msg) },
      showBanner: (msg: string, type: string) => {
        if (type === 'error') console.error('[Unity Banner]', msg)
        else if (type === 'warning') console.warn('[Unity Banner]', msg)
        else console.log('[Unity Banner]', msg)
      },
    }, (progress: number) => {
      console.log('[Unity] Progress:', Math.round(progress * 100) + '%', `(${Math.round((performance.now() - startTime) / 1000)}s)`)
    }) as any;

    console.log('[Unity] Instance created in', Math.round((performance.now() - startTime) / 1000) + 's')
    gameStore.$patch({ unityInstance: unity })
  } catch (e: any) {
    console.error('[Unity] Failed to load:', e.message || e)
    // Don't hang on loading — transition to menu so the QR code is visible
    gameStore.$patch({ global: { gameScreen: 'menu' } })
  }
}

</script>

<style lang="sass" scoped>
#unity-canvas
  width: 600px
  height: 664px

  @screen lg
    width: 650px
    height: 720px
</style>

<script lang="ts">
declare global {
  interface Window { OnWebMessage: (message: string) => void; }
}
</script>