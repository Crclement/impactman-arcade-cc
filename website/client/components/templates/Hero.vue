<template>
  <div class="container h-[213px] xl:h-[411px] flex justify-center relative mb-11 xl:overflow-x-visible">
    <div class="absolute top-[61px] xl:top-0">
      <p class="kontesa__title font-kontesa uppercase text-[61px] leading-[74px]">Impact</p>
      <p class="retro__title font-retro uppercase text-[76px] leading-[71px] absolute top-9 left-1/2 ml-1 transform -translate-x-1/2">Arcade</p>
    </div>
    <!-- clouds -->
    <img src="/images/homepage/hero/cloud.svg" class="cloud-top__size absolute top-[17px] left-[4.53px] xl:hidden" />
    <img src="/images/homepage/hero/cloud.svg" class="cloud-top__size absolute top-0 right-[63px] xl:hidden" />
    <img src="/images/homepage/hero/cloud.svg" class="cloud-bottom__size-left absolute bottom-[19px] -left-10 xl:top-5 xl:-left-20" />
    <img src="/images/homepage/hero/cloud.svg" class="cloud-bottom__size-right absolute bottom-[21.74px] -right-10 xl:-bottom-28 xl:-right-16 xl:z-10" />
    <!-- floating notes -->
    <img src="/images/homepage/hero/floating_note_trees.svg" class="floating-note-trees__size absolute top-16 left-7 xl:top-5 xl:left-auto xl:right-[450px]" />
    <img src="/images/homepage/hero/floating_note_plastic.svg" class="floating-note-plastic__size absolute top-11 right-3 xl:top-auto xl:-bottom-5 xl:right-28 xl:z-20" />
    <img src="/images/homepage/hero/floating_note_rainforest.svg" class="floating-note-rainforest__size absolute bottom-0 xl:left-10 xl:top-64" />
  </div>
</template>

<script lang="ts" setup>

</script>

<style lang="sass" scoped>
.kontesa__title
  background: linear-gradient(178.62deg, #D9FF69 26.71%, rgba(255, 255, 255, 0) 76.73%)
  background-clip: text
  -webkit-background-clip: text
  -webkit-text-fill-color: transparent
  -webkit-text-stroke-width: 2px
  -webkit-text-stroke-color: #16114F
  letter-spacing: -0.04em

  @screen xl
    font-size: 210px
    line-height: 250px

    -webkit-text-stroke-width: 5.96156px // border on Figma

.retro__title
  color: #D9FF69
  text-shadow: 0px 3px 0px #5935B4, 0px 8px 0px #000000
  -webkit-text-stroke-width: 2px
  -webkit-text-stroke-color: #16114F
  letter-spacing: -0.05em

  @screen xl
    font-size: 260px
    line-height: 308px

    -webkit-text-stroke-width: 7.10569px // border on Figma
    text-shadow: 0px 7px 0px #5935B4, 0px 19.8719px 0px #000000

    margin-top: 70px

.cloud-top__size
  width: 60.12px
  height: 30.93px

.cloud-bottom__size-left
  width: 78.91px
  height: 49.6px
  @screen xl
    width: 247.99px
    height: 127.6px

.cloud-bottom__size-right
  width: 78.91px
  height: 49.6px
  @screen xl
    width: 391.85px
    height: 201.62px

.floating-note-trees__size
  width: 96.81px
  height: 22.34px
  @screen xl
    width: 208px
    height: 48px

.floating-note-plastic__size
  width: 173.13px
  height: 22.34px
  @screen xl
    width: 391.95px
    height: 201.62px
.floating-note-rainforest__size
  width: 193.61px
  height: 22.34px
  @screen xl
    width: 416px
    height: 48px
</style>