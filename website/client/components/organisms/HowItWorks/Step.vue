<template>
  <div class="w-full max-w-[283px] xl:max-w-[285px]">
      <MoleculesHowItWorksStepTitle>
        {{props.title}}
      </MoleculesHowItWorksStepTitle>
      <MoleculesHowItWorksStepImage :src="coverImageSrc" />
  </div>
</template>

<script lang="ts" setup>
export interface StepProps {
  title: string,
  coverImageSrc: string
}

const props = defineProps<StepProps>()
</script>

<style lang="sass" scoped>

</style>