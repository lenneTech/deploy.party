<script setup lang="ts">
import type { CommandOption } from '~/components/CommandPalette/CommandPalette.vue';

const props = withDefaults(
  defineProps<{
    option: CommandOption;
    selected?: boolean;
  }>(),
  {
    selected: false,
  },
);
</script>

<template>
  <li
    role="option"
    class="group flex select-none items-center rounded-md px-3 py-2 duration-200 cursor-pointer"
    :class="props.selected ? 'bg-secondary-200 text-secondary-100' : ''"
  >
    <!-- Active: "text-white", Not Active: "text-gray-500" -->
    <svg
      class="h-6 w-6 flex-none text-gray-500"
      :class="props.selected ? 'text-secondary-100' : ''"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
    <span class="ml-3 flex-auto truncate" :class="props.selected ? 'text-secondary-100' : ''">{{
      props.option.label
    }}</span>
    <span class="ml-3 flex-none text-xs font-semibold text-gray-400"
      ><Key>{{ props.option.shortcut }}</Key></span
    >
  </li>
</template>
