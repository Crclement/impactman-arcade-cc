<template>
  <div>
    <MoleculesRoadmapQuestList :quest-list="questList" />
    <MoleculesRoadmapQuestLabel>
      <slot></slot>
    </MoleculesRoadmapQuestLabel>
  </div>
</template>

<script lang="ts" setup>
export interface QuestProps {
  questList: Array<string>
}

const props = defineProps<QuestProps>()
</script>

<style lang="sass" scoped>
//
</style>