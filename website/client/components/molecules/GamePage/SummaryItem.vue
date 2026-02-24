<template>
  <AtomsBox :size="props.size" no-round class="summary-item text-lg rounded-md summary-item bg-white flex overflow-hidden">
    <div class="flex justify-start font-agrandir label bg-green text-left">
      <div class="flex w-full font-bold">
        <slot name="label">
          
        </slot>
      </div>
    </div>
    <div font-color="#D9FF69" class="value font-kontesa">
      <slot name="value">
        
      </slot>
    </div>
  </AtomsBox>
</template>

<script lang="ts" setup>
export interface SummaryItemProps {
  size: number
}

const props = withDefaults(defineProps<SummaryItemProps>(), {
  size: 3
})
</script>

<style lang="sass" scoped>
.summary-item
  @apply text-center
  .label
    width: 40%
    border-right: 3px solid
    font-feature-settings: 'case' on
    @apply border-navyBlue text-xs py-2 uppercase leading-none
</style>