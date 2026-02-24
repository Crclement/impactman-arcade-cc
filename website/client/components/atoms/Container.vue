<template>
    <div :class="{'container': !props.fluid, 'container-fluid': props.fluid}">
        <slot></slot>
    </div>
</template>

<script lang="ts" setup>
export interface ContainerProps{
    fluid?: boolean
}

const props = withDefaults(defineProps<ContainerProps>(), {
    fluid: false
});
</script>

<style lang="sass" scoped>
.container-fluid
    @apply w-full p-3.5 md:p-5
</style>