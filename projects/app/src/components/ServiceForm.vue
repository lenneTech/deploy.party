<script setup lang="ts">
import type {Container, ContainerInput} from '~/base/default';
import {toTypedSchema} from "@vee-validate/yup";
import {object, string} from 'yup';
import {useForm} from "vee-validate";

const props = defineProps<{
  container?: Container | undefined;
  containerId?: string;
  disabled: boolean;
  projectId?: string;
}>();

const typeOptions = [
  { label: 'Directus', value: 'DIRECTUS' },
  { label: 'Adminer', value: 'ADMINER' },
  { label: 'Custom', value: 'CUSTOM' },
];

const formSchema = toTypedSchema(
    object({
      url: string().required(),
      name: string().required().max(14),
      type: string().required(),
      customDockerCompose: string().nullable().optional().when('type', {
        is: 'CUSTOM',
        then: (schema) => schema.required(),
      }),
    }),
);

const {
  controlledValues: values,
  isSubmitting,
  meta,
  validate,
} = useForm({
  initialValues: props.container as any,
  validationSchema: formSchema,
  validateOnMount: false,
});

watchDebounced(
    () => values.value,
    async () => {
        await submit();
    },
    { debounce: 800 },
);

async function submit() {
  await validate();

  if (!values.value || isSubmitting.value || !meta.value.touched || !meta.value.valid) {
    return;
  }

  isSubmitting.value = true;

  const { mutate, onError } = await useUpdateContainerMutation(
    {
      id: props.containerId as string,
      input: values.value as ContainerInput,
    },
    ['id'],
  );
  onError((e) => {
    useNotification().notify({ text: e.message, title: 'error', type: 'error' });
  });
  const result = await mutate();

  if (result?.data?.updateContainer) {
    useNotification().notify({ text: 'Successfully updated the container.', title: 'Well done', type: 'success' });
  }

  isSubmitting.value = false;
}
</script>

<template>
  <form novalidate class="flex flex-wrap flex-col w-full" @submit.prevent="null">
    <div class="w-full space-y-8 border-b border-white/10 pb-12 sm:space-y-0 sm:divide-y sm:divide-white/10 sm:pb-0">
      <FormRow>
        <template #label> Name </template>
        <template #help> Enter a name for your container </template>
        <template #default>
          <FormInput name="name" class="w-full mx-auto max-w-2xl" type="text" :disabled="disabled" />
        </template>
      </FormRow>

      <FormRow>
        <template #label> Type </template>
        <template #help> Select a type for your database. </template>
        <template #default>
          <FormSelect
              name="type"
              class="w-full mx-auto max-w-2xl"
              placeholder="Select a type"
              :options="typeOptions"
              :disabled="disabled"
          />
        </template>
      </FormRow>

      <FormRow v-if="values.type !== 'CUSTOM'">
        <template #label> Url </template>
        <template #help> Enter a url for your container </template>
        <template #default>
          <FormInput name="url" class="w-full mx-auto max-w-2xl" type="text" :disabled="disabled" />
        </template>
      </FormRow>

      <FormRow v-if="values.type === 'CUSTOM'">
        <template #label> Docker Compose </template>
        <template #help> Enter your Docker Compose file </template>
        <template #default>
          <FormCode name="customDockerCompose" class="w-full mx-auto max-w-2xl" :disabled="disabled" />
        </template>
      </FormRow>
    </div>
  </form>
</template>
