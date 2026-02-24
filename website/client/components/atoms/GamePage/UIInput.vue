<template>
  <input class="ui-input w-full"/>
</template>

<script lang="ts" setup>
const test = ref('')
</script>

<style lang="sass" scoped>
.ui-input
  text-align: left
  border-bottom: 3px solid
  @apply outline-none border-blue bg-transparent py-2 uppercase font-bold
  &::placeholder
   text-align: left
   @apply text-blue
</style>