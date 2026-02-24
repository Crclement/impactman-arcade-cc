<template>
      <div class="mt-[70px]">
        <div class="casualgames__container text-[52px] leading-[47px] xl:flex justify-center items-center font-kontesa text-center text-mindaroGreen mx-auto relative">
          <div class="relative">
            <p class="casualgames__text">Casual<span class="ml-7 mr-7 xl:ml-16 xl:mr-16"></span>Games<br>That Make<br>Real-World<br>Environmental<br>Impact<br>The More <br class="inline xl:hidden"/>You <br class="hidden xl:inline">Play & Win</p>
            <img src="/images/cool.png" class="img__cool-casualgames" width="148" height="145" />
          </div>
          <img src="/images/arcade.png" class="img__arcade-right hidden xl:block absolute" width="325" height="423" />
          <img src="/images/arcade.png" class="img__arcade-left mx-auto -mt-7 relative xl:absolute -scale-x-100" width="325" height="423" />
        </div>
      </div>
</template>

<script lang="ts" setup>

</script>

<style lang="sass" scoped>
.casualgames__container
  color: #D9FF69
  -webkit-text-stroke-width: 2px
  -webkit-text-stroke-color: #242A53

  @screen xl
    font-size: 114px
    line-height: 90px
    -webkit-text-stroke-width: 5px
    padding-bottom: 90px

.casualgames__text
  filter: drop-shadow(0px 2px 0px #FFFFFF) drop-shadow(0px 2px 0px #242A53)

  @screen xl
    filter: drop-shadow(0px 3px 0px #FFFFFF) drop-shadow(0px 4px 0px #242A53)
.img__cool-casualgames
  width: 62px
  height: 61px
  position: absolute
  top: -5px
  left: 50%
  transform: translateX(-25px)
  @screen xl
    width: 148px
    height: 145px

    top: -30px
    left: 51%
    transform: translateX(-51%)

.img__arcade-left
  width: 325.64px
  height: 423.91px
  @screen xl
    bottom: 2rem
    right: 0

.img__arcade-right
  width: 325.64px
  height: 423.91px
  @screen xl
    bottom: 2rem
    left: 0

</style>