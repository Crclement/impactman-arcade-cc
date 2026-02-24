<template>
  <AtomsBox class="flex justify-between py-[3px] xl:py-1.5 pl-4 xl:pl-8 pr-[74px] bg-rose xl:rounded-md">
    <!-- TODO abstract each info column to its own component -->
    <!-- No (calc logic position) -->
    <div class="flex flex-col gap-1.5 xl:gap-3.5">
      <div class="text-[6.2px] xl:text-xs opacity-50 text-navyBlue leading-6">Nº</div>
      <span class="font-retro uppercase font-bold text-[11.53px] leading-[14px] xl:text-[22px] xl:leading-7" borderWidth="0" textShadow="none" color="#16114F">
        {{ordinal_suffix_of(props.position)}}
      </span>
    </div>
    <!-- Ape Pic -->
      <img :src="props.profileImage" class="ape__image" width="96" height="93" />
    <!-- Name -->
    <div class="flex flex-col gap-1.5 xl:gap-3">
      <span class="uppercase text-[6.2px] xl:text-xs opacity-50 text-navyBlue leading-6">Name</span>
      <span class="font-retro font-bold text-[11.53px] leading-[14px] xl:text-[22px] xl:leading-7" borderWidth="0" textShadow="none" color="#16114F">
        {{props.userName}}
      </span>
    </div>

    <!-- Tickets -->
    <div class="flex flex-col gap-1.5 xl:gap-3">
      <span class="uppercase text-[6.2px] xl:text-xs opacity-50 text-navyBlue leading-6">Impact Tickets</span>
      <span class="font-retro font-bold text-[11.53px] leading-[14px] xl:text-[22px] xl:leading-7" borderWidth="0" textShadow="none" color="#16114F">
        {{props.impactTickets}}
      </span>
    </div>
  </AtomsBox>
</template>

<script lang="ts" setup>
export interface UserProps {
  position: number,
  profileImage: string,
  userName: string,
  impactTickets: string
}

const props = withDefaults(defineProps<UserProps>(), {
  position: 1
})

function ordinal_suffix_of(i: number) {
  const j = i % 10
  const k = i % 100
  if (j == 1 && k != 11) {
      return i + "st"
  }
  if (j == 2 && k != 12) {
      return i + "nd"
  }
  if (j == 3 && k != 13) {
      return i + "rd"
  }
  return i + "th"
}
</script>

<style lang="sass" scoped>
.ape__image
  width: 50px
  height: 48px
  @screen xl
    width: 96px
    height: 93px
</style>