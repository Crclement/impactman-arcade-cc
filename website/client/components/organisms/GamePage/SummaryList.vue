<template>
  <div>
    <MoleculesGamePageSummaryItem>
      <template #label>
        <div class="flex w-full h-full items-center justify-center">
          <div class="text-sm text-center">
            Ocean Plastic Removed
          </div>
        </div>
      </template>
      <template #value>

        <div class="flex items-center justify-center">
          <div class="score-view-points">
            <span class="relative">{{ store.global.currentBags }}
              <span class="ontop absolute left-0">{{ store.global.currentBags }}</span>
            </span>
          </div>
          <div class="uppercase font-agrandir leading-none text-sm font-bold ml-4 inline-flex items-center">
            <img src="/images/icons/bags.png" class="h-8" />
            <span class="ml-2">
              <p class="mb-0">
                Plastic
              </p>
              <p>
                Bags
              </p>
            </span>
          </div>
        </div>
      </template>
    </MoleculesGamePageSummaryItem>
    <MoleculesGamePageSummaryItem>
      <template #label>
        <div class="flex w-full h-full items-center justify-center">
          <div class="text-sm">
            Score
          </div>
        </div>
      </template>
      <template #value>
        <div>
          <div class="score-view-points">
            <span class="relative">{{ store.global.currentScore }}
              <span class="ontop absolute left-0">{{ store.global.currentScore }}</span>
            </span>
          </div>
        </div>
      </template>
    </MoleculesGamePageSummaryItem>

    <MoleculesGamePageSummaryItem>
      <template #label>
        <div class="text-sm flex w-full h-full items-center justify-center">
          <img src="/images/icons/level.png" class="mr-2 h-8" />
          Level
        </div>
      </template>
      <template #value>
        <div class="score-view-points">
          <span class="relative">{{ store.global.currentLevel }}
            <span class="ontop absolute left-0">{{ store.global.currentLevel }}</span>
          </span>
        </div>
      </template>
    </MoleculesGamePageSummaryItem>
    <MoleculesGamePageSummaryItem>
      <template #label>
        <div class="text-sm flex w-full h-full items-center justify-center">
          <img src="/images/icons/tickets.png" class="mr-2 h-8" />

          <div>
            <p>
              TICKETS
            </p>
            <p>EARNED</p>
          </div>
        </div>
      </template>
      <template #value>
        <div class="score-view-points">
          <span class="relative">{{ store.ticketsEarned }}
            <span class="ontop absolute left-0">{{ store.ticketsEarned }}</span>
          </span>
        </div>
      </template>
    </MoleculesGamePageSummaryItem>
  </div>
</template>

<script lang="ts" setup>
import { useGameStore } from '~~/store/game';

const store = useGameStore()
</script>

<style lang="sass" scoped>
.score-view-points
  font-style: normal
  font-weight: 700
  font-size: 45px
  line-height: 45px
  letter-spacing: -0px

  display: inline-flex
  align-items: center
  text-transform: uppercase

  color: #D9FF69

  -webkit-text-stroke: 5.5px #16114F
  text-shadow: 0px 2px 0px #5935B4, 0px 5px 0px #000000

  @apply ml-6 relative inline-block my-2

  .ontop
    -webkit-text-stroke: 1.5px #16114F
</style>