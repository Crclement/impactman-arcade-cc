<template>
  <AtomsBox :no-round=true :size=0 class="title-box py-4 mb-3.5 bg-white">
    <p class="font-kontesa text-limeGreen tracking-tight text-4xl leading-9 uppercase text-border-color text-center">
      <slot></slot>
    </p>
  </AtomsBox>
</template>

<script lang="ts" setup>

</script>

<style lang="sass" scoped>
.text-border-color
  -webkit-text-stroke-width: 1.6px
  -webkit-text-stroke-color: #242A53
.title-box
  border: 4.70721px solid #16114F
  box-shadow: 0px 3px 0px #16114F
  border-radius: 9.41441px

</style>