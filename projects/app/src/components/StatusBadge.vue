<script setup lang="ts">
import { twMerge } from 'tailwind-merge';

import type { ContainerKind } from '~/base/default';

import { type ContainerHealthStatus, ContainerStatus } from '~/base/default';

const props = withDefaults(
  defineProps<{
    badgeStyle: 'DEFAULT' | 'STATUS';
    size: 'MD' | 'SM';
    status: ContainerHealthStatus | ContainerKind | ContainerStatus | string;
  }>(),
  {
    badgeStyle: 'DEFAULT',
    size: 'MD',
    status: ContainerStatus.DRAFT as ContainerHealthStatus & ContainerStatus,
  },
);

const statusClasses: Record<typeof props.status, string> = {
  BUILDING: 'bg-yellow-500 text-yellow-800',
  DEPLOYED: 'bg-primary-900 text-primary-300',
  DIED: 'bg-rose-900 text-rose-300',
  DRAFT: 'bg-blue-900 text-blue-300',
  HEALTHY: 'bg-primary-900 text-primary-300',
  IDLE: 'bg-blue-900 text-blue-300',
  STOPPED: 'bg-rose-900 text-rose-300',
  STOPPED_BY_SYSTEM: 'bg-rose-900 text-rose-300',
  UNHEALTHY: 'bg-rose-900 text-rose-300',
};

const sizeClasses: Record<typeof props.size, string> = {
  MD: 'px-2.5 py-0.5 text-xs',
  SM: 'py-0.5 px-2.5 text-[0.6rem]',
};

const styleClasses: Record<typeof props.badgeStyle, string> = {
  DEFAULT: 'rounded-full flex-none ring-1 ring-inset',
  STATUS: 'rounded',
};

const defaultClasses = 'px-2.5 py-0.5 text-xs font-medium text-foreground/50 bg-background/10 ring-foreground/20';
let classes = twMerge(
  defaultClasses,
  statusClasses[props.status],
  sizeClasses[props.size],
  styleClasses[props.badgeStyle],
);

watch(
  () => props.status,
  () => {
    classes = twMerge(
      defaultClasses,
      statusClasses[props.status],
      sizeClasses[props.size],
      styleClasses[props.badgeStyle],
    );
  },
);
</script>

<template>
  <span :class="classes">{{ status }}<span v-if="status === 'BUILDING'" class="animate-typing">...</span> </span>
</template>
