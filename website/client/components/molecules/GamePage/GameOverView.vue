<template>
  <MoleculesGamePageModal v-model="show" class="w-full h-full relative z-100 grid grid-cols-2 gap-10 mx-auto">
    <div class="mx-4 md:mx-10">
      <div class="flex flex-column">
        <div class="grid grid-cols-2 gap-10 w-full">
          <div class="rounded-xl w-full h-full bg-gradient-pink p-8">
            <NicePage />
          </div>
          <div class="rounded-xl w-full h-full bg-gradient-pink p-8">
            <MoleculesGamePageScoreView />
          </div>
        </div>
      </div>
    </div>
  </MoleculesGamePageModal>
</template>

<script lang="ts" setup>
import { useGameStore } from '~~/store/game';
import NicePage from './NicePage.vue';

const show = ref(true)

const gameStore = useGameStore()
const PlayAgain = () => {
  gameStore.SendMessage(JSON.stringify({
    Action: 'playAgain',
    SessionId: ''
  }))
}
</script>

<style lang="sass" scoped>
.nicegame
  @apply relative z-10
</style>