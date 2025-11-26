<script setup lang="ts">
import type { ModalContext } from '~/composables/use-modal';

import { useAsyncGetBackupByDatabaseQuery } from '~/base';

const props = defineProps<{ context: ModalContext }>();
const { close } = useModal();
const route = useRoute();

const { data, refresh } = await useAsyncGetBackupByDatabaseQuery(
  {
    containerId: route.params.containerId as string,
  },
  ['log'],
);
const log = computed<string[]>(() => data.value?.log || []);

usePolling(refresh, { interval: 4000 });
</script>

<template>
  <BaseModal
    class="p-6"
    :show="context.show"
    :show-inner="context.showInner"
    :size="context.size"
    @cancel="context.closable ? close() : null"
  >
    <div>
      <div class="relative">
        <h1 class="text-xl text-secondary-100 mb-5">Backup logs</h1>
        <div class="absolute right-0 top-0">
          <button
            type="button"
            class="rounded-md text-3xl text-secondary-150 hover:text-primary focus:outline-none"
            @click="close()"
          >
            <span class="sr-only">Close</span>
            <span class="i-bi-x"></span>
          </button>
        </div>
      </div>

      <Log :running="true" :log="log" max-height="350px" />
    </div>
  </BaseModal>
</template>
