<template>
  <div class="flex justify-center xl:justify-start gap-x-4">
    <img :src="props.twitterIconSrc" width="79.5" height="80" />
    <img :src="props.arcadeIconSrc" width="79.5" height="80" />
  </div>
</template>

<script lang="ts" setup>
export interface IconsProps {
  twitterIconSrc: string,
  arcadeIconSrc: string
}

const props = defineProps<IconsProps>()
</script>

<style lang="sass" scoped>
//
</style>