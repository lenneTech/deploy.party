<script setup lang="ts">
import { useAsyncGetBuildQuery } from '~/base';
import { BuildStatus } from '~/base/default';

const { instanceName } = useRuntimeConfig().public;
useSeoMeta({
  title: `Build logs | ${instanceName}`,
});

definePageMeta({
  breadcrumbs: 'Logs',
});

// ============================================================================
// Variables
// ============================================================================

const route = useRoute();
const buildId = ref<string>(route.params.buildId ? (route.params.buildId as string) : '');

// Metadata query (without heavy log array)
const { data: buildMeta, refresh: refreshMeta } = await useAsyncGetBuildQuery({ id: buildId.value }, [
  'id',
  'status',
  'createdAt',
  'finishedAt',
]);

// Logs query (separate to enable conditional polling)
const { data: buildLogs, refresh: refreshLogs } = await useAsyncGetBuildQuery({ id: buildId.value }, ['log']);

// ============================================================================
// Computed Properties
// ============================================================================

const isRunning = computed<boolean>(
  () => buildMeta.value?.status === BuildStatus.RUNNING || buildMeta.value?.status === BuildStatus.QUEUE,
);

const log = computed<string[]>(() => buildLogs.value?.log ?? []);

// ============================================================================
// Polling
// ============================================================================

// Always poll metadata to track status changes
usePolling(refreshMeta, { interval: 2000 });

// Conditional polling for logs - only when build is running
const { pause: pauseLogPolling, resume: resumeLogPolling } = usePolling(refreshLogs, {
  immediate: isRunning.value,
  interval: 2000,
});

// Watch for status changes to control log polling
watch(
  isRunning,
  async (running: boolean, wasRunning: boolean | undefined) => {
    if (running) {
      resumeLogPolling();
    } else {
      pauseLogPolling();
      // Final refresh when build completes
      if (wasRunning) {
        await refreshLogs();
      }
    }
  },
  { immediate: false },
);
</script>

<template>
  <Log class="w-full" :log="log" :running="isRunning" max-height="100%" />
</template>
