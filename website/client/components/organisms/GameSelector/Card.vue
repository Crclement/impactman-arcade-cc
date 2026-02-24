<template>
  <div class="w-full max-w-[347px] md:max-w-[436px]">
      <MoleculesGameSelectorCardTitle>
        {{props.title}}
      </MoleculesGameSelectorCardTitle>
      <MoleculesGameSelectorCardImage :src="coverImageSrc" />
      <MoleculesGameSelectorCardBtn>
        {{props.btnText}}
      </MoleculesGameSelectorCardBtn>
  </div>
</template>

<script lang="ts" setup>
export interface CardProps {
  title: string,
  subtitle: string,
  coverImageSrc: string,
  btnText: string
}

const props = defineProps<CardProps>()
</script>

<style lang="sass" scoped>
//
</style>