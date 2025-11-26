<script setup lang="ts">
import { usePollingState } from '~/states/polling';

const { isPolling } = usePollingState();
</script>

<template>
  <Transition name="fade">
    <div v-if="isPolling" class="flex items-center" title="Syncing data...">
      <span class="i-bi-arrow-repeat text-lg text-primary-500 animate-spin"></span>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
