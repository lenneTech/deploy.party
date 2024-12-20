<script setup lang="ts">
import { useLoader } from '~/composables/use-loader';

const { loading } = useLoader();
</script>

<template>
  <div class="flex bg-background h-screen overflow-hidden">
    <Sidebar />
    <Tabbar />

    <div
      class="max-h-screen flex flex-col grow w-[78%] pb-16 lg:pb-0 relative overflow-y-auto pt-[env(safe-area-inset-top)] no-scrollbar overscroll-contain"
    >
      <LoadingBar :loading="loading" />
      <Header />
      <slot></slot>
    </div>
  </div>
</template>
