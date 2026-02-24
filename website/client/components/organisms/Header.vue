<template>
<div class="relative">
    <AtomsBox class="z-10 header-container border-2 border-navyBlue" :size=0 no-round>
      <div class="flex justify-between items-center w-full">
        <AtomsHamburguerMenu :open="open" @click="open = !open"/>
        <AtomsLogo />
        <div class="btn-container">
          <AtomsAvatar class="hidden md:block" />
          <NuxtLink to="/games/impactman">
            <AtomsBtn class="bg-green md:text-2xl">
              PLAY!
            </AtomsBtn>
          </NuxtLink>
        </div>
      </div>
    </AtomsBox>

    <AtomsBox class="z-10 top-0 border-2 border-navyBlue" :class="[open ? 'header-container__hamburguer-toggled' : 'hidden']" no-round :size=0>
      <div class="flex justify-between items-center w-full">
        <AtomsHamburguerMenu :open="open" @click="open = !open"/>
        <AtomsLogo />
        <div class="btn-container">
          <AtomsAvatar class="hidden md:block" />
          <NuxtLink to="/games/impactman">
            <AtomsBtn class="bg-green md:text-2xl">
              PLAY!
            </AtomsBtn>
          </NuxtLink>
        </div>
      </div>
      <div :class="[ open ? 'header-container__hamburguer-links' : 'hidden' ]">
        <AtomsTextWithBorderOutside class="text-4xl md:text-2xl" font-color="#FFFFFF" :border-size=3>Log In</AtomsTextWithBorderOutside>
        <AtomsTextWithBorderOutside class="text-4xl md:text-2xl" font-color="#FFFFFF" :border-size=3>Join</AtomsTextWithBorderOutside>
        <AtomsTextWithBorderOutside class="text-4xl md:text-2xl" font-color="#FFFFFF" :border-size=3>Prize Booth</AtomsTextWithBorderOutside>
      </div>
    </AtomsBox>

    <AtomsBox :class="[ open ? 'header-container__hamburguer-links-desktop rounded-md' : 'hidden' ]" :size=0 no-round>
      <AtomsTextWithBorderOutside class="header-container__hamburguer-links-desktop__text text-2xl" font-color="#D9FF69" :border-size=2.5>Log In</AtomsTextWithBorderOutside>
      <AtomsTextWithBorderOutside class="header-container__hamburguer-links-desktop__text text-2xl" font-color="#D9FF69" :border-size=2.5>Join</AtomsTextWithBorderOutside>
      <AtomsTextWithBorderOutside class="header-container__hamburguer-links-desktop__text text-2xl" font-color="#D9FF69" :border-size=2.5>Prize Booth</AtomsTextWithBorderOutside>
    </AtomsBox>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"

const open = ref(false);
</script>

<style lang="sass" scoped>
.header-container
  display: flex
  justify-content: space-between
  align-items: center
  height: 60px
  background-color: white
  @apply relative rounded-sm md:rounded-md px-4
  box-shadow: 0px 2.98667px 0px #16114F

  @screen md
    height: 83px

.btn-container
  display: flex
  align-items: center

.chimp-img
  margin-right: 20px

.logo
  width: 38px
  height: 38px
  @apply absolute left-1/2 -translate-x-1/2

  @screen md
    width: 58px
    height: 58px

.header-container__hamburguer-toggled
  height: 332px
  @apply absolute bg-limeGreen rounded-sm md:rounded-md px-4 pt-2.5 md:pt-[9px]
  box-shadow: 0px 2.98667px 0px #16114F

  @screen md
    height: 83px
    @apply bg-white

.header-container__hamburguer-links
  @apply w-full flex flex-col items-center gap-6 pt-12
  filter: drop-shadow(0px 3px 0px #16114F) drop-shadow(0px 5px 0px #16114F)
  @screen md
    display: none

.header-container__hamburguer-links-desktop
  height: 150px
  width: 225px
  @apply hidden z-40 absolute top-24 border-4 border-navyBlue bg-limeGreen md:flex flex-col items-start gap-2 pt-4 pl-4
  filter: drop-shadow(0px 3px 0px #16114F) 

.header-container__hamburguer-links-desktop__text
  text-shadow: 0px 4.42719px 0px #16114F
  filter: drop-shadow(0px 1.42719px 0px #16114F)
  
</style>
