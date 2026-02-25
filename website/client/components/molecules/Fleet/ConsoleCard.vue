<template>
  <div class="console-card" :class="[data.status, { playing: data.isPlaying }]">
    <div class="flex justify-between items-center mb-2">
      <div>
        <div class="font-retro text-xs text-navyBlue uppercase">{{ data.name || data.consoleId }}</div>
        <div class="font-retro text-[0.65rem] text-navyBlue/70 uppercase">{{ data.consoleId }}</div>
      </div>
      <span class="status-badge" :class="data.status">
        {{ data.isPlaying ? 'PLAYING' : data.status }}
      </span>
    </div>

    <div class="grid grid-cols-2 gap-1.5 mt-2">
      <div class="detail-item">
        <span class="detail-label">Games</span>
        <span class="detail-value">{{ (data.gamesPlayed || 0).toLocaleString() }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">High Score</span>
        <span class="detail-value">{{ (data.highScore || 0).toLocaleString() }}</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Temp</span>
        <span class="detail-value" :class="tempClass">
          {{ data.temperature > 0 ? `${data.temperature}°C` : '-' }}
        </span>
      </div>
      <div class="detail-item">
        <span class="detail-label">CPU</span>
        <span class="detail-value">{{ data.cpuUsage > 0 ? `${data.cpuUsage}%` : '-' }}</span>
      </div>
    </div>

    <div v-if="data.isPlaying" class="playing-indicator">
      <div>
        <span class="detail-label">Level</span>
        <span class="detail-value"> {{ data.currentLevel }}</span>
      </div>
      <div>
        <span class="detail-label">Score</span>
        <span class="detail-value"> {{ data.currentScore?.toLocaleString() }}</span>
      </div>
      <div v-if="data.sessionDuration">
        <span class="detail-label">Time</span>
        <span class="detail-value"> {{ data.sessionDuration }}</span>
      </div>
    </div>

    <div class="flex justify-between items-center mt-2 text-[0.6rem] font-retro text-navyBlue/60 uppercase">
      <span>v{{ data.version }}</span>
      <span>{{ data.lastSeenText }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  data: any
}>()

const tempClass = computed(() => {
  if (props.data.temperature >= 60) return 'hot'
  if (props.data.temperature >= 50) return 'warm'
  return 'cool'
})
</script>

<style lang="sass" scoped>
.console-card
  @apply bg-white rounded-lg p-4 transition-all
  border: 2px solid #16114F
  box-shadow: 0 3.7px 0 #16114F

  &:hover
    transform: translateY(-2px)
    box-shadow: 0 5px 0 #16114F

  &.offline
    @apply opacity-60

  &.warning
    background: #fff3cd

  &.playing
    @apply bg-green

.status-badge
  @apply font-retro py-1 px-2 rounded-sm text-[0.65rem] uppercase text-navyBlue
  border: 2px solid #16114F
  box-shadow: 0 2px 0 #16114F

  &.online
    @apply bg-green

  &.offline
    @apply bg-white

  &.warning
    background: #fff3cd

.detail-item
  @apply bg-green rounded-sm py-1.5 px-2 flex justify-between items-center
  border: 2px solid #16114F
  box-shadow: 0 2px 0 #16114F

.detail-label
  @apply font-retro text-navyBlue text-[0.6rem] uppercase

.detail-value
  @apply font-retro text-navyBlue text-[0.6rem] uppercase

  &.hot
    color: #d94368

  &.warm
    color: #e89b25

  &.cool
    color: #22a65a

.playing-indicator
  @apply bg-green rounded-sm p-2 mt-1.5 flex justify-between items-center
  border: 2px solid #16114F
  box-shadow: 0 2px 0 #16114F
</style>
