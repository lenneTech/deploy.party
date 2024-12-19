<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name: string;
    pending?: boolean;
  }>(),
  {
    pending: false,
  },
);
</script>

<template>
  <div class="bg-background border border-border rounded-md px-4 py-6 sm:px-6 lg:px-8">
    <p class="text-sm font-medium leading-6 text-gray-400">
      {{ name }}
    </p>
    <p v-if="!pending" class="mt-2 flex items-baseline gap-x-2">
      <span class="w-full text-4xl font-semibold tracking-tight text-white"><slot></slot></span>
    </p>
    <Spinner v-else />
  </div>
</template>
