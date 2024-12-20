<script setup lang="ts">
import { ErrorMessage, useField } from 'vee-validate';

import Spinner from '~/components/Spinner.vue';

interface Option {
  label: string;
  value: string;
}

const props = defineProps<{
  disabled?: boolean;
  label?: string;
  loading?: boolean;
  modelValue?: any;
  multiple?: boolean;
  name: string;
  options: Option[];
  placeholder?: string;
}>();
const emit = defineEmits(['update:modelValue']);
const loadingRef = ref(false);
const { handleBlur, handleChange, meta, setTouched, value } = useField(() => props.name);

watch(
  () => props.loading,
  (newValue) => {
    loadingRef.value = newValue ?? false;
  },
);

watch(
  () => props.modelValue,
  (newValue) => {
    value.value = newValue;
  },
);

watch(
  () => value.value,
  (newValue) => {
    emit('update:modelValue', newValue);
  },
);
</script>

<template>
  <div class="relative mt-3 pb-2">
    <label v-if="label" :for="name" class="block text-sm font-medium leading-6 text-foreground"
      >{{ label }}{{ meta.required ? '*' : '' }}</label
    >

    <select
      :id="name"
      v-model="value"
      :name="name"
      :multiple="multiple ?? false"
      :disabled="disabled"
      class="bg-background mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-foreground ring-1 ring-inset ring-border focus:ring-1 focus:ring-primary-500 sm:text-sm sm:leading-6"
      @focus="setTouched(true)"
      @blur="handleBlur"
      @change="handleChange"
    >
      <option :value="null" :disabled="meta.required" selected>{{ placeholder }}</option>
      <option v-for="option of options" :key="option.value" :value="option.value">{{ option.label }}</option>
    </select>
    <div v-show="loadingRef" class="absolute -right-10 top-1/2 transform -translate-y-1/2">
      <Spinner size="sm" />
    </div>
    <ErrorMessage class="absolute -bottom-2 text-xs font-light text-red-600" :name="name" />
  </div>
</template>
