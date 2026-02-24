<template>
  <div>
    <AtomsSectionSubheading
      image-icon-src="/images/homepage/game-selector/joystick.svg"
      image-icon-width="50"
      image-icon-height="50"
      image-icon-max-width="77"
      class="mb-6 xl:mb-24"
    >
      Games
    </AtomsSectionSubheading>

    <div class="flex justify-center items-end md:block pb-1 h-[560px] md:h-auto gap-2 w-full relative overflow-x-hidden md:overflow-visible">
      <input type="radio" name="slider" title="game1" class="slider__nav"/>
      <input type="radio" name="slider" title="game2" class="slider__nav" checked />
      <input type="radio" name="slider" title="game3" class="slider__nav"/>

      <div class="slider__inner flex justify-center items-start gap-3 md:gap-0 absolute top-0 left-0 md:static">
        <OrganismsGameSelectorCard
          title="Defender"
          coverImageSrc="/images/homepage/game-selector/river-defender.png"
          subtitle="Removes Ocean Plastic"
          btnText="In development"
          class="md:left-16 md:relative md:z-0 md:opacity-60 md:transform md:scale-[0.8]"
        />
        <OrganismsGameSelectorCard
          title="Impacman"
          coverImageSrc="/images/homepage/game-selector/impacman.png"
          subtitle="Removes Ocean Plastic"
          btnText="Play!"
          class="relative z-10"
        />
        <OrganismsGameSelectorCard
          title="Kinn"
          coverImageSrc="/images/homepage/game-selector/kinn.png"
          subtitle="Protects Rainforests"
          btnText="In development"
          class="md:right-16 md:relative md:z-0 md:opacity-60 md:transform md:scale-[0.8]"
        />
      </div>

    </div>

  </div>
</template>

<script lang="ts" setup>

</script>

<style lang="sass" scoped>
.slider__nav:checked:nth-of-type(1) ~ .slider__inner
  left: calc(0%)
.slider__nav:checked:nth-of-type(2) ~ .slider__inner
  left: -100%
.slider__nav:checked:nth-of-type(3) ~ .slider__inner
  left: calc(-200%)

.slider__inner
  width: 300%
  height: 100%
  transition: left 0.4s
  @screen md
    width: auto

.slider__nav
  width: 10px
  height: 10px
  z-index: 10
  opacity: 0.2
  background-color: #16114F
  accent-color: #16114F
  cursor: pointer
  appearance: none
  backface-visibility: hidden
  @screen md
    display: none

.slider__nav:checked
  opacity: 1
</style>