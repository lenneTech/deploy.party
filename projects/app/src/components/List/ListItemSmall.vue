<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    expandable?: boolean;
    expanded?: boolean;
    pending?: boolean;
    to?: string;
  }>(),
  {
    expandable: false,
    expanded: false,
    pending: false,
  },
);

const show = ref(false);

watch(
  () => props.expanded,
  () => {
    show.value = props.expanded;
  },
  { immediate: true },
);
</script>

<template>
  <li>
    <NuxtLink
      class="relative flex items-center cursor-pointer duration-200 space-x-2 px-4 sm:lg:px-8 hover:bg-hover h-10 group"
      :to="to"
    >
      <div class="min-w-0 flex-auto flex items-center">
        <div class="flex items-center gap-x-2">
          <div v-show="pending" class="h-3 rounded-full bg-gray-700 w-3 animate-pulse"></div>
          <h2 v-show="!pending" class="min-w-0 text-[0.8rem] font-semibold text-white">
            <span class="flex gap-x-2 items-center">
              <span class="truncate font-light"><slot name="name1"></slot></span>
            </span>
          </h2>
          <div v-show="pending" class="h-[18px] my-[3px] rounded-full bg-gray-700 w-40 animate-pulse"></div>
        </div>

        <div v-show="pending" class="flex items-center gap-4 mt-[12px]">
          <div class="h-[10px] my-[5px] rounded-full bg-gray-700 w-28 animate-pulse"></div>
          <div class="h-[10px] my-[5px] rounded-full bg-gray-700 w-36 animate-pulse"></div>
        </div>
      </div>
      <div class="flex items-center">
        <span class="whitespace-nowrap text-[0.7rem] font-light text-foreground/50">
          <slot name="subtitle2"></slot>
        </span>
      </div>

      <div v-if="$slots.badge" class="flex items-center justify-center">
        <slot name="badge"></slot>
      </div>
      <div v-if="$slots.prebadge" class="flex items-center justify-center">
        <slot name="prebadge"></slot>
      </div>
      <div v-if="$slots.statusbadge" class="flex items-center justify-center">
        <slot name="statusbadge"></slot>
      </div>

      <div v-if="$slots.actions" class="flex-none">
        <slot name="actions"></slot>
      </div>

      <slot name="status"></slot>
    </NuxtLink>
  </li>
</template>
