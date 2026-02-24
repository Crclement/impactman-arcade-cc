<template>
  <AtomsBox class="h-full bg-white w-fit">
    <AtomsGamePageUnityGame game="impactman" />
    <div class="absolute -bottom-14 flex gap-2 w-full">
      <div v-if="store.global.gameScreen === 'playing'" class="flex gap-2 mb-2">
        <img v-for="i in store.global.currentLives" :key="i" class="w-8 h-8" src="/images/newship.png" />
      </div>

      <div class="ml-auto select-none	">
        <div @click="store.$patch({ sound: false })" v-show="store.sound" class="inline-flex items-center h-full cursor-pointer">
          <span class="font-bold mr-2">SOUND ON</span> <img src="/images/sound/on.png" />
        </div>
        <div @click="store.$patch({ sound: true })" v-show="!store.sound" class="inline-flex items-center h-full cursor-pointer">
          <span class="font-bold mr-2">SOUND OFF</span> <img src="/images/sound/off.png" />
        </div>
      </div>

      <div v-if="store.global.gameScreen === 'playing'" class="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
        <div class="flex gap-2 font-bold font-agrandir text-lg text-[#282828]">
          <span :class="{'text-[#B9B7B7]': store.global.currentLevel < i}" v-for="i in 7">L{{ i }}</span>
        </div>
      </div>

    </div>
    <div v-if="store.global.gameScreen === 'menu'"
      class="absolute left-1/2 -translate-x-1/2 bottom-8 flex justify-center flex-col items-center">

      <!-- Login QR Code Section -->
      <div class="bg-white/95 rounded-xl p-4 mb-4 text-center shadow-lg">
        <p class="text-[#16114F] font-bold text-sm mb-2">
          {{ loggedInUser ? `Welcome back, ${loggedInUser.name}!` : 'Scan to save your scores' }}
        </p>
        <div class="flex items-center justify-center gap-3">
          <img :src="loginQrUrl" alt="Login QR" class="w-20 h-20 rounded" />
          <div class="text-left">
            <p class="text-xs text-gray-500">Console #{{ consoleId }}</p>
            <p class="text-xs text-gray-500">Raspi #{{ raspiId }}</p>
            <p v-if="loggedInUser" class="text-xs text-green-600 font-bold mt-1">Logged In</p>
            <p v-else class="text-xs text-gray-400 mt-1">Scan with phone</p>
          </div>
        </div>
      </div>

      <button
        @click="() => store.StartGame()"
        class="button-play w-48 font-retro uppercase py-3 px-12 border-4 border-[#16114F] text-4xl bg-purple text-center rounded-xl">
        <span class="text-play">Play</span>
      </button>

      <div class="text-[#FCF252] text-center font-bold whitespace-nowrap mt-4 text-sm">
        WARNING: THIS GAME REMOVES REAL-WORLD OCEAN PLASTIC!
      </div>
    </div>
    <MoleculesGamePageEggScreen />
  </AtomsBox>
</template>

<script lang="ts" setup>
import { useGameStore } from '~~/store/game';

const store = useGameStore()

// Console identification
const consoleId = ref(process.client ? (localStorage.getItem('consoleId') || 'IMP-001') : 'IMP-001')
const raspiId = ref(process.client ? (localStorage.getItem('raspiId') || 'RPI-001') : 'RPI-001')

// Logged in user state
const loggedInUser = ref<any>(null)

// Login QR URL - links to login page with console info
const loginQrUrl = computed(() => {
  const baseUrl = process.client ? window.location.origin : ''
  const loginUrl = `${baseUrl}/login?console=${consoleId.value}&raspi=${raspiId.value}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(loginUrl)}`
})

// Check for logged in user on mount
onMounted(() => {
  if (process.client) {
    const savedUser = localStorage.getItem('impactarcade_user')
    if (savedUser) {
      try {
        loggedInUser.value = JSON.parse(savedUser)
      } catch (e) {
        console.error('Failed to parse saved user:', e)
      }
    }
  }
})

// Watch sound state and notify Unity
watch(() => store.sound, (soundOn) => {
  if (store.unityInstance) {
    store.unityInstance.SendMessage("GameManager", "OnWebMessage", JSON.stringify({
      Event: "Sound",
      Payload: { Enabled: soundOn }
    }))
  }
})
</script>

<style lang="sass" scoped>
.text-play
  -webkit-text-stroke: 2px black
  letter-spacing: -4px
  @apply text-white

.button-play
  box-shadow: 0px 8px 0px #16114F

  @apply transition-all

  &:active
    box-shadow: 0px 0px 0px #16114F
    transform: translateY(8px)
</style>

