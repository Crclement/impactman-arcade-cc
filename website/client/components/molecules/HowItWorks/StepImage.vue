<template>
    <img :src="props.src" />
</template>

<script lang="ts" setup>
export interface ImageProps {
  src: string,
}

const props = defineProps<ImageProps>()
</script>

<style lang="sass" scoped>
//
</style>