<script setup lang="ts">
import { type ContainerHealthStatus } from '~/base/default';

const props = defineProps<{
  state: ContainerHealthStatus;
}>();
</script>

<template>
  <span
    v-if="state === ContainerHealthStatus.HEALTHY"
    class="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-primary-900 dark:text-primary-300"
    >Healthy</span
  >
  <span
    v-else
    class="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded dark:bg-red-900 dark:text-red-300"
    >Unhealthy</span
  >
</template>
