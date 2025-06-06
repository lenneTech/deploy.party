<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { object, string } from 'yup';

import { type Container, type ContainerInput, ContainerStatus } from '~/base/default';

const props = defineProps<{
  container?: Container | undefined;
  containerId?: string;
  disabled: boolean;
  projectId?: string;
}>();

const typeOptions = [
  { label: 'Directus', value: 'DIRECTUS' },
  { label: 'RocketAdmin', value: 'ROCKET_ADMIN' },
  { label: 'MongoExpress', value: 'MONGO_EXPRESS' },
  { label: 'Redis UI', value: 'REDIS_UI' },
  { label: 'Adminer', value: 'ADMINER' },
  { label: 'Custom', value: 'CUSTOM' },
];

const basicAuth = ref(false);
const basicAuthSchema = object({
  basicAuth: object({
    pw: string().required(),
    username: string().required(),
  }).nullable(),
});

const baseFormSchema = object({
  customDockerCompose: string()
    .nullable()
    .optional()
    .when('type', {
      is: 'CUSTOM',
      then: (schema) => schema.required(),
    }),
  env: string().nullable(),
  name: string().required().max(14),
  type: string().required(),
  url: string().required(),
});

const formSchema = computed(() => {
  return toTypedSchema(basicAuth.value ? baseFormSchema.concat(basicAuthSchema) : baseFormSchema);
});

const {
  controlledValues: values,
  isSubmitting,
  meta,
  validate,
} = useForm({
  initialValues: props.container as any,
  validateOnMount: false,
  validationSchema: formSchema,
});

watchDebounced(
  () => values.value,
  async () => {
    await submit();
  },
  { debounce: 800 },
);

onMounted(() => {
  if (props.container?.basicAuth?.username || props.container?.basicAuth?.pw) {
    basicAuth.value = true;
  }
});

async function submit() {
  await validate();

  if (!values.value || isSubmitting.value || !meta.value.touched || !meta.value.valid) {
    return;
  }

  isSubmitting.value = true;

  const { data, error } = await useUpdateContainerMutation(
    {
      id: props.containerId as string,
      input: values.value as ContainerInput,
    },
    ['id'],
  );
  if (error) {
    useNotification().notify({ text: error?.message, title: 'Error', type: 'error' });
  }

  if (data) {
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

      <FormRow v-if="container?.status !== ContainerStatus.DRAFT">
        <template #label> .env file </template>
        <template #help> Content of .env file </template>
        <template #default>
          <FormCode name="env" class="w-full mx-auto max-w-3xl" :disabled="disabled" />
        </template>
      </FormRow>

      <FormRow>
        <template #label> Basic Auth </template>
        <template #help> Enable basic auth for your container </template>
        <template #default>
          <BaseToggle v-model:active="basicAuth" class="mx-auto" :disabled="disabled" />
        </template>
      </FormRow>

      <template v-if="basicAuth">
        <FormRow>
          <template #label> Username </template>
          <template #help> Enter a username for your container </template>
          <template #default>
            <FormInput name="basicAuth.username" class="w-full mx-auto max-w-2xl" type="text" :disabled="disabled" />
          </template>
        </FormRow>
        <FormRow>
          <template #label> Password </template>
          <template #help> Enter a password for your container </template>
          <template #default>
            <FormInput name="basicAuth.pw" class="w-full mx-auto max-w-2xl" type="text" :disabled="disabled" />
          </template>
        </FormRow>
      </template>
    </div>
  </form>
</template>
