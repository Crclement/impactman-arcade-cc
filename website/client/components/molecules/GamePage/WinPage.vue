<template>
  <MoleculesGamePageModal v-model="show">
    <div class="rounded-xl w-full h-full bg-gradient-pink px-16 py-20">
      <div class="text-center nicegame mx-auto relative z-100">
        <div class="mb-10">
          <AtomsTextHighlight class="font-retro stroke-2 text-limeGreen">
            Level {{ (gameStore.global.currentLevel - 1).toLocaleString('en-US', {
              minimumIntegerDigits: 2,
              useGrouping: false
            }) }} complete!
          </AtomsTextHighlight>
        </div>

        <div class="inline-flex mb-4">
          <AtomsTextHighlight class="text-7xl font-kontesa stroke-4 text-limeGreen">
            The {{ level.name }} ocean is clean!
          </AtomsTextHighlight>
          <span class="text-7xl">
            👌
          </span>
        </div>

        <p class="uppercase font-bold text-[#16114F] text-xl mb-8 mt-12">
          Ready to clean the <span class="text-[#283CF4]">{{ nextLevel.name }} ocean</span>?
        </p>
        <div class="text-center font-bold">
          <AtomsGamePageUIButton @click="GoNextLevel" class="bg-limeGreen border-4">
            <span class="p-4 text-xl">
              Let's go
            </span>
          </AtomsGamePageUIButton>
        </div>
      </div>
    </div>
</MoleculesGamePageModal>
</template>

<script lang="ts" setup>
import { useGameStore } from '~~/store/game';
import impactmanLevels from '~~/utils/impactmanLevels';

const show = ref(true)
const gameStore = useGameStore()

const level = computed(() => {
  const key = (gameStore.global.currentLevel - 2) % impactmanLevels.length
  return impactmanLevels[key]
})

const nextLevel = computed(() => {
  const key = (gameStore.global.currentLevel - 1) % impactmanLevels.length

  return impactmanLevels[key]
})

const GoNextLevel = () => {
  gameStore.SendMessage(JSON.stringify({
    Action: 'goNextLevel',
    SessionId: ''
  }))
}
</script>