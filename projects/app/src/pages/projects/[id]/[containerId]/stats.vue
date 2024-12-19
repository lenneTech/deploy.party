<script setup lang="ts">
const { instanceName } = useRuntimeConfig().public;
useSeoMeta({
  title: `Stats | ${instanceName}`,
});

definePageMeta({
  breadcrumbs: 'Stats',
});

const route = useRoute();
const containerId = ref<string>(route.params.containerId ? (route.params.containerId as string) : '');
const { data, refresh } = await useGetContainerStatsQuery({ id: containerId.value }, null, true);
const stats = computed(() => data?.value?.getContainerStats || null);

useIntervalFn(() => {
  refresh();
}, 5000);
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 py-4 mt-4 w-full">
    <Card name="CPU">
      {{ stats?.CPUPerc || '0%' }}
    </Card>
    <Card name="Memory">
      {{ stats?.MemUsage || '0%' }}
    </Card>
    <Card name="Net">
      {{ stats?.NetIO || '-' }}
    </Card>
  </div>
</template>
