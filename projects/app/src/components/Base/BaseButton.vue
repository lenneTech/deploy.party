<script setup lang="ts">
import { NuxtLink } from '#components';
import { twMerge } from 'tailwind-merge';

const props = defineProps<{
  to?: string;
  type?: string;
  variant: 'danger' | 'outline' | 'primary';
}>();

const variantClasses: Record<typeof props.variant, string> = {
  danger: '!bg-red-600 hover:!bg-red-700 focus:!ring-4 focus:!ring-red-300 !text-foreground',
  outline:
    '!bg-transparent border-border border hover:!bg-secondary-200 focus:!ring-4 focus:!ring-secondary-200 !text-foreground',
  primary: '!bg-primary-600 hover:!bg-primary-800 !focus:ring-4 focus:!ring-primary-300 !text-foreground',
};

const defaultClasses =
  'text-foreground bg-primary-600 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none transition-all duration-200';
const classes = twMerge(defaultClasses, variantClasses[props.variant]);
</script>

<template>
  <component :is="props.to ? NuxtLink : 'button'" :type="type" :to="to" :class="classes">
    <slot></slot>
  </component>
</template>
