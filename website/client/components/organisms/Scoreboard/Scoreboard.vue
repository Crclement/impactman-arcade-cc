<template>
  <div class="max-w-[620px] mx-auto px-2">
    <MoleculesScoreboardPeriod class="mb-4" />
    <div v-for="user in arrayOfUsers">
      <MoleculesScoreboardUser
        :position="user.position"
        :profile-image="user.profileImage"
        :user-name="user.userName"
        :impact-tickets="user.impactTickets"
        class="mb-2.5"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>

export type User = {
  position: number,
  profileImage: string,
  userName: string,
  impactTickets: string
}

export interface ScoreboardProps {
  arrayOfUsers: Array<User>
}

const props = defineProps<ScoreboardProps>()

</script>

<style lang="sass" scoped>
//
</style>