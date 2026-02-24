<template>
    <div class="relative py-10 md:py-0">
      <AtomsBox class="absolute md:relative top-0 md:top-0 -left-2 md:-left-0 border-l-0 md:border-l-2 border-r-0 md:border-r-2 w-screen md:w-full overflow-x-hidden py-2 bg-white border-2 border-navyBlue boxShadow" :size=0 no-round>
        <div class="marquee__animation select-none w-max flex gap-12">
          <!-- 1st batch -->
          <div class="flex gap-12 w-fit">  
            <div class="flex justify-center items-center">
              <img src="/images/homepage/marquee/marquee_play2impact/play2impact_icon.svg" width="34" height="34" class="mr-3" />
              <span class="text-lg uppercase whitespace-nowrap">Play2Impact</span>
            </div>
  
            <div class="flex justify-center items-center">
              <img src="/images/homepage/marquee/marquee_play2impact/play2impact_icon.svg" width="34" height="34" class="mr-3" />
              <span class="text-lg uppercase whitespace-nowrap">Play2Own</span>
            </div>

            <div class="flex justify-center items-center">
              <img src="/images/homepage/marquee/marquee_play2impact/play2impact_icon.svg" width="34" height="34" class="mr-3" />
              <span class="text-lg uppercase whitespace-nowrap">Play2Impact</span>
            </div>

            <div class="flex justify-center items-center">
              <img src="/images/homepage/marquee/marquee_play2impact/play2impact_icon.svg" width="34" height="34" class="mr-3" />
              <span class="text-lg uppercase whitespace-nowrap">Play2Own</span>
            </div>

            <div class="flex justify-center items-center">
              <img src="/images/homepage/marquee/marquee_play2impact/play2impact_icon.svg" width="34" height="34" class="mr-3" />
              <span class="text-lg uppercase whitespace-nowrap">Play2Impact</span>
            </div>

            <div class="flex justify-center items-center">
              <img src="/images/homepage/marquee/marquee_play2impact/play2impact_icon.svg" width="34" height="34" class="mr-3" />
              <span class="text-lg uppercase whitespace-nowrap">Play2Own</span>
            </div>

            <div class="flex justify-center items-center">
              <img src="/images/homepage/marquee/marquee_play2impact/play2impact_icon.svg" width="34" height="34" class="mr-3" />
              <span class="text-lg uppercase whitespace-nowrap">Play2Impact</span>
            </div>
          </div>
          <!-- 2nd batch -->
          <div class="flex gap-12 w-fit">  
            <div class="flex justify-center items-center">
              <img src="/images/homepage/marquee/marquee_play2impact/play2impact_icon.svg" width="34" height="34" class="mr-3" />
              <span class="text-lg uppercase whitespace-nowrap">Play2Impact</span>
            </div>
  
            <div class="flex justify-center items-center">
              <img src="/images/homepage/marquee/marquee_play2impact/play2impact_icon.svg" width="34" height="34" class="mr-3" />
              <span class="text-lg uppercase whitespace-nowrap">Play2Own</span>
            </div>

            <div class="flex justify-center items-center">
              <img src="/images/homepage/marquee/marquee_play2impact/play2impact_icon.svg" width="34" height="34" class="mr-3" />
              <span class="text-lg uppercase whitespace-nowrap">Play2Impact</span>
            </div>

            <div class="flex justify-center items-center">
              <img src="/images/homepage/marquee/marquee_play2impact/play2impact_icon.svg" width="34" height="34" class="mr-3" />
              <span class="text-lg uppercase whitespace-nowrap">Play2Own</span>
            </div>

            <div class="flex justify-center items-center">
              <img src="/images/homepage/marquee/marquee_play2impact/play2impact_icon.svg" width="34" height="34" class="mr-3" />
              <span class="text-lg uppercase whitespace-nowrap">Play2Impact</span>
            </div>

            <div class="flex justify-center items-center">
              <img src="/images/homepage/marquee/marquee_play2impact/play2impact_icon.svg" width="34" height="34" class="mr-3" />
              <span class="text-lg uppercase whitespace-nowrap">Play2Own</span>
            </div>

            <div class="flex justify-center items-center">
              <img src="/images/homepage/marquee/marquee_play2impact/play2impact_icon.svg" width="34" height="34" class="mr-3" />
              <span class="text-lg uppercase whitespace-nowrap">Play2Impact</span>
            </div>
          </div>
        </div>
      </AtomsBox>
    </div>
  </template>
  
  <script lang="ts" setup>
  
  </script>
  
  <style lang="sass" scoped>
  .marquee__animation
    will-change: transform
    animation: marquee 12000ms linear infinite
  
  @keyframes marquee
    from
      transform: translateX(0)
    to
      transform: translateX(calc(-50% - 24px))
  
  .boxShadow 
    // setting shadow only for desktop inside AtomsBox
    // is trickier than just inserting classes from
    // the parent so this was done as a shortcut
    @screen md
      @apply rounded-lg border-4 border-navyBlue
      filter: drop-shadow(0px 5px 0px #242A53)
  
  </style>