<template>
  <div class="hamburguer-menu">
    <div :class="{ 'is-open': props.open }" class="flex flex-col gap-1.5 md:gap-2">
      <div class="bar" />
      <div class="bar" />
      <div class="bar" />
    </div>
  </div>
</template>

<script lang="ts" setup>
export interface HamburguerMenuProps {
  open: boolean
}

const props = defineProps<HamburguerMenuProps>();
</script>

<style lang="sass" scoped>
.hamburguer-menu
  @apply cursor-pointer
  .is-open
    .bar:nth-child(1)
      transform: translateY(9.9px) rotate(45deg)

      @screen md
        transform: translateY(13px) rotate(45deg)
    .bar:nth-child(2)
      opacity: 0
    .bar:nth-child(3)
      transform: translateY(-9.9px) rotate(-45deg)

      @screen md
        transform: translateY(-13px) rotate(-45deg)
.bar
  width: 23px
  height: 4px
  border-radius: 3px
  @apply bg-navyBlue transition-all

  @screen md
    width: 30px
    height: 5px
</style>