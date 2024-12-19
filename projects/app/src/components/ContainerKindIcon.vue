<script setup lang="ts">
import {ContainerKind} from "~/base/default";

const props = defineProps<{
  kind: ContainerKind;
}>();

defineOptions({
  inheritAttrs: false
})

const attrs = useAttrs()
</script>

<template>
  <span class="flex items-center justify-center">
    <span v-if="kind === ContainerKind.APPLICATION" class="i-bi-stack" :class="attrs.class"></span>
    <span v-if="kind === ContainerKind.DATABASE" class="i-bi-database" :class="attrs.class"></span>
    <span v-if="kind === ContainerKind.CUSTOM" class="i-bi-box" :class="attrs.class"></span>
    <span v-if="kind === ContainerKind.SERVICE" class="i-bi-flag" :class="attrs.class"></span>
  </span>
</template>