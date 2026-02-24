<template>
  <div :class="`box ${color}`" :style="{ 'color': props.color }">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
export interface BoxProps {
  color?: string
}

const props = withDefaults(defineProps<BoxProps>(), {
  color: '#16114F' // Hex or Tailwind color
})
</script>

<style lang="sass" scoped>

@function pixel-borders-image($corner-size, $color)
  $svg: ''
  $svg-path: ''
  $svg-size: $corner-size * 6
  $color: str-replace('' + $color, '#', '%23')

  @if $corner-size == 1
    $svg-path: 'M0 2h2v2H0zM2 0h2v2H2zM4 2h2v2H4zM2 4h2v2H2z'
  @else
    $svg-path: 'M2 2h2v2H2zM4 0h2v2H4zM10 4h2v2h-2zM0 4h2v2H0zM6 0h2v2H6zM8 2h2v2H8zM8 8h2v2H8zM6 10h2v2H6zM0 6h2v2H0zM10 6h2v2h-2zM4 10h2v2H4zM2 8h2v2H2z'

  $svg: 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'#{$svg-size}\' height=\'#{$svg-size}\'><path d=\'#{$svg-path}\' fill=\'#{$color}\' /></svg>'

  @return $svg

@function str-replace($string, $search, $replace: '')
  $index: str-index($string, $search)

  @if $index
    @return str-slice($string, 1, $index - 1) + $replace + str-replace(str-slice($string, $index + str-length($search)), $search, $replace)

  @return $string

@mixin pixel-borders($corner-size: 2, $border-size: 5px, $border-color: #16114F, $border-inset-color: false)
  @supports (border-image-source: none)
    border-radius: ($border-size * ($corner-size + 2)) + ($corner-size * 2)

  // outline: dashed
  border-style: solid
  border-width: $border-size
  border-color: $border-color

  border-image-slice: $corner-size * 2
  border-image-width: $corner-size
  border-image-outset: 0

  border-image-source: url(pixel-borders-image($corner-size, $border-color))

  @if $border-inset-color 
    @include pixel-inset-border($border-size, $border-inset-color)

.box
  @include pixel-borders
  @apply w-full lg:rounded-2lg md:rounded-lg rounded-sm
</style>