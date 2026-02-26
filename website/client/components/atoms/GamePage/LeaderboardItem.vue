<template>
  <div class="border-2 rounded-md leaderboard-item flex items-center"
    :class="{'px-8': !small, 'px-4': small}"
  >
    <div :class="`font-retro ${small ? 'mr-2 text-xs' : 'mr-8'}`">
      {{ rank }}
    </div>
    <div class="avatar mr-4">
      <img :class="`${small ? 'w-8 h-8' : 'w-16 h-16'}`" src="/images/homepage/scoreboard/ape-cool.png" />
    </div>
    <div :class="`font-retro uppercase ${small ? 'text-xs' : ''} truncate`">
      {{ name }}
    </div>

    <div :class="`font-retro uppercase ml-auto ${small ? 'text-xs' : ''} whitespace-nowrap pl-2`">
      {{ score.toLocaleString() }}
    </div>
  </div>
</template>

<script lang="ts" setup>
export interface LeaderboardItemProps {
  small?: boolean
  rank?: number
  name?: string
  score?: number
}

withDefaults(defineProps<LeaderboardItemProps>(), {
  small: false,
  rank: 0,
  name: '—',
  score: 0,
})
</script>

<style lang="sass" scoped>
.leaderboard-item
  border-style: solid
  border-color: #16114F
  box-shadow: 0px 3.71343px 0px #16114F

  @apply py-1
</style>
