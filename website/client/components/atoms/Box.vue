<template>
  <div
    class="w-full"
    :class="`box-${props.size} ${color} ${!props.noRound ? 'rounded-sm md:rounded-lg lg:rounded-2lg' : ''}`"
    :style="{
      'color': props.color
    }"  
    >
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
export interface BoxProps {
  color?: string
  size?: number,
  noRound?: boolean
}

const props = withDefaults(defineProps<BoxProps>(), {
  color: '#16114F', // Hex or Tailwind color
  size: 3
})
</script>

<style lang="sass" scoped>
@use "sass:math"

@for $i from 1 through 6
  .box-#{$i}
    box-shadow: 0px #{$i}px 0px
    border: #{math.div($i, 2)}px solid
    @screen md
      border: #{$i}px solid
      box-shadow: 0px #{$i*2}px 0px
</style>