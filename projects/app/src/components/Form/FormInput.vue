<script setup lang="ts">
import { ErrorMessage, useField } from 'vee-validate';

const props = defineProps<{
  disabled?: boolean;
  label?: string;
  name: string;
  placeholder?: string;
  type: string;
}>();
const hover = ref(false);

const { handleBlur, handleChange, meta, setTouched, value } = useField(() => props.name);

async function fillByClipboard() {
  value.value = await navigator.clipboard.readText();
}
</script>

<template>
  <div class="mt-3" @mouseover="hover = true" @mouseleave="hover = false">
    <label v-if="label" :for="name" class="block text-sm font-medium leading-6 text-foreground"
      >{{ label }}{{ meta.required ? '*' : '' }}</label
    >
    <div class="relative mt-2 pb-2">
      <span
        v-show="hover"
        class="absolute duration-200 right-0 -top-6 text-xs cursor-pointer font-light underline text-foreground/50 hover:text-primary"
        @click="fillByClipboard"
        >fill by clipboard</span
      >
      <input
        :id="name"
        v-model="value"
        :type="type"
        :name="name"
        :disabled="disabled"
        class="bg-background block w-full rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-border placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
        :placeholder="placeholder"
        @blur="handleBlur"
        @focus="setTouched(true)"
        @change="handleChange"
      />
      <ErrorMessage class="absolute -bottom-2 text-xs font-light text-red-600" :name="name" />
    </div>
  </div>
</template>
