<template>
  <div class="container">
    <AtomsBox class="play-games__container text-center pt-3.5 pb-7 px-[35px] relative z-10" :size=4>
      <img src="/images/floppy-disk.png" class="img__floppy-disk  hidden xl:block" width="65" height="65" />

      <div class="relative">
        <p class="text__play-games font-kontesa uppercase text-[30px] xl:text-[46.7992px] xl:leading-[45.68px] text-limeGreen">Play Games</p>
        <div class="relative -top-2.5">
          <p class="text__save-the-planet font-retro uppercase text-[41.47px] leading-[38.6px] xl:text-[72.62px] xl:leading-[67.61px] tracking-tight text-limeGreen"><span class="text__save-right-space">Save</span> <img
            class="absolute -top-2 left-1/2 -translate-x-4 xl:-translate-x-5 img__globe" src="/images/globe.png" /> <span class="xl:ml-7">The</span> <br>Planet</p>
        </div>
      </div>

      <img src="/images/floppy-disk.png" class="img__floppy-disk  hidden xl:block" width="65" height="65" />
    </AtomsBox>

    <AtomsBox class="impacman__container pt-[118px] pb-[100px] xl:pt-[217px] xl:pb-[183px] px-3 rounded-t-none -mt-5 relative" :size=4>
      <img src="/images/monster-1.png" class="img__impacman-monster-1" />

      <img src="/images/monster-2.png" class="img__impacman-monster-2" />

      <img src="/images/ship.png" class="img__impacman-ship" />

      <div>
        <p class="kontesa__impacman font-kontesa uppercase text-[86px] leading-none text-center pb-3.5">Impacman!</p>
        <p class="text-base uppercase text-center leading-[18px] pb-10">Gobble up ocean plastic and <br class="block xl:hidden">clean the seven seas!</p>

        <div class="flex items-center justify-center pb-24">
          <AtomsBtn class="impacman__btn-container font-retro uppercase text-xl xl:text-[44px] bg-purple px-8 py-[11px] xl:px-[70px] xl:py-8 text-center">
              <span class="impacman__btn-text">Play</span>
          </AtomsBtn>
        </div>
      </div>
    </AtomsBox>
  </div>
</template>

<script lang="ts" setup>

</script>

<style lang="sass" scoped>
.play-games__container
  background: linear-gradient(128.51deg, #C7EAF2 14.63%, #86D5E7 79.6%)

  @screen xl
    height: 242px

    z-index: 2

    margin: 0 auto
    margin-top: 92px

    display: flex
    justify-content: space-around
    align-items: center


    border: 3px solid #16114F
    box-shadow: 0px 6px 0px #16114F
    border-radius: 20px

.img__floppy-disk
  mix-blend-mode: darken

.text__save-right-space
  margin-right: 36px

  @screen xl
    margin-left: 7px

.text__play-games
  -webkit-text-stroke-width: 1px
  -webkit-text-stroke-color: #16114F
  filter: drop-shadow(0px 1px 0px #5935B4)

  @screen xl
    letter-spacing: -0.02em
    -webkit-text-stroke-width: 1.61377px
    filter: drop-shadow(0px 3.22753px 0px #5935B4)

.text__save-the-planet
  -webkit-text-stroke-width: 1px
  -webkit-text-stroke-color: #16114F
  filter: drop-shadow(0px 2px 0px #5935B4)

  @screen xl
    letter-spacing: -0.02em

    -webkit-text-stroke-width: 1.61377px

    filter: drop-shadow(0px 3.22753px 0px #5935B4)

.img__globe
  width: 56px
  height: 56px
  @screen xl
    width: 99px
    height: 99px

.impacman__container
  background-image: url("/images/impacman_background.png")
  background-position: 10% 90%

  @screen xl
    top: -60px
    background-position: 10% 120%

.img__impacman-monster-1
  position: absolute
  width: 45px
  height: 41px
  right: 69px
  top: 61px
  @screen xl
    width: 105px
    height: 96px
    right: 104px
    top: 162px

.img__impacman-monster-2
  position: absolute
  width: 48px
  height: 46px
  left: 34px
  bottom: 118px
  @screen xl
    width: 97px
    height: 92px
    left: 91px
    top: 363px

.img__impacman-ship
  position: absolute
  width: 51px
  height: 52px
  right: 29px
  bottom: 59px
  @screen xl
    width: 103px
    height: 105px
    left: 217px
    bottom: 57px

.impacman__text-container
  display: flex
  flex-direction: column
  justify-content: center
  align-items: center
  height: 100%

.kontesa__impacman
  letter-spacing: -0.04em

  background: linear-gradient(171.49deg, #F3B3E1 -7.07%, #FFFFFF 100.84%)
  background-clip: text
  -webkit-background-clip: text
  -webkit-text-fill-color: transparent
  -webkit-text-stroke-width: 1.5px
  -webkit-text-stroke-color: #16114F
  filter: drop-shadow(0px 4px 0px rgba(22,17,79,1))

  @screen xl
    font-size: 200px
    -webkit-text-stroke-width: 3.47795px
    filter: drop-shadow(0px 12px 0px rgba(22,17,79,1))


.impacman__text-subtitle
  font-size: 22px
  font-weight: 700
  line-height: 24px
  letter-spacing: -0.02em
  text-transform: uppercase
  color: #16114F

.impacman__btn-container
  border: 2px solid #16114F
  filter: drop-shadow(0px 1.5px 0px #16114F)
  @screen xl
    border: 5.09665px solid #16114F
    border-radius: 16.9888px
    filter: drop-shadow(0px 10.1933px 0px rgba(22,17,79,1))

.impacman__btn-text
  font-family: "Retro"
  font-style: normal
  font-weight: 400
  color: #ECECEC
  -webkit-text-stroke-width: 0.5px
  -webkit-text-stroke-color: #16114F
  text-shadow: 1px 0 #16114F, 0px 1px #16114F, 0px 1px #16114F

  @screen xl
    -webkit-text-stroke-width: 1.5px

</style>