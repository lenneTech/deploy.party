<script setup lang="ts">
import {twMerge} from 'tailwind-merge';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    backgroundColor?: string;
    show: boolean;
    showInner: boolean;
    size?: 'auto' | 'lg' | 'md' | 'sm';
  }>(),
  {
    backgroundColor: '#1D2025',
    size: 'auto',
  },
);

const emit = defineEmits<{
  (event: 'cancel'): void;
}>();

const attributes = useAttrs() as { class: string };
const sizeClasses: Record<typeof props.size, string> = {
  auto: 'md:min-w-[500px] w-auto p-4',
  lg: 'w-4/5 md:w-4/5',
  md: 'w-4/5 md:w-3/6',
  sm: 'w-11/12 md:w-[480px]',
};
const defaultClasses =
  'duration-200 w-full overflow-hidden rounded-lg p-4 bg-[--bg-color] border border-border bg-background flex flex-col gap-4 max-h-[80vh] overflow-y-auto';
const classes = twMerge(defaultClasses, sizeClasses[props.size], attributes?.class);
</script>

<template>
  <div
    class="relative z-[100]"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
    :style="`--bg-color: ${props.backgroundColor};`"
  >
    <TransitionFade>
      <div
        v-show="show"
        class="fixed inset-0 bg-background/30 backdrop-blur-sm transition-opacity flex justify-center items-center"
        @click="emit('cancel')"
      >
        <TransitionFade class="w-full flex justify-center">
          <div v-show="showInner" :class="classes" @click.stop>
            <slot></slot>
          </div>
        </TransitionFade>
      </div>
    </TransitionFade>
  </div>
</template>
