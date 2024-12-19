<script setup lang="ts">
const props = defineProps<{
  headers: [{ classes?: string; labelField: string; title: string }];
}>();
</script>

<template>
  <div class="relative overflow-x-auto">
    <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
      <thead class="text-secondary-100 dark:bg-secondary dark:text-gray-400 border-b border-secondary-200">
        <tr>
          <th v-for="header of headers" :key="header.title" scope="col" class="px-6 py-3" :class="header.classes">
            {{ header.title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <slot></slot>
      </tbody>
    </table>
  </div>
</template>
