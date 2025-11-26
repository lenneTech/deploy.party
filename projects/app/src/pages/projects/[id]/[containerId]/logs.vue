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
const {
  data: logData,
  refresh: refreshLogs,
  status,
} = await useAsyncGetContainerQuery({ id: containerId.value }, ['logs'], false, { lazy: true });
const logs = computed<null | string[]>(() => (logData.value?.logs as string[]) || null);

usePolling(refreshLogs, { interval: 5000 });
</script>

<template>
  <div class="w-full h-full">
    <div v-if="status === 'pending'" class="flex flex-col gap-2 p-4">
      <Skeleton class="h-6 w-full" />
      <Skeleton class="h-6 w-full" />
      <Skeleton class="h-6 w-3/4" />
    </div>
    <Log v-else-if="logs?.length" :log="logs" :running="true" max-height="100%" />
    <div v-else class="text-white">No logs</div>
  </div>
</template>
