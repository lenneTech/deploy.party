<script setup lang="ts">
import { useStopBuildMutation } from '~/base';
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

const { data: buildData, refresh: refreshBuilds } = await useFindBuildsForContainerQuery(
  { containerId: containerId.value },
  null,
);
const builds = computed(() => buildData.value?.findBuildsForContainer || []);

const { pause } = useIntervalFn(() => {
  refreshBuilds();
}, 2000);

onMounted(async () => {
  if (builds.value?.length) {
    await navigateTo(`/projects/${projectId.value}/${containerId.value}/builds/${builds.value[0].id}`);
  }
});

onBeforeUnmount(() => {
  pause();
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
  const { mutate } = await useRestartBuildMutation({ id: id });
  await mutate();
  await refreshBuilds();
}

async function stop(id: string) {
  const { mutate } = await useStopBuildMutation({ id: id });
  await mutate();
  await refreshBuilds();
}
</script>

<template>
  <div class="w-full h-[78vh]">
    <div v-if="builds?.length" class="w-full h-full grid grid-cols-1 lg:grid-cols-3 lg:gap-5">
      <div class="flex flex-col gap-3 overflow-y-scroll mb-5 lg:mb-0">
        <NuxtLink
          v-for="(build, index) of builds"
          :key="build.id"
          :to="`/projects/${projectId}/${containerId}/builds/${build.id}`"
          class="relative flex flex-col justify-center h-32 p-5 bg-background border border-border rounded-lg transition-all duration-200 shadow hover:bg-hover"
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
          <small v-if="build?.createdAt && build?.finishedAt" class="text-foreground/50 mt-1">
            <span class="i-bi-clock me-1"></span> {{ getDuration(build.createdAt, build.finishedAt) }} minutes
          </small>
          <small v-if="build?.createdAt" class="text-foreground/50 mt-1">
            <span class="i-bi-calendar me-1"></span> {{ timeAgo(build.createdAt) }}
          </small>
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
      <div class="w-full col-span-2">
        <NuxtPage />
      </div>
    </div>
    <div v-else class="text-white">No builds</div>
  </div>
</template>
