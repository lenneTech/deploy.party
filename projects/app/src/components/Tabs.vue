<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    tabs: {
      beta?: boolean;
      condition?: boolean;
      exactActive?: boolean;
      label: string;
      to: string;
    }[];
  }>(),
  {
    beta: false,
    exactActive: false,
  },
);
</script>

<template>
  <div class="border-b border-gray-700 pb-[1px] -ms-4 md:-ms-0 -me-4 md:-me-0">
    <ul
      class="flex flex-wrap [&>*]:w-[25%] [&>*]:mr-0 md:[&>*]:mr-2 md:[&>*]:w-auto -mb-px text-sm font-medium text-center !bg-background opacity-100 text-secondary-150"
    >
      <li v-for="tab of tabs" :key="tab.label" class="mr-2">
        <NuxtLink
          v-if="tab.condition ?? true"
          :to="tab.to"
          class="w-full flex justify-center items-center p-4 border-b-2 rounded-t-lg border-transparent group transition duration-200 hover:text-primary-500"
          :exact-active-class="
            tab?.exactActive
              ? 'text-primary-600 border-primary-600 dark:text-primary-500 dark:border-primary-500'
              : undefined
          "
          :active-class="
            !tab?.exactActive
              ? 'text-primary-600 border-primary-600 dark:text-primary-500 dark:border-primary-500'
              : undefined
          "
        >
          {{ tab.label }}
          <span v-if="tab.beta" class="text-[9px] ml-1 -mt-4 text-primary-500">Beta</span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
