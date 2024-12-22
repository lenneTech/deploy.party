<script setup lang="ts">
import type { ApiKey } from '~/base/default';

import { useAsyncFindApiKeysQuery, useDeleteApiKeyMutation } from '~/base';

definePageMeta({
  breadcrumbs: 'API-Keys',
});

const { open: openMenu } = useContextMenu();
const { data, refresh } = await useAsyncFindApiKeysQuery({}, null);
const keys = computed(() => data.value || []);

function showContextMenu(key: ApiKey) {
  openMenu({
    items: [
      {
        click: () => {
          const { $copyToClipboard } = useNuxtApp();
          $copyToClipboard(key.key!);
          useNotification().notify({ text: 'API-Key copied to clipboard', title: 'Success', type: 'success' });
        },
        label: 'Copy API-Key',
      },
      {
        click: async () => {
          const { data } = await useDeleteApiKeyMutation({ id: key.id! }, ['id']);
          if (data) {
            useNotification().notify({ text: 'API-Key deleted', title: 'Success', type: 'success' });
          } else {
            useNotification().notify({ text: 'API-Key could not be deleted', title: 'Error', type: 'error' });
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
  <List>
    <ListItem v-for="key of keys" :key="key?.id" @contextmenu.prevent="showContextMenu(key)">
      <template #name1>
        {{ key?.name }}
      </template>
      <template #subtitle1>
        {{ key?.key }}
      </template>
    </ListItem>
  </List>
</template>
