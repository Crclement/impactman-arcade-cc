<template>
  <div class="mb-[120px] text-center">
      <!-- Title -->
    <AtomsTextWithBorderOutside
      class="textShadow font-kontesa text-[100px] xl:text-[114px] leading-[92px] xl:leading-[90px] mb-10 xl:mb-[88px]"
      :borderSize=10
    >
      How It<br> Works
    </AtomsTextWithBorderOutside>
    <div class="remove-scrollbar w-full grid grid-flow-col xl:place-content-center auto-cols-max gap-10 xl:gap-14 overflow-x-auto xl:overflow-visible mandatory-scroll-snapping">

      <div class="relative">
        <OrganismsHowItWorksStep
          title="Play Games"
          coverImageSrc="/images/homepage/how-it-works/arcade.png"
          class="xl:mr-0.5"
        />
        <img 
          src="/images/homepage/how-it-works/pipe.png" 
          width="58" 
          height="87" 
          class="pipe__size absolute bottom-20 -right-10 xl:bottom-4 xl:-right-14" />
      </div>

      <div class="relative">
        <OrganismsHowItWorksStep
          title="Make an Impact"
          coverImageSrc="/images/homepage/how-it-works/boat.png"
          class="xl:mr-0.5"
        />
        <img 
          src="/images/homepage/how-it-works/pipe.png" 
          width="58" 
          height="87" 
          class="pipe__size absolute bottom-20 -right-10 xl:bottom-24 xl:-scale-y-100 xl:-right-14"
        />
      </div>

      <div class="relative">
        <OrganismsHowItWorksStep
          title="Earn Tickets"
          coverImageSrc="/images/homepage/how-it-works/tickets.png"
          class="xl:mr-0.5"
        />
        <img
          src="/images/homepage/how-it-works/pipe.png" 
          width="58"
          height="87"
          class="pipe__size absolute bottom-20 -right-10 xl:bottom-44 xl:-right-14"
        />
      </div>

      <div class="relative">
        <OrganismsHowItWorksStep
          title="Win Prizes"
          coverImageSrc="/images/homepage/how-it-works/skates.png"
          class=""
        />
      </div>

    </div>
  </div>
</template>

<script lang="ts" setup>

</script>

<style lang="sass" scoped>
.text-shadow
  text-shadow: 0px 2.51551px 0px #5935B4, 0px 5.03103px 0px #16114F
.text-border-color
  -webkit-text-stroke-width: 2.51551px
  -webkit-text-stroke-color: #16114F

.pipe__size
  width: 41.3px
  height: 62px
  @screen xl
    width: 57.95px
    height: 87px

.mandatory-scroll-snapping
  scroll-snap-type: x mandatory
  @screen xl
    scroll-snap-type: none
.remove-scrollbar
  scrollbar-width: none // on Firefox
  -ms-overflow-style: none // on IE
  &::-webkit-scrollbar // on Webkit
    width: 0
    height: 0
.textShadow
  filter: drop-shadow(0px 3.914285659790039px 0px #ffffff) drop-shadow(0px 4.828571319580078px 0px #242A53)

  @screen xl
    filter: drop-shadow(0px 3px 0px #ffffff) drop-shadow(0px 5px 0px #242A53)
</style>