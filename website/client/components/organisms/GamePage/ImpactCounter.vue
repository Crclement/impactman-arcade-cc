<template>
  <div class="text-navyBlue">
    <div class="text-uppercase text-5xl font-kontesa leading-none">
      {{props.impact}} BAGS
    </div>
    <AtomsBox :size="2" class="slider mb-2">
      <div class="slider-progress" :style="{'width': percentage + '%'}"></div>
    </AtomsBox>
    <div class="text-xs font-bold">
      PLASTIC REMOVED
    </div>
  </div>
</template>

<script lang="ts" setup>
export interface ImpactCounterProps {
  impact: number;
  goal: number
}

const percentage = computed(() => {
  return ((props.impact / props.goal) * 100).toFixed(0)
})

const props = defineProps<ImpactCounterProps>()
</script>

<style lang="sass" scoped>
.slider
  background: linear-gradient(128.51deg, #C7EAF2 14.63%, #86D5E7 79.6%)
  @apply h-3 overflow-hidden rounded-2lg
  .slider-progress
    @apply h-full bg-navyBlue rounded-2lg transition-all
</style>