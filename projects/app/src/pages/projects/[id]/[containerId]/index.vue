<script setup lang="ts">
import { AllContainerTypes, useAuthState } from '#imports';

import { useAsyncGetContainerQuery } from '~/base';
import { ContainerKind } from '~/base/default';
import CustomForm from '~/components/CustomForm.client.vue';
import ServiceForm from '~/components/ServiceForm.vue';

const { instanceName } = useRuntimeConfig().public;
useSeoMeta({
  title: `Container | ${instanceName}`,
});

const route = useRoute();
const { $copyToClipboard } = useNuxtApp();
const { currentUserState: user } = useAuthState();
const containerId = ref<string>(route.params.containerId ? (route.params.containerId as string) : '');
const { data, refresh } = await useAsyncGetContainerQuery({ id: containerId.value }, null);

const container = computed(() => data.value || null);
const dbUrl = computed(
  () => `mongodb://${container.value.id}_${container.value.name.replace(/\s/g, '_')}:27017/YOUR_DB_NAME`,
);
const dbHost = computed(() => `${container.value.id}_${container.value.name.replace(/\s/g, '_')}`);
const disabled = computed<boolean>(() => !user.value.roles.includes('admin'));
const tab = ref<string>('');

definePageMeta({
  breadcrumbs: 'Container',
});

watch(
  () => route.query.tab,
  () => {
    tab.value = (route.query.tab as string) ?? '';
  },
  { immediate: true },
);

function copyUrl() {
  $copyToClipboard(dbUrl.value);
  useNotification().notify({ text: 'Copied to clipboard', title: 'Success', type: 'success' });
}
</script>

<template>
  <div class="w-full flex overflow-hidden h-full">
    <div
      v-if="container?.kind === ContainerKind.APPLICATION || container?.kind === ContainerKind.CUSTOM"
      class="w-64 py-1 px-1 pe-5 bg-background border-r border-border flex flex-col"
    >
      <ul class="space-y-1 flex-grow">
        <MenuItem :to="{ path: $route.fullPath }">
          <span class="ps-2 pe-3">General</span>
        </MenuItem>
        <MenuItem :to="{ path: $route.fullPath, query: { tab: 'source' } }">
          <span class="ps-2 pe-3">Source</span>
        </MenuItem>
        <MenuItem
          v-if="container?.kind !== ContainerKind.CUSTOM"
          :to="{ path: $route.fullPath, query: { tab: 'webserver' } }"
        >
          <span class="ps-2 pe-3">Webserver</span>
        </MenuItem>
        <MenuItem
          v-if="container?.kind !== ContainerKind.CUSTOM"
          :to="{ path: $route.fullPath, query: { tab: 'env' } }"
        >
          <span class="ps-2 pe-3">Env</span>
        </MenuItem>
        <MenuItem
          v-if="container?.kind === ContainerKind.APPLICATION"
          :to="{ path: $route.fullPath, query: { tab: 'storages' } }"
        >
          <span class="ps-2 pe-3">Storages</span>
        </MenuItem>
      </ul>
    </div>

    <div class="ps-5 flex-1 overflow-y-auto">
      <span
        v-if="container?.type === AllContainerTypes.MONGO"
        class="bg-background border rounded border-border hover:bg-hover text-foreground flex items-center p-2 font-light text-foreground/80 cursor-pointer hover:text-primary"
        @click="copyUrl()"
      >
        {{ dbUrl }}
      </span>
      <span
        v-if="container?.type === AllContainerTypes.MARIA_DB"
        class="bg-background border rounded border-border hover:bg-hover text-foreground flex items-center p-2 font-light text-foreground/80 cursor-pointer hover:text-primary"
      >
        Host: {{ dbHost }}
      </span>

      <ApplicationForm
        v-if="container?.kind === ContainerKind.APPLICATION"
        :container="container"
        :container-id="containerId"
        :disabled="disabled"
        :tab="tab"
        @refresh="refresh()"
      />
      <DatabaseForm
        v-if="container?.kind === ContainerKind.DATABASE"
        :container="container"
        :container-id="containerId"
        :disabled="disabled"
      />
      <ServiceForm
        v-if="container?.kind === ContainerKind.SERVICE"
        :container="container"
        :container-id="containerId"
        :disabled="disabled"
      />
      <CustomForm
        v-if="container?.kind === ContainerKind.CUSTOM"
        :container="container"
        :container-id="containerId"
        :disabled="disabled"
        :tab="tab"
      />
    </div>
  </div>
</template>
