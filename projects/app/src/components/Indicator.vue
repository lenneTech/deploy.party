<script setup lang="ts">
import { twMerge } from 'tailwind-merge';

import type { ContainerHealthStatus, ContainerStatus } from '~/base/default';

const props = withDefaults(
  defineProps<{
    size: 'MD' | 'SM';
    status: ContainerHealthStatus | ContainerStatus;
  }>(),
  {
    size: 'MD',
    status: 'DRAFT' as ContainerHealthStatus,
  },
);

const sizeClasses: Record<typeof props.size, string> = {
  MD: 'w-3 h-3',
  SM: 'w-2.5 h-2.5',
};

const statusClasses: Record<typeof props.status, string> = {
  BUILDING: 'bg-yellow-500',
  DEPLOYED: 'bg-primary-500',
  DIED: 'bg-red-600',
  DRAFT: 'bg-foreground/10',
  HEALTHY: 'bg-primary-500',
  IDLE: 'bg-yellow-500',
  STOPPED: 'bg-foreground/10',
  STOPPED_BY_SYSTEM: 'bg-orange-600',
  UNHEALTHY: 'bg-red-600',
};
const defaultClasses = 'flex items-center rounded-[2px] opacity-80';
const classes = twMerge(defaultClasses, statusClasses[props.status], sizeClasses[props.size]);
</script>

<template>
  <span :class="classes"></span>
</template>
