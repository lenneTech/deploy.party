<script setup lang="ts">
import type { Source } from '~/base/default';

import { useAsyncFindSourcesQuery, useDeleteSourceMutation } from '~/base';
import ModalSource from '~/components/Modals/ModalSource.vue';

const { instanceName } = useRuntimeConfig().public;
useSeoMeta({
  title: `Sources | ${instanceName}`,
});

definePageMeta({
  breadcrumbs: 'Sources',
});

const { open: openMenu } = useContextMenu();
const { data, refresh, status } = await useAsyncFindSourcesQuery({}, null, false, { lazy: true });
const sources = computed<Source[]>(() => data.value || []);

function select(source: Source) {
  useModal().open({
    component: ModalSource,
    data: {
      source,
    },
  });
}

function showContextMenu(source: Source) {
  openMenu({
    items: [
      {
        click: () => {
          select(source);
        },
        label: 'Edit',
      },
      {
        click: async () => {
          const { data } = await useDeleteSourceMutation({ id: source.id! }, ['id']);
          if (data) {
            useNotification().notify({ text: 'Source deleted', title: 'Success', type: 'success' });
          } else {
            useNotification().notify({ text: 'Source could not be deleted', title: 'Error', type: 'error' });
          }
          await refresh();
        },
        label: 'Delete',
      },
    ],
  });
}
</script>

<template>
  <div class="pt-[63px] w-full">
    <List>
      <template v-if="status !== 'pending'">
        <ListItem
          v-for="source of sources"
          :key="source?.id"
          @click="select(source)"
          @contextmenu.prevent="showContextMenu(source)"
        >
          <template #name1>
            {{ source?.name }}
          </template>
          <template #subtitle1>
            {{ source?.url }}
          </template>
          <template #badge>
            {{ source?.type }}
          </template>
        </ListItem>
      </template>
      <template v-else>
        <ListItem v-for="i of [1, 2]" :key="i" :pending="status === 'pending'" />
      </template>
    </List>
  </div>
</template>
