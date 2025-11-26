<script setup lang="ts">
import { useAsyncFindBuildsForContainerQuery, useStopBuildMutation } from '~/base';
import { BuildStatus } from '~/base/default';
import SmallButton from '~/components/SmallButton.vue';
import Spinner from '~/components/Spinner.vue';

const { instanceName } = useRuntimeConfig().public;
useSeoMeta({
  title: `Builds | ${instanceName}`,
});

definePageMeta({
  breadcrumbs: 'Builds',
});

const route = useRoute();
const projectId = ref<string>(route.params.id ? (route.params.id as string) : '');
const containerId = ref<string>(route.params.containerId ? (route.params.containerId as string) : '');

const {
  data: buildData,
  refresh: refreshBuilds,
  status,
  // Only fetch fields needed for the list - excludes heavy `log` array
} = await useAsyncFindBuildsForContainerQuery(
  { containerId: containerId.value },
  ['id', 'status', 'createdAt', 'finishedAt'],
  false,
  {
    lazy: true,
  },
);
const builds = computed(() => buildData.value || []);

usePolling(refreshBuilds, { interval: 5000 });

onMounted(async () => {
  if (builds.value?.length) {
    await navigateTo(`/projects/${projectId.value}/${containerId.value}/builds/${builds.value[0].id}`);
  }
});

function timeAgo(date: string) {
  return useTimeAgo(new Date(date)).value;
}

function getDuration(date1: Date, date2: Date) {
  const milliseconds = new Date(date2).getTime() - new Date(date1).getTime();
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  return minutes;
}

async function restart(id: string) {
  await useRestartBuildMutation({ id: id });
  await refreshBuilds();
}

async function stop(id: string) {
  await useStopBuildMutation({ id: id });
  await refreshBuilds();
}
</script>

<template>
  <div class="w-full h-full overflow-hidden relative">
    <div v-if="status === 'pending' && !buildData?.length" class="flex flex-col gap-2 p-4">
      <Skeleton class="h-32 w-full" />
      <Skeleton class="h-32 w-full" />
    </div>
    <div v-else-if="builds?.length" class="w-full h-full flex flex-col md:flex-row relative gap-2 lg:gap-5">
      <div class="w-5/12 md:4/12 lg:w-3/12 xl:2/12 max-h-[100%] overflow-y-scroll">
        <div class="flex flex-col h-full gap-3 mb-5 lg:mb-0">
          <NuxtLink
            v-for="(build, index) of builds"
            :key="build.id"
            :to="`/projects/${projectId}/${containerId}/builds/${build.id}`"
            class="relative flex flex-col gap-1 justify-center h-32 p-5 bg-background border border-border rounded-lg transition-all duration-200 shadow hover:bg-hover"
            active-class="!border-primary-500"
          >
            <h5 class="text-lg font-semibold tracking-tight text-foreground">Build #{{ builds?.length - index }}</h5>
            <p class="font-normal text-foreground/50 mt-1">
              <template v-if="build.status === BuildStatus.SKIPPED"> Skipped </template>
              <template v-if="build.status === BuildStatus.CANCEL"> Canceled </template>
              <template v-if="build.status === BuildStatus.SKIPPED"> Skipped </template>
              <template v-if="build.status === BuildStatus.FAILED"> ❌ Failed </template>
              <template v-if="build.status === BuildStatus.SUCCESS"> ✅ Success </template>
              <template v-if="build.status === BuildStatus.QUEUE"> Waiting for processing </template>
            </p>
            <div class="flex gap-5 items-center">
              <small v-if="build?.createdAt && build?.finishedAt" class="text-foreground/50 mt-1">
                <span class="i-bi-clock me-1"></span> {{ getDuration(build.createdAt, build.finishedAt) }} minutes
              </small>
              <small v-if="build?.createdAt" class="text-foreground/50 mt-1">
                <span class="i-bi-calendar me-1"></span> {{ timeAgo(build.createdAt) }}
              </small>
            </div>
            <div class="absolute right-0 inset-y-0 p-5 flex items-center">
              <Spinner v-if="build.status === BuildStatus.RUNNING || build.status === BuildStatus.QUEUE" />
              <SmallButton
                v-if="build.status === BuildStatus.RUNNING || build.status === BuildStatus.QUEUE"
                tooltip="Stop"
                placement="top"
                class="hover:text-primary-500 text-white ms-2"
                @click="stop(build.id!)"
              >
                <Icon name="carbon:stop" size="24" />
              </SmallButton>
              <SmallButton
                v-if="build.status !== BuildStatus.RUNNING && build.status !== BuildStatus.QUEUE"
                tooltip="Restart"
                placement="top"
                class="hover:text-primary-500 text-white"
                @click="restart(build.id!)"
              >
                <Icon name="carbon:restart" size="24" />
              </SmallButton>
            </div>
          </NuxtLink>
        </div>
      </div>
      <div class="w-7/12 md:8/12 lg:w-9/12 xl:10/12 h-full relative md:col-span-2 lg:col-span-3">
        <NuxtPage />
      </div>
    </div>
    <div v-else class="text-white">No builds</div>
  </div>
</template>
