<script setup>
const route = useRoute();
const router = useRouter();

const crumbsRoute = computed(() => {
  let fullPath = "";
  const routes = route.fullPath.substring(1).split("/");
  return routes
      .map((route) => {
        if (route) {
          fullPath = `${fullPath}/${route}`;
          return router.resolve(fullPath);
        }
      })
      .filter((route) => route?.meta.breadcrumbs)
      .filter(Boolean);
});
</script>

<template>
  <ul class="flex items-center space-x-2">
    <li
        v-for="(crumb, index) in crumbsRoute"
        :key="crumb.name"
        class="flex items-center gap-2">
      <NuxtLink
          :to="crumb.fullPath"
          no-prefetch
          class="text-foreground hover:text-primary-500 transition-colors duration-200"
          :class="{ 'text-beta-gray-500': index === crumbsRoute.length - 1 }"
      >
        {{ crumb.meta.breadcrumbs }}
      </NuxtLink>
      <span v-if="(index + 1) !== crumbsRoute.length" class="i-bi-chevron-right text-md text-foreground"></span>
    </li>
  </ul>
</template>