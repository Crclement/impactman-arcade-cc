<template>
  <div class="game-loading">
    <AtomsLogoLoading :loading="gameStore.global.gameScreen === 'loading'"  />
  </div>
</template>

<script lang="ts" setup>
import { useGameStore } from '~~/store/game';

const gameStore = useGameStore()
</script>