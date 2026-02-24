<template>
  <div>
    <AtomsSectionSubheading
      image-icon-src="/images/homepage/roadmap/emoji_cool.svg"
      image-icon-width="32"
      image-icon-height="32"
      image-icon-max-width="57"
      class="mb-[18px] xl:mb-[15px]"
    >
      Roadmap
    </AtomsSectionSubheading>

    <AtomsBox class="image__background py-[30px] pb-[314px] xl:pb-16 relative xl:overflow-hidden" :size="4">

      <div class="quest__position max-w-[225px] mx-auto xl:max-w-full xl:flex xl:flex-row xl:gap-[122px] xl:ml-24">

        <OrganismsRoadmapStats
          quest-header-label="Q4"
          amount-of-coins="29"
          class="mb-8 xl:block xl:absolute xl:left-6 xl:top-9"
        />
        <div class="relative w-full xl:max-w-[201.39px]">
          <OrganismsRoadmapQuest :quest-list=questList[0].quests class="quest__box-shadow mb-[68px] xl:mb-[75px]">
            {{questList[0].period}} 
          </OrganismsRoadmapQuest>
          <!-- absolute positioned pipes -->
          <img
            src="/images/homepage/roadmap/pipes.png"
            width="69"
            height="47"
            class="pipes__size absolute -bottom-[63px] left-1/3 transform rotate-90 xl:rotate-180 xl:top-16 xl:left-auto xl:-right-32 xl:mr-1.5 xl:-scale-y-100"
          />
          <!-- desktop only - platform -->
          <div class="relative xl:mt-[135px]">
            <img
              src="/images/homepage/roadmap/emoji_cool.svg"
              width="75.76"
              height="75.76"
              class="hidden absolute left-1/3 -top-16 xl:block"
            />
            <img
              src="/images/homepage/roadmap/platform.png"
              width="234"
              height="87.27"
              class="hidden xl:block"
            />
          </div>

          <img
            src="/images/homepage/roadmap/ladder.svg"
            width="78.63"
            height="155.35"
            class="hidden xl:block xl:pb-56 xl:relative xl:-top-2 xl:left-5"
          />
        </div>

        <div class=" relative w-full xl:max-w-[201.39px]">
          <OrganismsRoadmapQuest :quest-list=questList[1].quests class="quest__box-shadow mb-[68px] xl:mb-[75px]">
            {{questList[1].period}} 
          </OrganismsRoadmapQuest>
          <!-- absolute positioned pipes -->
          <img
            src="/images/homepage/roadmap/pipes.png"
            width="69"
            height="47"
            class="pipes__size absolute -bottom-[63px] left-1/3 transform rotate-90 xl:rotate-180 xl:top-5 xl:left-auto xl:-right-32 xl:mr-1.5"
          />
          <!-- desktop only - platform -->
          <img
            src="/images/homepage/roadmap/coins-platform.png"
            width="234"
            height="87.27"
            class="hidden xl:block"
          />
        </div>

        <div class=" relative w-full xl:max-w-[201.39px]">
          <OrganismsRoadmapQuest :quest-list=questList[2].quests class="quest__box-shadow mb-[68px] xl:mb-[75px]">
            {{questList[2].period}} 
          </OrganismsRoadmapQuest>
          <!-- absolute positioned pipes -->
          <img
            src="/images/homepage/roadmap/pipes.png"
            width="69"
            height="47"
            class="pipes__size absolute -bottom-[63px] left-1/3 transform rotate-90 xl:rotate-180 xl:top-10 xl:left-auto xl:-right-32 xl:mr-1 xl:-scale-y-100"
          />
          <!-- desktop only - platform -->
          <img
            src="/images/homepage/roadmap/coins-platform.png"
            width="234"
            height="87.27"
            class="hidden xl:block"
          />
        </div>

        <div class="w-full xl:max-w-[201.39px]">
          <AtomsPixelatedBox class="quest__box-shadow h-[186.18px] font-retro uppercase text-[42px] flex justify-center items-center bg-purple">
            <AtomsTextWithBorderOutside :borderSize=4>
              Play
            </AtomsTextWithBorderOutside>
          </AtomsPixelatedBox>
          <AtomsPixelatedBox class="quest__box-shadow text-[32px] font-kontesa leading-none py-0.5 text-center bg-accentBlue">
            <AtomsTextWithBorderOutside :borderSize=4>
              Q4 2023
            </AtomsTextWithBorderOutside>
          </AtomsPixelatedBox>
          <div class="mb-[68px] xl:mb-[75px]" />
          <img
            src="/images/homepage/roadmap/coins-platform.png"
            width="234"
            height="87.27"
            class="hidden xl:block"
          />
        </div>
      </div>
    </AtomsBox>
  </div>
</template>

<script lang="ts" setup>
const questList = [{
  quests: [
    "Polygon Partnership",
    "Brand + Website",
    "Design Tokenomic",
    "Impacman Dev",
    "Early Community Growth",
    "NFT Partnerships"
  ],
    period: "Q4 2022"
  },
  {
    quests: [
    "Early Beta launch v.1",
    "Launch Plan Dev",
    "Iterate Game #1",
    "IA Lite Paper",
    ],
    period: "Q1 2023"
  },
  {
    quests: [
    "Public Launch",
    "1 St Competition",
    "P20 NFTs Open"
    ],
    period: "Q2 2023"
  },
]
</script>

<style lang="sass" scoped>
$bg-1: url("/images/homepage/roadmap/cloud-top-left-mobile.svg")
$bg-2: url("/images/homepage/roadmap/cloud-top-right-mobile.svg")
$bg-3: url("/images/homepage/roadmap/trees-mobile.svg")
$bg-4: url("/images/homepage/roadmap/second-vector.svg")
$bg-5: url("/images/homepage/roadmap/first-vector.svg")

.image__background
  background: #BBF2FF
  background-image: $bg-1, $bg-2, $bg-3, $bg-4, $bg-5
  background-repeat: no-repeat, no-repeat, no-repeat, no-repeat, no-repeat
  background-size: auto, auto, contain, contain, contain
  background-position: top 60px left, top 320px right, bottom, top 1002px center, top 750px center

  @screen xl
    background-size: cover
    background-image: url("/images/homepage/roadmap/bg.svg")
.quest__position
  @screen xl
    &>:nth-child(2)
      transform: translateY(40%)
    &>:nth-child(3)
      transform: translateY(30%)
    &>:nth-child(4)
      transform: translateY(20%)
    &>:nth-child(5)
      transform: translateY(10%)
.quest__box-shadow 
  filter: drop-shadow(0px 5px 0px rgba(22,17,79,1))
.pipes__size
  width: 69px
  height: 47px
  @screen xl
    width: 122.75px
    height: 83.43px
</style>