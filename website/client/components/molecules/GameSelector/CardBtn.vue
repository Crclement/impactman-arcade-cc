<template>
  <AtomsPixelatedBox class="boxShadow bg-green text-center text-3xl py-7 uppercase">
    <slot></slot>
  </AtomsPixelatedBox>
</template>

<script lang="ts" setup>

</script>

<style lang="sass" scoped>
.boxShadow
  filter: drop-shadow(0px 5px 0px #242A53)
  @screen xl
    filter: drop-shadow(6.66178px  6.66178px 0px #242A53)
</style>