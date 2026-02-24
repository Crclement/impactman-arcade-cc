<template>
  <AtomsBox class="container glhf__container" :size="4">
    <p class="kontesa__glhf-text">Good Luck</p>
    <p class="retro__glhf-text">Have<img class="img__cool" src="/images/cool.png" width="222"
        height="222" /><br>Fun</p>
  </AtomsBox>
</template>

<script lang="ts" setup>

</script>

<style lang="sass" scoped>
.glhf__container
  position: relative
  padding-top: 69px
  background: linear-gradient(0deg, #D9FF69, #D9FF69)
  width: 100%
  height: 375px

  @screen xl
    max-width: 100%
    width: 1380px
    height: 755px

.img__cool
  width: 88px
  height: 88px
  position: absolute
  top: 40px
  left: 50%
  transform: translateX(-50%)

  @screen xl
    width: 200px
    height: 200px
    top: 80px
    left: 50%
    transform: translateX(-50%)

.kontesa__glhf-text
  font-family: "Kontesa"
  text-align: center
  text-transform: uppercase
  font-size: 54.01px
  line-height: 64px
  color: #CAFDFF
  -webkit-text-stroke-width: 2px
  -webkit-text-stroke-color: #16114F

  @screen xl
    font-size: 136px
    line-height: 162px
    letter-spacing: -0.03em

    -webkit-text-stroke-width: 5.96156px

    position: absolute
    top: 77px
    left: 50%
    transform: translateX(-50%)

.retro__glhf-text
  font-family: "Retro"
  text-align: center
  font-style: normal
  text-transform: uppercase
  font-weight: 400
  font-size: 95.3043px
  line-height: 92px
  color: #CAFDFF
  -webkit-text-stroke-width: 2px
  -webkit-text-stroke-color: #16114F

  position: absolute
  top: 100px
  left: 50%
  transform: translateX(-50%)

  @screen xl
    font-weight: 400
    font-size: 240px
    line-height: 231px
    letter-spacing: -0.02em


    -webkit-text-stroke-width: 7.10569px
    text-shadow: 0px 7px 0px #5935B4, 0px 19.8719px 0px #000000
    
    position: absolute
    top: 158px
    left: 50%
    transform: translateX(-50%)
</style>