<script setup lang="ts">
import type { Source } from '~/base/default';

import { useDeleteSourceMutation, useFindSourcesQuery } from '~/base';
import ModalSource from '~/components/Modals/ModalSource.vue';

const { instanceName } = useRuntimeConfig().public;
useSeoMeta({
  title: `Sources | ${instanceName}`,
});

definePageMeta({
  breadcrumbs: 'Sources',
});

const { open: openMenu } = useContextMenu();
const { data, pending, refresh } = await useFindSourcesQuery({}, null, true);
const sources = computed<Source[]>(() => data.value?.findSources || []);

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
          const { mutate } = await useDeleteSourceMutation({ id: source.id! }, ['id']);
          const result = await mutate();
          if (result?.data?.deleteSource) {
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
      <template v-if="!pending">
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
        <ListItem v-for="i of [1, 2]" :key="i" :pending="pending" />
      </template>
    </List>
  </div>
</template>
