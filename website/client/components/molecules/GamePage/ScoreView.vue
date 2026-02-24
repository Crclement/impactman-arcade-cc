<template>
  <div class="score-view">
    <div>
      <MoleculesGamePageSummaryItem :size="4" class="relative">
        <template #label>
          <div class="w-full flex items-center px-4">
            <div class="w-12">
              <img src="/images/icons/bags.png" class="h-12" />
            </div>

            <div class="ml-4 text-lg text-center">
              <p>
                PLASTIC BAGS
              </p>
              <p>REMOVED</p>
            </div>
          </div>
        </template>
        <template #value>
          <div class="score-view-points">
            <span class="relative">0
              <span class="ontop absolute left-0">0</span>
            </span>
          </div>
        </template>
      </MoleculesGamePageSummaryItem>
      <MoleculesGamePageSummaryItem class="relative">
        <template #label>
          <div class="w-full flex items-center px-4">
            <div class="w-12">
              <img src="/images/icons/level.png" class="h-10" />
            </div>

            <div class="ml-4 text-lg text-center">
              <p>
                Score
              </p>
            </div>
          </div>
        </template>
        <template #value>
          <div class="score-view-points">
            <span class="relative">{{ gameStore.global.currentScore }}
              <span class="ontop absolute left-0">{{ gameStore.global.currentScore }}</span>
            </span>
          </div>
        </template>
      </MoleculesGamePageSummaryItem>
      <MoleculesGamePageSummaryItem class="relative">
        <template #label>
          <div class="w-full flex items-center px-4">
            <div class="w-12">
              <img src="/images/icons/tickets.png" class="h-10" />
            </div>

            <div class="ml-4 text-lg text-center">
              <p>
                TICKETS
              </p>
            </div>
          </div>
        </template>
        <template #value>
          <div class="score-view-points">
            <span class="relative">{{ gameStore.ticketsEarned }}
              <span class="ontop absolute left-0">{{ gameStore.ticketsEarned }}</span>
            </span>
          </div>
        </template>
      </MoleculesGamePageSummaryItem>
    </div>
    <AtomsBox :size="4" class="rounded-lg bg-white overflow-hidden">
      <div class="leaderboard-list bg-white p-2 py-4 grid grid-cols-1 gap-2">
        <AtomsGamePageLeaderboardItem class="bg-green" />
        <AtomsGamePageLeaderboardItem />
        <AtomsGamePageLeaderboardItem />
        <AtomsGamePageLeaderboardItem />
      </div>
    </AtomsBox>
  </div>
</template>

<script lang="ts" setup>
import { useGameStore } from '~~/store/game';

const gameStore = useGameStore()
</script>

<style lang="sass" scoped>
.leaderboard-list
  @apply relative
  &::after
    content: ''
    display: block
    background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 100%)
    @apply absolute bottom-0 left-0 w-full h-96
.score-view-points
  font-style: normal
  font-weight: 700
  font-size: 83.5522px
  line-height: 84px
  letter-spacing: -4px

  display: flex
  align-items: center
  text-transform: uppercase

  color: #D9FF69

  -webkit-text-stroke: 5.5px #16114F
  text-shadow: 0px 3.71343px 0px #5935B4, 0px 7.42687px 0px #000000

  @apply ml-6 relative inline-flex items-center h-full

  .ontop
    -webkit-text-stroke: 3px #16114F
</style>