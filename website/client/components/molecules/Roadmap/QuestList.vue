<template>
  <AtomsPixelatedBox class="h-[186.18px] xl:h-[183.17px] pl-2.5 pt-4 bg-snowWhite">
    <li
      v-for="(item, index) in props.questList"
      :key="index"
      class="list-none text-[15px] opacity-50"
    >
      {{item}}
  </li>
  </AtomsPixelatedBox>
</template>

<script lang="ts" setup>
export interface QuestListProps {
  questList: Array<string>
}

const props = defineProps<QuestListProps>()
</script>

<style lang="sass" scoped>
//
</style>