<template>
  <div class="flex">
    <MoleculesRoadmapStatUnit
      box-label="Quests"
      image-icon-src="/images/homepage/roadmap/arrows.svg"
      image-icon-width="42.88"
      image-icon-height="34.91"
    >
      {{props.questHeaderLabel}}
    </MoleculesRoadmapStatUnit>
    <MoleculesRoadmapStatUnit
      box-label="Coins"
      image-icon-src="/images/homepage/roadmap/token.svg"
      image-icon-width="36.44"
      image-icon-height="36.44"
    >
      {{props.amountOfCoins}}
    </MoleculesRoadmapStatUnit>
  </div>
</template>

<script lang="ts" setup>
export interface StatsProps {
  questHeaderLabel: string,
  amountOfCoins: string
}

const props = defineProps<StatsProps>()
</script>

<style lang="sass" scoped>

</style>