<template>
  <AtomsPixelatedBox class="mb-1.5 py-7 px-6 bg-accentBlue">
    <div class="w-full">
      <img :src="props.src" class="w-full" />
    </div>
  </AtomsPixelatedBox>
</template>

<script lang="ts" setup>
export interface ImageProps {
  src: string,
}

const props = defineProps<ImageProps>()
//
</script>

<style lang="sass" scoped>
</style>