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

const route = useRoute();
const buildId = ref<string>(route.params.buildId ? (route.params.buildId as string) : '');
const { data: buildData, refresh: refreshBuild } = await useAsyncGetBuildQuery({ id: buildId.value }, null);
const build = computed(() => buildData.value || null);

usePolling(
  async () => {
    if (build.value) {
      await refreshBuild();
    }
  },
  { interval: 2000 },
);
</script>

<template>
  <Log class="w-full" :log="build?.log" :running="build?.status === BuildStatus.RUNNING" max-height="100%" />
</template>
