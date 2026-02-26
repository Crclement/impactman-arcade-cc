<template>
  <MoleculesGamePageCard title="Leaderboard">
    <div class="grid grid-cols-1 gap-1.5">
      <template v-if="store.leaderboard.length > 0">
        <AtomsGamePageLeaderboardItem
          v-for="(entry, i) in store.leaderboard.slice(0, 5)"
          :key="i"
          small
          :class="i === 0 ? 'bg-green' : ''"
          :rank="i + 1"
          :name="entry.user?.name || 'Anonymous'"
          :score="entry.score"
        />
      </template>
      <div v-else class="text-navyBlue/40 text-xs text-center py-4 font-bold uppercase">
        No scores yet
      </div>
    </div>
  </MoleculesGamePageCard>
</template>

<script lang="ts" setup>
import { useGameStore } from '~~/store/game'

const store = useGameStore()
</script>
