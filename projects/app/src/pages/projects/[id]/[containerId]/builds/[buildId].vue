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

const { pause } = useIntervalFn(() => {
  if (build) {
    refreshBuild();
  }
}, 2000);

onBeforeUnmount(() => {
  pause();
});
</script>

<template>
  <Log class="w-full" :log="build?.log" :running="build?.status === BuildStatus.RUNNING" max-height="100%" />
</template>
