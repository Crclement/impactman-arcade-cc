<template>
  <AtomsBox :size="2" no-round class="rounded-[10px] overflow-hidden flex justify-center items-center bg-navyBlue">
    <button 
      class="period-btn"
    >
      All Time
    </button>
    <button 
      class="active period-btn"
    >
      This Week
    </button>
    <button 
      class="period-btn"
    >
      This Month
    </button>
  </AtomsBox>
</template>

<script lang="ts" setup>

</script>

<style lang="sass" scoped>
.period-btn
  box-shadow: 0px 2px 0px #16114F
  border-radius: 10px
  @apply transition-all	border-[2px] border-navyBlue text-center uppercase text-[11.5px] leading-[13px] tracking-[-0.02em] xl:text-[22px] xl:leading-[24px] bg-rose py-1.5 xl:py-3.5 w-full

  &:hover
    @apply translate-y-0.5
.active
  @apply bg-green
</style>