<script setup lang="ts">
const { instanceName } = useRuntimeConfig().public;
useSeoMeta({
  title: `Admin | ${instanceName}`,
});

definePageMeta({
  breadcrumbs: 'Admin',
});

const tabs: any[] = [
  {
    label: 'General',
    to: '/admin',
  },
  {
    label: 'API-Keys',
    to: '/admin/api-keys',
  },
];
</script>

<template>
  <div class="pt-[65px]">
    <Tabs :tabs="tabs" />

    <NuxtPage />
  </div>
</template>
