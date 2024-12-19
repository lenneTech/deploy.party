<script setup lang="ts">
const route = useRoute();
const { instanceName } = useRuntimeConfig().public;
const containerId = ref<string>(route.params.containerId ? (route.params.containerId as string) : '');

useSeoMeta({
  title: `Terminal | ${instanceName}`,
});

definePageMeta({
  breadcrumbs: 'Terminal',
});
</script>

<template>
  <ClientOnly>
    <div class="bg-[#282a36] p-3 rounded-md w-full h-full">
      <XTerm :container-id="containerId" />
    </div>
  </ClientOnly>
</template>
