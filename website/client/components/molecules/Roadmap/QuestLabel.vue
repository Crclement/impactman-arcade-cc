<template>
  <AtomsPixelatedBox class="text-[32px] font-kontesa leading-none py-0.5 text-center bg-brightLilac">
    <AtomsTextWithBorderOutside class="textShadow" :borderSize=2>
      <slot></slot>
    </AtomsTextWithBorderOutside>
  </AtomsPixelatedBox>
</template>

<script lang="ts" setup>

</script>

<style lang="sass" scoped>
.textShadow
  text-shadow: 0px 1.918px 0px #5935B4, 0px 3.836px 0px #000000
</style>