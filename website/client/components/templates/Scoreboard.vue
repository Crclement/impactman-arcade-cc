<template>
  <div class="relative">
      <AtomsSectionSubheading
      image-icon-src="/images/homepage/scoreboard/tree.svg"
      image-icon-width="34.75"
      image-icon-height="42.77"
      image-icon-max-width="70.88"
      class="mb-[26px] xl:mb-[100px]"
      >
      Scoreboard
      </AtomsSectionSubheading>

      <AtomsBox class="scoreboard__bg max-w-[665px] pt-6 pb-5 mx-auto">
        <OrganismsScoreboard :arrayOfUsers="testUserList" />
      </AtomsBox>
      <div class="relative md:static">
        <img src="/images/homepage/scoreboard/cloud.svg" class="scoreboard__cloud_left absolute -bottom-24 xl:top-64 xl:-left-20" />
        <img src="/images/homepage/scoreboard/cloud.svg" class="scoreboard__cloud_right absolute -bottom-[75px] -right-10 xl:bottom-[95px] xl:-right-[74px]" />
      </div>
  </div>
</template>

<script lang="ts" setup>

const testUserList = [{
  position: 1,
  profileImage: "/images/homepage/scoreboard/ape-cool.png",
  userName: "Franko",
  impactTickets: "302,302"
  },
  {
  position: 2,
  profileImage: "/images/homepage/scoreboard/ape-vlad.png",
  userName: "Franko",
  impactTickets: "302,302"
  },
  {
  position: 3,
  profileImage: "/images/homepage/scoreboard/ape-street.png",
  userName: "Franko",
  impactTickets: "302,302"
  },
  {
  position: 4,
  profileImage: "/images/homepage/scoreboard/ape-young.png",
  userName: "Franko",
  impactTickets: "302,302"
  },
  {
  position: 5,
  profileImage: "/images/homepage/scoreboard/ape-bruised.png",
  userName: "Franko",
  impactTickets: "302,302"
  }
]

</script>

<style lang="sass" scoped>
.scoreboard__bg
  background: linear-gradient(128.51deg, #C7EAF2 14.63%, #86D5E7 79.6%)

.scoreboard__cloud_left
  width: 135.27px
  height: 72px
  @screen xl
    width: 258.33px
    height: 132px

.scoreboard__cloud_right
  width: 107.09px
  height: 55.1px
  @screen xl
    width: 475px
    height: 242.72px
</style>