<script setup lang="ts">
const props = defineProps<{
  to: any;
}>();

function activeNavItemClass() {
  const { fullPath, query } = useRoute();
  const activeClasses = '!text-primary !bg-active';

  if (props.to === '/') {
    return fullPath === props.to ? activeClasses : '';
  }

  if (fullPath.startsWith(props.to)) {
    return activeClasses;
  }

  if (typeof props.to === 'object') {
    if (fullPath.startsWith(props.to.path) && !query.tab && !props.to.query?.tab) {
      return activeClasses;
    }

    if (props.to?.query?.tab && query.tab) {
      return query.tab === props.to.query.tab ? activeClasses : '';
    }
  }

  return '';
}
</script>

<template>
  <li>
    <NuxtLink
      :to="to"
      :class="activeNavItemClass()"
      class="flex items-center p-2 rounded-md text-sm leading-6 font-semibold text-foreground hover:bg-hover group transition-all duration-200"
    >
      <slot></slot>
    </NuxtLink>
  </li>
</template>
