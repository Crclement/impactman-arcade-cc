<template>
  <span class="summary-item-text relative">
    <AtomsTextWithBorderOutside border-color="#000000" font-color="#000000" class="z-20 leading-none">
      <span class="w-full h-full inline-block relative">
        <span :style="{ top: '4px' }" class="relative">
          <slot></slot>
        </span>
        <AtomsTextWithBorderOutside border-color="#5935B4" :style="{ top: '2px' }"
          class="absolute top-0 left-0 leading-none z-0">
          <slot></slot>
        </AtomsTextWithBorderOutside>
        <AtomsTextWithBorderOutside class="absolute top-0 left-0 leading-none z-10">
          <slot></slot>
        </AtomsTextWithBorderOutside>
      </span>
    </AtomsTextWithBorderOutside>
  </span>
</template>

<style lang="sass" setup>
.summary-item-text
  font-size: 45px
  @apply relative ml-4 grid place-content-center leading-none
</style>