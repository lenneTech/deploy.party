<script setup lang="ts">
import hljs from 'highlight.js';
import CodeEditor from 'simple-code-editor';
import { ErrorMessage, useField } from 'vee-validate';

const props = defineProps<{
  disabled?: boolean;
  label?: string;
  multiple?: boolean;
  name: string;
  placeholder?: string;
}>();

onMounted(() => {
  if (process.client) {
    hljs.highlightAll();
  }
});

const { handleBlur, handleChange, resetField, setTouched, setValue, value } = useField(() => props.name);

if (!value.value) {
  setValue('', false);
}

function textarea(node) {
  node.addEventListener('input', (event) => {
    setValue(event.target.value, true);
    setTouched(true);
  });
}
</script>

<template>
  <div class="relative mt-3 pb-2">
    <ClientOnly>
      <CodeEditor
        :id="name"
        v-model="value"
        :name="name"
        width="100%"
        :copy-code="true"
        :class="{ 'pointer-events-none': disabled }"
        :line-nums="true"
        min-height="400px"
        font-size="16px"
        :header="false"
        :placeholder="placeholder ?? ''"
        border-radius="4px"
        theme="atom-one-dark"
        :languages="[['txt', 'yml']]"
        @focus="setTouched(true)"
        @textarea="textarea"
        @blur="handleBlur"
      />
    </ClientOnly>
    <ErrorMessage class="absolute -bottom-2 text-xs font-light text-red-600" :name="name" />
  </div>
</template>

<style>
.code-editor .code-area > textarea,
.code-area,
.hljs {
  min-height: 400px;
}
</style>
