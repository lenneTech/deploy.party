<script setup lang="ts">
const { startAllStoppedContainers, stopAllContainer } = useAdmin();
const config = useRuntimeConfig().public;

definePageMeta({
  breadcrumbs: 'Admin',
});
</script>

<template>
  <div
    class="space-y-8 border-b border-white/10 pb-12 sm:space-y-0 sm:divide-y sm:divide-white/10 sm:pb-0 text-white w-full"
  >
    <FormRow class="px-4">
      <template #label> Version </template>
      <template #default>
        <div class="w-full flex items-center justify-center">
          <span>{{ config.version }}</span>
        </div>
      </template>
    </FormRow>
    <FormRow class="px-4">
      <template #label> Stop all containers </template>
      <template #help>
        All containers will be stopped by system. This is will be usefully for system updates.
      </template>
      <template #default>
        <div class="w-full flex items-center justify-center">
          <BaseButton @click="stopAllContainer()"> Stop </BaseButton>
        </div>
      </template>
    </FormRow>
    <FormRow class="px-4">
      <template #label> Start all stopped containers </template>
      <template #help> All stopped containers will be start by system. </template>
      <template #default>
        <div class="w-full flex items-center justify-center">
          <BaseButton @click="startAllStoppedContainers()"> Start </BaseButton>
        </div>
      </template>
    </FormRow>
  </div>
</template>
