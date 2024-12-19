<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    placement?: 'bottom' | 'top';
    tooltip?: string;
  }>(),
  {
    placement: 'top',
  },
);
const emit = defineEmits<{
  (event: 'click'): void;
}>();
</script>

<template>
  <button
    type="button"
    :data-tooltip-target="`tooltip-indicator-${tooltip}`"
    :data-tooltip-placement="placement"
    class="text-secondary-200 border-border border hover:bg-secondary-200 focus:ring-4 focus:outline-none focus:ring-secondary-200 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center bg-background dark:hover:bg-secondary-200 dark:focus:ring-secondary-200 hover:text-secondary-100 transition-all duration-200"
    @click.stop="emit('click')"
  >
    <slot></slot>
  </button>
  <div
    :id="`tooltip-indicator-${tooltip}`"
    role="tooltip"
    class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-secondary rounded-lg opacity-0 tooltip shadow"
  >
    {{ tooltip }}
    <div class="tooltip-arrow" data-popper-arrow></div>
  </div>
</template>
