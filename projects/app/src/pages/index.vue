<script setup lang="ts">
import {
  useAsyncFindProjectsQuery,
  useDeleteContainerMutation,
  useDeleteProjectMutation,
  useDuplicateContainerMutation,
} from '~/base';
import { type Container, ContainerStatus, type Project } from '~/base/default';
import ModalContainer from '~/components/Modals/ModalContainer.vue';
import ModalDeleteConfirm from '~/components/Modals/ModalDeleteConfirm.vue';
import SidebarProject from '~/components/Sidebar/SidebarProject.vue';

const { instanceName } = useRuntimeConfig().public;
useSeoMeta({
  title: `Projects | ${instanceName}`,
});

definePageMeta({
  breadcrumbs: 'Projects',
});

const { data, refresh } = await useAsyncFindProjectsQuery([
  'id',
  'identifier',
  'name',
  'healthStatus',
  { subscribers: ['id'] },
  {
    containers: [
      'id',
      'kind',
      'name',
      'updatedAt',
      'branch',
      'url',
      'status',
      'repositoryId',
      'healthStatus',
      { lastBuild: ['id', 'createdAt'] },
    ],
  },
]);
const projects = computed(() => data.value || []);
const expanded = ref<string[]>([]);
const { open } = useModal();
const { open: openMenu } = useContextMenu();
const { currentUserState: user } = useAuthState();

useIntervalFn(async () => {
  await refresh();
}, 2000);

onMounted(() => {
  const expandedStorage = useLocalStorage<string[]>('expanded', []);
  expanded.value = expandedStorage.value;
});

watch(
  () => expanded.value,
  () => {
    const expandedStorage = useLocalStorage<string[]>('expanded', []);
    expandedStorage.value = expanded.value;
  },
  { deep: true },
);

function createNewContainer(projectId: string) {
  open({
    component: ModalContainer,
    data: {
      projectId,
    },
  });
}

function timeAgo(date: string) {
  return useTimeAgo(new Date(date)).value;
}

function getUrl(project: Project, container: Container) {
  if (container.status === ContainerStatus.DEPLOYED) {
    return `/projects/${project.id}/${container.id}/logs`;
  }

  if (container.status === ContainerStatus.BUILDING) {
    return `/projects/${project.id}/${container.id}/builds`;
  }

  return `/projects/${project.id}/${container.id}`;
}

function openProjectSidebar(project: Project) {
  open({
    component: SidebarProject,
    data: {
      project,
      refresh: () => {
        refresh();
      },
    },
  });
}

function openContainerUrl(container: Container) {
  const url = `http${container.ssl ? 's' : ''}://${container.url}`;
  window.open(url, url);
}

async function duplicateContainer(container: Container) {
  const { data } = await useDuplicateContainerMutation({ containerId: container.id! }, ['id']);
  if (data) {
    useNotification().notify({
      text: 'Successfully duplicated container.',
      title: 'Success',
      type: 'success',
    });
  } else {
    useNotification().notify({ text: 'Container could not be duplicated.', title: 'Error', type: 'error' });
  }
  await refresh();
}

function showContextMenu(project: Project, container: Container) {
  if (user?.value?.roles?.includes('viewer')) {
    return;
  }

  openMenu({
    items: [
      {
        click: () => {
          navigateTo(getUrl(project, container));
        },
        label: 'Edit',
      },
      {
        click: () => {
          openContainerUrl(container);
        },
        label: 'Open',
      },
      {
        click: async () => {
          const { data, error } = await useDeployContainerMutation({ id: container.id! }, ['id']);
          if (error) {
            useNotification().notify({ text: error?.message, title: 'Error', type: 'error' });
          }
        },
        condition: () => container.status !== ContainerStatus.DEPLOYED,
        label: 'Deploy',
      },
      {
        click: () => {
          duplicateContainer(container);
        },
        label: 'Duplicate',
      },
      {
        click: async () => {
          useModal().open({
            component: ModalDeleteConfirm as any,
            confirm: async (confirmed) => {
              if (!confirmed) {
                return;
              }

              const { data } = await useDeleteContainerMutation({ id: container.id! }, ['id']);
              if (data) {
                useNotification().notify({
                  text: 'Successfully deleted container.',
                  title: 'Success',
                  type: 'success',
                });
              } else {
                useNotification().notify({ text: 'Container could not be deleted', title: 'Error', type: 'error' });
              }
              await refresh();
            },
            data: {
              value: container.name,
            },
          });
        },
        label: 'Delete',
      },
    ],
  });
}

function showProjectContextMenu(project: Project) {
  if (user?.value?.roles?.includes('viewer')) {
    return;
  }

  openMenu({
    items: [
      {
        click: () => {
          openProjectSidebar(project);
        },
        label: 'Edit',
      },
      {
        click: () => {
          useClipboard({ source: project.id }).copy();
          useNotification().notify({ text: 'Copied project id', title: 'Success', type: 'success' });
        },
        label: 'Copy project id',
      },
      {
        click: async () => {
          const config = await useAuthFetch(`/project/${project.id}/download-config`);

          let text = JSON.stringify(config);
          let filename = `${project.id}.json`;
          let element = document.createElement('a');
          element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
          element.setAttribute('download', filename);

          element.style.display = 'none';
          document.body.appendChild(element);

          element.click();
          document.body.removeChild(element);
        },
        label: 'Download config',
      },
      {
        click: () => {
          createNewContainer(project!.id!);
        },
        label: 'Create Container',
      },
      {
        click: async () => {
          useModal().open({
            component: ModalDeleteConfirm as any,
            confirm: async (confirmed) => {
              if (!confirmed) {
                return;
              }

              const { data } = await useDeleteProjectMutation({ id: project.id! }, ['id']);
              if (data) {
                useNotification().notify({ text: 'Successfully deleted project.', title: 'Success', type: 'success' });
              } else {
                useNotification().notify({ text: 'Project could not be deleted', title: 'Error', type: 'error' });
              }
              await refresh();
            },
            data: {
              value: project.name,
            },
          });
        },
        label: 'Delete',
      },
    ],
  });
}
</script>

<template>
  <div class="pt-[63px] w-full">
    <ClientOnly>
      <List>
        <ListItem
          v-for="project of projects"
          :key="project.id"
          :expandable="true"
          :expanded="expanded.includes(project.id!)"
          @click="
            expanded.includes(project.id!)
              ? (expanded = expanded.filter((i) => i !== project.id))
              : expanded.push(project.id!)
          "
          @contextmenu.prevent="showProjectContextMenu(project)"
        >
          <template #status>
            <Indicator
              v-for="container of project.containers"
              :key="`${container?.id}${container?.status}`"
              :status="container.status"
            />
          </template>
          <template #name1>
            <span v-if="project?.identifier">{{ project.identifier }} - </span> {{ project.name }}
          </template>
          <template #actions>
            <span v-if="project.subscribers?.find((e) => e.id === user.id)" class="i-bi-bell text-foreground/50"></span>
            <span v-else class="i-bi-bell-slash text-foreground/50"></span>
          </template>
          <template #content>
            <div v-if="project.containers?.length">
              <List>
                <ListItemSmall
                  v-for="container of project.containers"
                  :key="`${container?.id}${container?.status}`"
                  @click.prevent.stop="navigateTo(getUrl(project, container))"
                  @contextmenu.prevent.stop="showContextMenu(project, container)"
                >
                  <template #status>
                    <Indicator size="SM" :status="container.status!" />
                  </template>
                  <template #name1>
                    <div class="flex gap-2">
                      <ContainerKindIcon :kind="container.kind" class="text-foreground/50" />
                      {{ container.name }}
                    </div>
                  </template>
                  <template #subtitle1>
                    {{ container.kind }}
                  </template>
                  <template v-if="container.lastBuild?.createdAt" #subtitle2>
                    last deploy {{ timeAgo(container.lastBuild.createdAt) }}
                  </template>
                  <template v-if="container.branch" #badge>
                    <StatusBadge v-if="container.branch" :status="container.branch" size="SM" />
                    <StatusBadge v-else-if="container.tag" :status="container.tag" size="SM" />
                  </template>
                  <template v-if="container.kind" #prebadge>
                    <StatusBadge :status="container.kind" size="SM" />
                  </template>
                  <template v-if="container.healthCheckCmd && container.healthStatus" #statusbadge>
                    <StatusBadge :status="container.healthStatus" size="SM" />
                  </template>
                </ListItemSmall>
              </List>
            </div>
            <div v-else class="text-white font-light text-[0.8rem] h-10 flex items-center px-4 sm:lg:px-8">
              No containers in project.
              <button class="ms-1 hover:text-primary" @click.stop="createNewContainer(project!.id!)">
                Create one to get started.
              </button>
            </div>
          </template>
        </ListItem>
      </List>
    </ClientOnly>
  </div>
</template>
