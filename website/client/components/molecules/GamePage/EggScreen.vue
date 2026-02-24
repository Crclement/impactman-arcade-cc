<template>
  <div v-show="gameStore.global.gameScreen === 'egg'"
    class="absolute w-full h-full top-0 left-0 flex-col rounded-lg flex items-center justify-center">
    <AtomsTextHighlight class="inline-flex stroke-2 font-retro text-3xl">
      <img src="/images/icons/thunder.png" class="w-6 mr-4" /> You found an impact egg
    </AtomsTextHighlight>

    <div class="my-10 relative">
      <img src="/images/icons/egg.png" class="w-48" />

      <div v-for="(b, key) in bags" :key="key" class="absolute top-0 left-1/2 -translate-x-1/2">
        <div>
          <img v-motion :initial="{
            opacity: 0,
            scale: 0
          }" :visible="b" src="/images/icons/bags.png" class="w-8" />
        </div>
      </div>
    </div>

    <AtomsTextHighlight class="stroke-2 font-kontesa text-6xl">
      {{ gameStore.global.eggBags }} bags removed
    </AtomsTextHighlight>

    <div class="mt-10 flex items-center justify-center bg-navyBlue rounded-lg overflow-hidden border-4 border-navyBlue">
      <div class="bg-limeGreen px-4 p-2">
        <img src="/images/polygon.png" class="h-8">
      </div>
      <div @click="test" class="border-x-4 border-navyBlue px-4 bg-white h-full flex items-center font-bold text-2xl">
        POLYGON HELPED!
      </div>
      <div class="bg-limeGreen px-4 p-2">
        <img src="/images/newship.png" class="w-8 h-8">
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useGameStore } from '~~/store/game';

const gameStore = useGameStore();

const bags = computed(() => {
  let bagsArray = Array<Object>(gameStore.global.eggBags).fill({});

  return bagsArray.map(b => {
    return {
      scale: 1,
      opacity: 1,
      // random between -30 and 30
      y: Math.floor(Math.random() * 60) - 30,
      // random between -60 and 60
      x: Math.floor(Math.random() * 120) - 60,
      // Random between -10 and 10
      rotate: Math.floor(Math.random() * 20) - 10,
      transition: {
        type: 'spring',
        stiffness: 250,
        damping: 25,
        mass: 0.5,
      },
    }
  })
})

const test = () => {
  gameStore.$patch({
    global: {
      eggBags: 0
    }
  })

  nextTick(() => {
    gameStore.$patch({
      global: {
        eggBags: 6
      }
    })
  })
}
</script>