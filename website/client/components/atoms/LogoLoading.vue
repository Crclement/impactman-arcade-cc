<template>
  <TransitionRoot
    :show="loading"
    enter="transition-opacity duration-75"
    enter-from="opacity-0"
    enter-to="opacity-100"
    leave="transition-opacity duration-150"
    leave-from="opacity-100"
    leave-to="opacity-0"
  >
    <div class="logo-loading">
      <AtomsLogo class="logo" />
    </div>
  </TransitionRoot>
</template>

<script lang="ts" setup>
import { TransitionRoot } from '@headlessui/vue'

const props = defineProps<{ loading: boolean }>()
</script>

<style lang="sass" scoped>
.logo-loading
  background: #4D8BEC
  width: calc(100% - 8px)
  height: calc(100% - 8px)
  top: 4px
  left: 4px

  @apply absolute grid place-content-center z-10 rounded-lg backdrop-blur	
  .logo
    animation: logo-animation 500ms ease-in-out infinite

@keyframes logo-animation
  0%
    transform: scale(1)
  50%
    transform: scale(1.3)
  100%
    transform: scale(1)
</style>