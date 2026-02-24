<template>
  <div class="relative">
    <div v-show="!loading">
      <slot />
    </div>
    <TransitionRoot
      :show="loading"
      enter="transition-opacity duration-75"
      enter-from="opacity-0"
      enter-to="opacity-100"
      leave="transition-opacity duration-150"
      leave-from="opacity-100"
      leave-to="opacity-0"
    >
      <div class="page-loading">
        <AtomsLogo class="logo" />
      </div>
    </TransitionRoot>
  </div>
</template>

<script lang="ts" setup>
import { TransitionRoot } from '@headlessui/vue'
const loading = ref(true)
const overflow = computed(() => (loading.value ? 'overflow-hidden' : 'overflow-auto'))

watch(
  loading,
  () => {
    useHead({
      bodyAttrs: {
        class: overflow.value
      }
    })
  }
)

onMounted(async () => {
  await WaitForFontFamilyLoaded(['Kontesa'])
  loading.value = false
})
</script>

<style lang="sass" scoped>
.page-loading
  background: #B5F1FF

  @apply fixed top-0 left-0 w-full h-screen grid place-content-center z-10
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