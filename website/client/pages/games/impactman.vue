<template>
  <div>
    <TemplatesGamePage>
      <template #game>
        <OrganismsGamePageGamesImpactman />
      </template>
    </TemplatesGamePage>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: 'naked'
})
</script>