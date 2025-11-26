<script setup lang="ts">
// ============================================================================
// Props
// ============================================================================
withDefaults(
  defineProps<{
    class?: string;
  }>(),
  {
    class: '',
  },
);
</script>

<template>
  <div class="animate-pulse rounded-md bg-foreground/10" :class="$props.class"></div>
</template>
