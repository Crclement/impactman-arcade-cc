<template>
  <div v-if="modelValue" class="gamepage-modal">
    <div @click="closable && emit('update:modelValue', false)" class="overlay">

    </div>

    <div class="content">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
export interface GamePageModalProps {
  modelValue: boolean,
  closable: boolean
}

const props = withDefaults(defineProps<GamePageModalProps>(), {
  modelValue: false,
  closable: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()
</script>

<style lang="sass" scoped>
.gamepage-modal
  @apply fixed top-0 left-0 w-screen h-screen z-[100] flex items-center justify-center
  .overlay
    background-color: rgba(30,61,144, 0.5)
    @apply absolute w-full h-full backdrop-blur
  .content
    @apply relative z-10
</style>