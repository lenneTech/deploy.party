<script setup lang="ts">
import { useAsyncGetContainerQuery } from '~/base';

const { instanceName } = useRuntimeConfig().public;
useSeoMeta({
  title: `Logs | ${instanceName}`,
});

definePageMeta({
  breadcrumbs: 'Logs',
});

const route = useRoute();
const containerId = ref<string>(route.params.containerId ? (route.params.containerId as string) : '');
const { data: logData, refresh: refreshLogs } = await useAsyncGetContainerQuery({ id: containerId.value }, ['logs']);
const logs = computed(() => (logData.value?.logs as string[]) || null);
const logContainer = ref<HTMLElement | null>(null);

const { pause } = useIntervalFn(() => {
  refreshLogs();
}, 5000);

onBeforeUnmount(() => {
  pause();
});
</script>

<template>
  <div ref="logContainer" class="w-full h-full">
    <Log v-if="logs?.length" :log="logs" :running="true" :max-height="logContainer?.clientHeight" />
    <div v-else class="text-white">No logs</div>
  </div>
</template>
