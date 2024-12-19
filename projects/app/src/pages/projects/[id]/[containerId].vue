<script setup lang="ts">
import { type Container, ContainerKind, ContainerStatus } from '~/base/default';
import HealthyBadge from '~/components/HealthyBadge.vue';
import ModalConfirm from '~/components/Modals/ModalConfirm.vue';
import SmallButton from '~/components/SmallButton.vue';
import StatusBadge from '~/components/StatusBadge.vue';

const { instanceName } = useRuntimeConfig().public;
useSeoMeta({
  title: `Container | ${instanceName}`,
});

const route = useRoute();
const projectId = ref<string>(route.params.id ? (route.params.id as string) : '');
const containerId = ref<string>(route.params.containerId ? (route.params.containerId as string) : '');
const showActions = ref(false);
const { currentUserState: user } = useAuthState();

const { data: project } = await useGetProjectQuery({ id: projectId.value }, ['name']);
const projectName = computed(() => project.value?.getProject?.name || null);

const { data, refresh } = await useGetContainerQuery({ id: containerId.value }, null);
const container = computed(() => data.value?.getContainer || null);

const tabs = computed(() => [
  {
    condition: true,
    exactActive: true,
    label: 'Configuration',
    to: `/projects/${projectId.value}/${containerId.value}`,
  },
  {
    condition: container.value?.kind === ContainerKind.APPLICATION || container.value?.kind === ContainerKind.CUSTOM,
    label: 'Builds',
    to: `/projects/${projectId.value}/${containerId.value}/builds`,
  },
  {
    condition: container.value?.status !== ContainerStatus.DRAFT,
    label: 'Logs',
    to: `/projects/${projectId.value}/${containerId.value}/logs`,
  },
  {
    condition: container.value?.status === ContainerStatus.DEPLOYED,
    label: 'Stats',
    to: `/projects/${projectId.value}/${containerId.value}/stats`,
  },
  {
    condition: user?.value?.roles?.includes('admin'),
    label: 'Backup',
    to: `/projects/${projectId.value}/${containerId.value}/backup`,
  },
  {
    beta: true,
    condition: user?.value?.roles?.includes('admin') && container.value?.status === ContainerStatus.DEPLOYED,
    label: 'Terminal',
    to: `/projects/${projectId.value}/${containerId.value}/terminal`,
  },
]);

let healthyState: any = null;
if (container.value?.healthCheckCmd || container.value?.customDockerfile?.includes('HEALTHCHECK')) {
  const { data: healthData } = await useGetContainerHealthStatusQuery({ id: containerId.value });
  healthyState = computed(() => healthData.value?.getContainerHealthStatus);
}

useIntervalFn(async () => {
  await refresh();
}, 2000);

onMounted(async () => {
  if (process.client) {
    await import('@1password/save-button/built/index.js');
    const { activateOPButton } = await import('@1password/save-button');
    activateOPButton();
  }
});

async function deploy(id: string) {
  const { mutate, onError } = await useDeployContainerMutation({ id }, ['id', { lastBuild: ['id'] }]);
  onError((e) => {
    useNotification().notify({ text: e.message, title: 'Error', type: 'error' });
  });

  const result = await mutate();

  if (container.value?.kind === ContainerKind.APPLICATION || container.value?.kind === ContainerKind.CUSTOM) {
    if (result?.data?.deployContainer.lastBuild?.id) {
      await navigateTo(
        `/projects/${projectId.value}/${containerId.value}/builds/${result?.data?.deployContainer.lastBuild.id}`,
      );
    } else {
      await navigateTo(`/projects/${projectId.value}/${containerId.value}/builds`);
    }
  } else {
    await navigateTo(`/projects/${projectId.value}/${containerId.value}/logs`);
  }
}

async function stop(id: string) {
  useModal().open({
    component: ModalConfirm,
    confirm: async (confirmed) => {
      if (!confirmed) {
        return;
      }

      const { mutate, onError } = await useStopContainerMutation({ id }, ['id']);
      onError((e) => {
        useNotification().notify({ text: e.message, title: 'Error', type: 'error' });
      });

      const result = await mutate();

      if (result?.data?.stopContainer.id) {
        useNotification().notify({ text: 'Container successfully stopped', title: 'Success', type: 'success' });
        await navigateTo(`/projects/${projectId.value}/${containerId.value}`);
      }

      await navigateTo(`/projects/${projectId.value}/${containerId.value}`);
    },
    data: {
      message: 'Are you sure you want to stop this container?',
      title: 'Stop Container',
    },
    size: 'sm',
  });
}

function openContainerUrl(container: Container) {
  const url = `http${container.ssl ? 's' : ''}://${container.url}`;
  window.open(url, url);
}

async function get1PasswordContent() {
  const url = (container.value?.ssl ? 'https://' : 'http://') + container.value?.url;
  const saveRequest: any = {
    fields: [
      {
        autocomplete: 'username' as any,
        value: container.value?.basicAuth?.username as string,
      },
      {
        autocomplete: 'current-password' as any,
        value: container.value?.basicAuth?.pw as string,
      },
      {
        autocomplete: 'url' as any,
        value: url,
      },
    ],
    notes: 'created by deploy.party',
    title: `${projectName.value} - ${container.value?.name}`,
    urls: [url],
  };

  const { encodeOPSaveRequest } = await import('@1password/save-button');
  return encodeOPSaveRequest(saveRequest);
}
</script>

<template>
  <div class="w-full flex flex-col h-full">
    <div class="mt-10 w-full sticky top-[64px] bg-background z-[1]">
      <div class="flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <span class="line-clamp-1 text-secondary-100">{{ projectName }} / {{ container?.name }}</span>
        <div class="flex items-center gap-3">
          <div class="hidden md:inline">
            <ClientOnly>
              <onepassword-save-button
                data-onepassword-type="login"
                :value="get1PasswordContent()"
                lang="en"
                class="black"
                data-theme="dark"
                padding="compact"
              />
            </ClientOnly>
          </div>
          <HealthyBadge v-if="healthyState" :state="healthyState" />
          <StatusBadge :status="container?.status!" size="MD" badge-style="STATUS" />
          <div v-if="user?.roles?.includes('admin')" class="inline md:hidden">
            <SmallButton @click="showActions = !showActions">
              <Icon name="bi:three-dots-vertical" size="20" />
            </SmallButton>
          </div>
          <div
            class="items-center gap-3"
            :class="
              showActions
                ? 'absolute right-5 top-16 z-[55] mt-2 origin-top-right rounded-md shadow-lg flex flex-col gap-2 transition-all duration-200'
                : 'hidden md:flex'
            "
          >
            <SmallButton
              v-if="
                user?.roles?.includes('admin')
                && (container?.status === ContainerStatus.DEPLOYED
                  || container?.status === ContainerStatus.DIED
                  || container?.status === ContainerStatus.BUILDING)
              "
              tooltip="Stop"
              placement="bottom"
              @click="stop(container.id!)"
            >
              <Icon name="ic:baseline-stop" class="text-red-500" size="20" />
            </SmallButton>
            <SmallButton
              v-if="
                user?.roles?.includes('admin')
                && container?.status !== ContainerStatus.DEPLOYED
                && container?.status !== ContainerStatus.BUILDING
              "
              tooltip="Deploy"
              placement="bottom"
              @click="deploy(container.id!)"
            >
              <Icon name="ic:baseline-play-arrow" class="dark:text-primary-500" size="20" />
            </SmallButton>
            <SmallButton
              v-if="
                user?.roles?.includes('admin')
                && container?.lastEditedAt
                && container?.lastDeployedAt
                && container?.lastEditedAt > container?.lastDeployedAt
              "
              tooltip="Redeploy"
              placement="bottom"
              @click="deploy(container.id!)"
            >
              <Icon name="ic:baseline-restart-alt" class="dark:text-primary-500" size="20" />
            </SmallButton>
            <SmallButton
              v-if="container?.status === ContainerStatus.DEPLOYED && container.url"
              tooltip="Open"
              placement="bottom"
              @click="openContainerUrl(container)"
            >
              <Icon name="ic:twotone-open-in-new" class="hover:text-primary-500" size="20" />
            </SmallButton>
          </div>
        </div>
      </div>
      <Tabs :tabs="tabs" />
    </div>
    <div class="flex-1 overflow-y-auto overflow-x-hidden p-5 mt-4">
      <NuxtPage />
    </div>
  </div>
</template>
