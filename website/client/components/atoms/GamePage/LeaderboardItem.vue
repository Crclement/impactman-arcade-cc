<template>
  <div class="border-2 rounded-md leaderboard-item flex items-center"
    :class="{'px-8': !small, 'px-4': small}"
  >
    <div :class="`font-retro ${small ? 'mr-2 text-xs' : 'mr-8'}`">
      39
    </div>
    <div class="avatar mr-4">
      <img :class="`${small ? 'w-8 h-8' : 'w-16 h-16'}`" src="/images/homepage/scoreboard/ape-cool.png" />
    </div>
    <div :class="`font-retro uppercase ${small ? 'text-xs' : ''}`">
      franko
    </div>

    <div :class="`font-retro uppercase ml-auto ${small ? 'text-xs' : ''}`">
      302,023
    </div>
  </div>
</template>

<script lang="ts" setup>
export interface LoadboardItemProps {
  small: boolean
}

const props = withDefaults(defineProps<LoadboardItemProps>(), {
  small: false
})
</script>

<style lang="sass" scoped>
.leaderboard-item
  border-style: solid
  border-color: #16114F
  box-shadow: 0px 3.71343px 0px #16114F

  @apply py-1
</style>