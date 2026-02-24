<template>
  <AtomsBox class="bg-accentYellowishGreen px-2 pt-1.5 rounded-sm boxShadow" :no-round=true :size=1>
    <span class="block tracking-tight uppercase text-[8.3px]">{{props.boxLabel}}</span>
    <div class="flex justify-center font-kontesa text-[52px] leading-none gap-1.5">
      <img
        :src="props.imageIconSrc"
        :width="props.imageIconWidth"
        :height="props.imageIconHeight"  
      />
      <slot></slot>
    </div>
  </AtomsBox>
</template>

<script lang="ts" setup>
export interface StatUnitProps {
  boxLabel: string,
  imageIconSrc: string,
  imageIconWidth: string,
  imageIconHeight: string
}

const props = defineProps<StatUnitProps>()
</script>

<style lang="sass" scoped>
.boxShadow
  filter: drop-shadow(0px 2px 0px rgba(22,17,79,1))
  border: 2px solid #16114F
</style>