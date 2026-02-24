<template>
  <button :class="`UIButton text-sm py-1.5 px-4 border-2 border-[#16114F] ${$attrs.class}`">
    <slot></slot>
  </button>
</template>

<script lang="ts" setup>

</script>

<style lang="sass" scoped>
.UIButton
  box-shadow: 0px 3px 0px #0C092B
  border-radius: 10px

  @apply uppercase font-bold
</style>