<template>
  <button
    class="btn text-navyBlue py-2 px-3 md:px-4 md:py-3 rounded-sm md:rounded-md text-center leading-none transition-all">

    <slot></slot>
  </button>
</template>

<script lang="ts" setup>
export interface BtnProps {
  color?: string
}

const props = withDefaults(defineProps<BtnProps>(), {
  color: '#16114F'
})
</script>

<style lang="sass" scoped>
.btn
  border: 2px solid

  @screen md
    border: 3px solid

  &:active
    box-shadow: 0px 1px 0px
    transform: translateY(2px)
</style>