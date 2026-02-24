<template>
  <div class="game-wall w-full h-full absolute top-0 left-0">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>

</script>

<style lang="sass" scoped>
.game-wall
  background: linear-gradient(180.02deg, #F3B3E1 -36.79%, #FFFAFC 99.99%)
  @apply h-full w-full
</style>