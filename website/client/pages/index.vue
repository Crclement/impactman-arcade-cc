<template>
  <div class="homepage__gradient-bg">
    <img src="/images/homepage/hero/bg.svg" class="absolute w-full -top-16 z-0 hidden md:block"/>
    <div class="absolute w-full top-[40px] z-0 homepage__image-bg block md:hidden"></div>
    <div class="">
      <div class="container">
        <TemplatesHero />

        <TemplatesPlayGames />

        <TemplatesCasualGames />

        <TemplatesGameSelector class="mb-[120px]" />

        <MoleculesSectionHeadingAnimated
          image-icon-src="/images/coins.svg"
          image-icon-width="130"
          image-icon-height="58"
          image-icon-max-width="224"
          class="mb-7"
        />

        <MoleculesMarqueeGamesChangeWorld class="mb-10 xl:mb-[155px]" />

        <TemplatesHowItWorks />

        <MoleculesMarqueePlayImpact class="mb-6" />

        <TemplatesScoreboard class="mb-[142px] xl:mb-[101px]"/>

        <TemplatesOurVision class="mb-[15px] xl:mb-[18px]"/>

        <TemplatesRoadmap class="mb-[18px] xl:mb-[14px]"/>

        <TemplatesFooter class="mb-[18px] xl:mb-[15px]" />

        <TemplatesHaveFun/>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// Redirect to game page (for kiosk mode)
navigateTo('/games/impactman', { replace: true })
</script>

<style lang="sass" scoped>
.homepage__gradient-bg
  background: linear-gradient(157.64deg, #B7DDE7 12.88%, #FAE5ED 66.19%)

.homepage__image-bg
  width: 928.11px
  height: 394.15px
  background: url(/images/homepage/hero/bg.svg)
  background-repeat: no-repeat
  background-size: cover
  background-position: top left
  @screen xl
    width: 100%
    height: 611.15px
</style>