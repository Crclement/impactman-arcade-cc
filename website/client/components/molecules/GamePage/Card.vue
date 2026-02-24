<template>
  <div class="game-card">
    <AtomsBox no-round class="game-card__title font-kontesa rounded-xl py-2 px-5 bg-green text-[45px] leading-none">
      {{ props.title }}
    </AtomsBox>
    <AtomsBox v-if="!noBackground" no-round :class="{'p-1.5': !noPadding}" class="rounded-xl bg-white">
      <slot></slot>
    </AtomsBox>
    <div v-else no-round :class="{'p-1.5': !noPadding}" class="rounded-xl">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  title: string,
  noPadding?: boolean,
  noBackground?: boolean
}>()
</script>
