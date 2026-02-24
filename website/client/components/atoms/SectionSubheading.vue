<template>
  <AtomsBox class="subheading__background px-6 py-5 xl:px-[105px]">
    <div class="flex justify-between items-center">
      <img
        :src="props.imageIconSrc"
        :width="props.imageIconWidth"
        :height="props.imageIconHeight"
        :style="{'max-width': props.imageIconMaxWidth + 'px'}"
        class="xl:w-full"
      />
      <!-- ▲ here max-width is dependent of xl:w-full to display desktop icons -->
      <div class="flex items-center">
        <span class="font-retro uppercase text-[22px] xl:text-4xl mr-1 xl:mr-3">
          <slot></slot>
        </span>
        <img src="/images/rectangle.svg" width="15" height="30" class="img__blue-mark" :class="{hide: hideBlueMark}"/>
      </div>
      <img 
        :src="props.imageIconSrc" 
        :width="props.imageIconWidth" 
        :height="props.imageIconHeight"
        :style="{
      'max-width': props.imageIconMaxWidth + 'px'}"
        class="xl:w-full -scale-x-100"
        />
      <!-- ▲ here max-width is dependent of xl:w-full to display desktop icons -->
      <!-- -scale-x-100 flips image horizontally -->
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
.hide
  display: none
.img__blue-mark
  width: 9px
  height: 17px
  @screen xl
    width: 15px
    height: 30px
</style>