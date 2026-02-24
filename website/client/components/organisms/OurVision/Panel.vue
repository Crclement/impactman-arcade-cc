<template>
  <AtomsBox class="pt-[61px] xl:pt-20 px-3 mb-[18px] image__container">
    <AtomsCustomTextFont class="text__drop-shadow font-kontesa text-center leading-[53px] text-[67px] xl:text-[207px]  xl:leading-[180px] pb-[161px] xl:pb-24">
      <div class="flex items-center">
        <span class="ml-10 mr-5 xl:mr-20 xl:ml-0">One</span>
        <img src="/images/homepage/our-vision/ape-cool.png" class="xl:-mt-3 xl:mr-[12px] hidden xl:inline" width="145" height="140"/>Billion
      </div>
      <div>
        Gamers Pwning <br class="hidden xl:block"/>
        Humanity's <br class="hidden xl:block"/>
        Biggest <br class="hidden xl:block"/>
        Challenges
      </div>
    </AtomsCustomTextFont>
  </AtomsBox>
</template>

<script lang="ts" setup>

</script>

<style lang="sass" scoped>
.image__container
  background-image: url(/images/homepage/our-vision/ocean.jpg), url(/images/homepage/our-vision/pixelation.png)
  background-blend-mode: overlay
  background-position: 50% 100%
  display: block
  background-size: cover
  height: 100%
  width: auto
.text__drop-shadow
  filter: drop-shadow(0px 2px 0px rgba(255,255,255, 1))
  @screen xl
    filter: drop-shadow(0px 6px 0px rgba(22,17,79,1))
</style>