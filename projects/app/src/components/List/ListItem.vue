<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    expandable?: boolean;
    expanded?: boolean;
    itemHeight?: number;
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
const contents = ref<HTMLElement>();

watch(
  () => props.expanded,
  () => {
    show.value = props.expanded;
  },
  { immediate: true },
);

const { height: targetHeight } = useElementSize(contents, undefined, {
  box: 'border-box',
});

const height = computed(() => (show.value ? targetHeight.value : 0));
</script>

<template>
  <li>
    <NuxtLink
      class="relative flex items-center cursor-pointer duration-200 space-x-4 px-4 py-4 sm:px-6 lg:px-8 hover:bg-hover"
      :style="
        itemHeight
          ? {
              height: `${itemHeight}px`,
            }
          : null
      "
      :to="to"
    >
      <div class="w-full min-w-0 flex-auto flex flex-col items-start justify-center">
        <div class="flex items-center gap-x-3">
          <div v-show="pending" class="h-3 rounded-full bg-gray-700 w-3 animate-pulse"></div>
          <h2 v-show="!pending" class="min-w-0 text-sm font-semibold leading-6 text-white">
            <span class="flex gap-x-2">
              <span class="truncate"><slot name="name1"></slot></span>
              <span v-if="$slots.name2" class="text-gray-400">/</span>
              <span class="whitespace-nowrap"><slot name="name2"></slot></span>
              <span class="absolute inset-0"></span>
            </span>
          </h2>
          <div v-show="pending" class="h-[18px] my-[3px] rounded-full bg-gray-700 w-40 animate-pulse"></div>
        </div>
        <div v-show="!pending" class="mt-2 flex items-center gap-x-2.5 text-xs leading-5 text-gray-400">
          <p v-if="$slots.subtitle1" class="truncate">
            <slot name="subtitle1"></slot>
          </p>
          <svg
            v-if="$slots.subtitle1 && $slots.subtitle2"
            viewBox="0 0 2 2"
            class="h-0.5 w-0.5 flex-none fill-gray-300"
          >
            <circle cx="1" cy="1" r="1" />
          </svg>
          <p v-if="$slots.subtitle2" class="whitespace-nowrap">
            <slot name="subtitle2"></slot>
          </p>
        </div>
        <div v-show="pending" class="flex items-center gap-4 mt-[12px]">
          <div class="h-[10px] my-[5px] rounded-full bg-gray-700 w-28 animate-pulse"></div>
          <div class="h-[10px] my-[5px] rounded-full bg-gray-700 w-36 animate-pulse"></div>
        </div>
      </div>

      <div
        v-if="$slots.badge"
        class="rounded-full flex-none py-1 px-2 text-xs font-medium ring-1 ring-inset text-gray-400 bg-gray-400/10 ring-gray-400/20"
      >
        <slot name="badge"></slot>
      </div>

      <div v-if="$slots.status" class="flex items-center justify-end gap-2">
        <slot name="status"></slot>
      </div>

      <div v-if="$slots.actions" class="flex items-center justify-center">
        <slot name="actions"></slot>
      </div>
    </NuxtLink>

    <div
      :style="{
        height: `${height}px`,
      }"
      class="overflow-hidden transition-[height] duration-500 will-change-[height]"
    >
      <div ref="contents" class="space-y-4 font-light leading-relaxed tracking-wide">
        <slot name="content"></slot>
      </div>
    </div>
  </li>
</template>
