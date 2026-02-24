<template>
  <MoleculesGamePageCard no-background no-padding title="Real Impact">
    <div class="relative">
      <div class="realimpact rounded-md uppercase text-white p-5 h-64">
        <img src="/images/impact_image.png" class="absolute z-10 top-0 right-0 w-full h-full object-cover" />
      </div>
      <div class="p-6 font-bold uppercase text-white absolute top-0 z-20 left-0">
        <p>partner:</p>
        <p>ocean voyages institute</p>
        <p class="mt-4">
          impact guaranteed!
        </p>
      </div>
      <div class="absolute bottom-0 -left-5 z-0">
        <img src="/images/pipe.png" class="w-16" />
      </div>
    </div>
  </MoleculesGamePageCard>
</template>

<script lang="ts" setup>

</script>

<style lang="sass" scoped>
.realimpact

  @apply relative overflow-hidden

  .test
    content: ''
    box-shadow: 0px 50px 100px 40px rgba(0,0,0,0.75)
    top: -50px
    @apply absolute left-0 w-full h-10
  p
    font-size: 15px
    @apply relative z-10
</style>