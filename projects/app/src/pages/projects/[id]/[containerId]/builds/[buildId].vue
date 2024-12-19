<script setup lang="ts">
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
const { data: buildData, refresh: refreshBuild } = await useGetBuildQuery({ id: buildId.value }, null);
const build = computed(() => buildData.value?.getBuild || null);

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
  <Log :log="build?.log" :running="build?.status === BuildStatus.RUNNING" max-height="78vh" />
</template>
