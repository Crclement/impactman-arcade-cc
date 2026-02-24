<template>
  <div>
    <p class="uppercase text-center xl:text-left text-[22px] mb-4">Fun</p>
    <div v-for="(link, index) in linksList" :key="index" class="text-center xl:text-left opacity-50">
      <p class="text-[22px] tracking-tight xl:text-base leading-9">{{link}}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
export interface LinksProps {
  linksList: Array<string>
}

const props = defineProps<LinksProps>()
</script>

<style lang="sass" scoped>
//
</style>