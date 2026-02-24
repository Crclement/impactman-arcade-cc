<template>
  <AtomsBox class="bg-gradient-blue px-5 pt-[34px] pb-[71px] flex flex-col justify-center xl:flex-row xl:justify-between xl:items-start xl:pt-11 xl:pb-[72px]" :size=4>
    <!-- title -->
    <div>
      <p class="text-4xl xl:text-[22px] uppercase text-center pb-[26px] xl:pb-[64px] font-bold tracking-tight">Impact Arcade</p>
      <!-- icons -->
      <!-- TODO ADD ANCHOR TO URL -->
      <OrganismsFooterIcons 
        twitter-icon-src="/images/homepage/footer/icon_twitter.svg" 
        arcade-icon-src="/images/homepage/footer/icon_arcade.svg" 
        class="mb-12"
        />
    </div>
    <!-- links -->
    <OrganismsFooterLinks :links-list="linkList" class="mb-14 xl:mb-0" />
    <!-- email -->
    <MoleculesFooterEmailForm class="mb-12" />
    <!-- button -->
    <!-- TODO PIXELATED BUTTON -->
    <AtomsBtn class="btn__border uppercase text-3xl bg-green py-4 px-[102px] xl:px-[76px] xl:py-[52px] hidden md:block">
      Play!
    </AtomsBtn>
    <AtomsPixelatedBox class="btn__border uppercase text-3xl bg-green py-2 px-[102px] xl:px-[76px] xl:py-[52px] md:hidden">
      Play!
    </AtomsPixelatedBox>
  </AtomsBox>
</template>

<script lang="ts" setup>

const linkList = ["Home", "Log In", "Join", "Prize Booth", "Faq"]
</script>

<style lang="sass" scoped>
.footer__bg
  background: linear-gradient(128.51deg, #C7EAF2 14.63%, #86D5E7 79.6%)
.btn__border
  filter: drop-shadow(0px 5px 0px rgba(22,17,79,1))
</style>