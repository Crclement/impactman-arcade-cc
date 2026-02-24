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
      class="absolute left-1/2 -translate-x-1/2 bottom-12 flex justify-center flex-col items-center">
      <button
        @click="() => store.StartGame()"
        class="button-play w-48 font-retro uppercase py-3 px-12 border-4 border-[#16114F] text-4xl bg-purple text-center rounded-xl">
        <span class="text-play">Play</span>
      </button>

      <div class="text-[#FCF252] text-center font-bold whitespace-nowrap	mt-5">
        WARNING: THIS GAME REMOVES REAL-WORLD OCEAN PLASTIC!
      </div>
    </div>
    <MoleculesGamePageEggScreen />
  </AtomsBox>
</template>

<script lang="ts" setup>
import { useGameStore } from '~~/store/game';

const store = useGameStore()
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

