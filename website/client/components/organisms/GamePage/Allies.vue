<template>
  <MoleculesGamePageCard title="Allies">
    <div class="p-2">
      <template v-if="store.allies.length > 0">
        <div v-for="(ally, i) in store.allies" :key="i" class="text-navyBlue text-xs uppercase inline-flex">
          <img src="/images/ship.png" class="h-5 mr-2" />
          <span>{{ ally }}</span>
        </div>
      </template>
      <div v-else class="text-navyBlue/40 text-xs text-center py-4 font-bold uppercase">
        Play to discover allies
      </div>
    </div>
  </MoleculesGamePageCard>
</template>

<script lang="ts" setup>
import { useGameStore } from '~~/store/game'

const store = useGameStore()
</script>
