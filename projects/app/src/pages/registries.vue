<script setup lang="ts">
import type { Registry } from '~/base/default';

import { useAsyncFindRegistrysQuery } from '~/base';
import ModalRegistry from '~/components/Modals/ModalRegistry.vue';

const { instanceName } = useRuntimeConfig().public;
useSeoMeta({
  title: `Registry | ${instanceName}`,
});

definePageMeta({
  breadcrumbs: 'Registry',
});

const { data, pending } = await useAsyncFindRegistrysQuery({}, ['id', 'name', 'url', 'username', 'pw']);
const registries = computed(() => data.value || []);

async function select(registry: Registry) {
  useModal().open({ component: ModalRegistry, data: { registry } });
}
</script>

<template>
  <div class="pt-[63px] w-full">
    <List>
      <template v-if="!pending">
        <ListItem v-for="registry of registries" :key="registry.id" :show-badge="false" @click="select(registry)">
          <template #name1>
            {{ registry.name }}
          </template>
          <template #subtitle1>
            {{ registry.url }}
          </template>
        </ListItem>
      </template>
      <template v-else>
        <ListItem v-for="i of [1]" :key="i" :pending="pending" />
      </template>
    </List>
  </div>
</template>
