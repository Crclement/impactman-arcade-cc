<template>
  <AtomsPixelatedBox class="bg-white mb-1.5 border-0 py-6 text-center">
    <AtomsTextWithBorderOutside class="font-retro text-[35px] leading-none text-center textShadow" :border-size=4>
      <slot></slot>
    </AtomsTextWithBorderOutside>
  </AtomsPixelatedBox>
</template>

<script lang="ts" setup>

</script>

<style lang="sass" scoped>
.textShadow
  text-shadow: 0px 3px 0px #5935B4, 0px 7px 0px #16114F
</style>