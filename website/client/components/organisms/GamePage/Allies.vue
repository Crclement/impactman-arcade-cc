<template>
  <MoleculesGamePageCard title="Allies">
    <div class="p-2">
      <div v-for="i in 6" :key="i" class="text-navyBlue text-xs uppercase inline-flex">
        <img src="/images/ship.png" class="h-5 mr-2" />
        <span>
          <b>[polygon]</b> helped <b>[PLAYER]</b> remove <b>5</b> bags
        </span>
      </div>
    </div>
  </MoleculesGamePageCard>
</template>

<script lang="ts" setup>

</script>