<script setup lang="ts">
const { instanceName } = useRuntimeConfig().public;
useSeoMeta({
  title: `Logs | ${instanceName}`,
});

definePageMeta({
  breadcrumbs: 'Logs',
});

const route = useRoute();
const containerId = ref<string>(route.params.containerId ? (route.params.containerId as string) : '');
const { data: logData, refresh: refreshLogs } = await useGetContainerQuery({ id: containerId.value }, ['logs']);
const logs = computed(() => (logData.value?.getContainer.logs as string[]) || null);

const { pause } = useIntervalFn(() => {
  refreshLogs();
}, 2000);

onBeforeUnmount(() => {
  pause();
});
</script>

<template>
  <div class="w-full">
    <Log v-if="logs?.length" :log="logs" :running="true" />
    <div v-else class="text-white">No logs</div>
  </div>
</template>
