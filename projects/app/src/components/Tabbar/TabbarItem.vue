<script setup lang="ts">
const props = defineProps<{
  icon: string;
  title: string;
  to: string;
}>();

function activeNavItemClass() {
  const { fullPath } = useRoute();
  const path = fullPath.indexOf('?') > 0 ? fullPath.slice(0, fullPath.indexOf('?')) : fullPath;
  const activeClasses = '!bg-secondary-200 !text-primary-500 [&>span]:ms-2 [&>span]:w-auto';

  if (props.to === '/') {
    return path === props.to ? activeClasses : '';
  }

  if (path.startsWith(props.to)) {
    return activeClasses;
  }

  return '';
}
</script>

<template>
  <NuxtLink
    :to="to"
    class="flex justify-center items-center transition-[width] duration-500 text-secondary-150 px-5 py-3 rounded-full overflow-hidden"
    :class="activeNavItemClass()"
  >
    <Icon class="transition-all duration-200" :name="icon" size="18" />
    <span class="group/title w-0 text-[10px] overflow-hidden transition-all duration-500">{{ title }}</span>
  </NuxtLink>
</template>
