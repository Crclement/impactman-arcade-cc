<template>
  <AtomsBox class="subheading__background flex py-3 overflow-x-hidden lg:overflow-visible">
    <div class="buy-tokens__animation flex justify-between items-center gap-16 lg:mx-auto">
      <div class="flex gap-16 xl:gap-5 w-fit">
        <img
          :src="props.imageIconSrc"
          :width="props.imageIconWidth"
          :height="props.imageIconHeight"
          :style="{'max-width': props.imageIconMaxWidth + 'px'}"
          class="2xl:w-full"
        />
        <!-- ▲ here max-width is dependent of xl:w-full to display desktop icons -->
        <div class="flex items-center">
          <AtomsTextWithBorderOutside class="font-kontesa uppercase mx-5 whitespace-nowrap text-6xl lg:text-7xl 2xl:text-[115px] text-green tracking-tight">
            <span class="buy-tokens__text">Buy some tokens</span>
          </AtomsTextWithBorderOutside>
        </div>
        <img 
          :src="props.imageIconSrc" 
          :width="props.imageIconWidth" 
          :height="props.imageIconHeight"
          :style="{
        'max-width': props.imageIconMaxWidth + 'px'}"
          class="2xl:w-full 2xl:-scale-x-100"
        />
        <!-- ▲ here max-width is dependent of xl:w-full to display desktop icons -->
        <!-- -scale-x-100 flips image horizontally -->
      </div>

      <div class="lg:hidden flex gap-16 w-fit" aria-hidden="true">
        <div class="flex items-center">
          <AtomsTextWithBorderOutside class="buy-tokens__text font-kontesa uppercase mx-5 whitespace-nowrap text-6xl lg:text-7xl 2xl:text-[115px] text-green tracking-tight">
            Buy some tokens
          </AtomsTextWithBorderOutside>
        </div>
        <img 
          :src="props.imageIconSrc" 
          :width="props.imageIconWidth" 
          :height="props.imageIconHeight"
          :style="{
        'max-width': props.imageIconMaxWidth + 'px'}"
          class="2xl:w-full 2xl:-scale-x-100"
        />
        <!-- ▲ here max-width is dependent of xl:w-full to display desktop icons -->
        <!-- -scale-x-100 flips image horizontally -->
      </div>
    </div>
  </AtomsBox>
</template>
  
<script lang="ts" setup>

export interface SubheadingProps {
  imageIconSrc: string,
  imageIconWidth: string,
  imageIconHeight: string,
  imageIconMaxWidth?: string,
  hideBlueMark?: boolean
}

const props = withDefaults(defineProps<SubheadingProps>(), {
  imageIconMaxWidth: 'none',
  hideBlueMark: false
})
</script>
  
<style lang="sass" scoped>
.subheading__background
  background: linear-gradient(180deg, #C7EBF2 0%, #86D5E7 100%)

.buy-tokens__text
  @screen xl
    text-shadow: 5px 0 #16114F, -5px 0 #16114F, 2px 5px #16114F, 0 -5px #16114F, 5px 0px #16114F, -5px -5px #16114F,5px -5px #16114F, -5px 5px #16114F

.buy-tokens__animation
  will-change: transform
  animation: slider 5s linear infinite

  @keyframes slider
    from
      transform: translateX(0)
    to
      transform: translateX(-45.731303%)

  @screen lg
    animation: none
  </style>