<template>
  <span class="inline-block relative z-50">
    <span class="inline-block relative z-10 uppercase text-shadow text-border-color">
      <span class="relative z-20" :style="frontStyle">
        <slot></slot>
      </span>
      <span :style="backStyle" class="absolute top-0 left-0 z-10">
        <slot class=""></slot>
      </span>
    </span>
  </span>
</template>

<script lang="ts" setup>
export interface TitleProps {
  fontColor?: string,
  borderColor?: string,
  borderSize?: number
}

const props = withDefaults(defineProps<TitleProps>(), {
  fontColor: '#D9FF69',
  borderColor: '#16114F',
  borderSize: 6
})

const frontStyle = computed(() => ({
  color: props.fontColor,
  '-webkit-text-stroke-width': `${props.borderSize/8}px`,
  '-webkit-text-stroke-color': `${props.borderColor}`,
}))

const backStyle = computed(() => ({
  color: 'transparent',
  '-webkit-text-stroke-width': `${props.borderSize}px`,
  '-webkit-text-stroke-color': `${props.borderColor}`
}))
</script>
