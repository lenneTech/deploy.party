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
  { label: 'Adminer', value: 'ADMINER' },
  { label: 'CHouse UI', value: 'CHOUSE_UI' },
  { label: 'ClickHouse UI', value: 'CLICKHOUSE_UI' },
  { label: 'Custom', value: 'CUSTOM' },
  { label: 'Directus', value: 'DIRECTUS' },
  { label: 'MongoExpress', value: 'MONGO_EXPRESS' },
  { label: 'Plausible', value: 'PLAUSIBLE' },
  { label: 'Redis UI', value: 'REDIS_UI' },
  { label: 'RocketAdmin', value: 'ROCKET_ADMIN' },
];

const basicAuth = ref(false);
const basicAuthSchema = object({
  basicAuth: object({
    pw: string().required(),
    username: string().required(),
  }).nullable(),
});

const baseFormSchema = object({
  additionalNetworks: string().nullable().optional(),
  adminerDefaultServer: string().nullable().optional(),
  buildImage: string()
    .nullable()
    .optional()
    .matches(/^[a-zA-Z0-9._-]+$/, 'Only alphanumeric characters, dots, hyphens, and underscores are allowed')
    .max(50, 'Version must be at most 50 characters'),
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

// Transform container data for form (convert arrays to strings for input fields)
const getInitialValues = () => {
  if (!props.container) {
    return undefined;
  }
  const values = { ...props.container } as any;
  // Convert additionalNetworks array to comma-separated string
  if (Array.isArray(values.additionalNetworks)) {
    values.additionalNetworks = values.additionalNetworks.join(', ');
  }
  return values;
};

const {
  controlledValues: values,
  isSubmitting,
  meta,
  validate,
} = useForm({
  initialValues: getInitialValues(),
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

  // Convert comma-separated networks string to array
  const input = { ...values.value } as { additionalNetworks?: string | string[] } & ContainerInput;
  if (typeof input.additionalNetworks === 'string') {
    input.additionalNetworks = input.additionalNetworks
      .split(',')
      .map((n: string) => n.trim())
      .filter((n: string) => n.length > 0);
  }

  const { data, error } = await useUpdateContainerMutation(
    {
      id: props.containerId as string,
      input: input as ContainerInput,
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
        <template #label> Docker Image Version </template>
        <template #help> Enter the Docker image version tag (e.g., latest, 1.0.0, 10.8.3) </template>
        <template #default>
          <FormInput
            name="buildImage"
            class="w-full mx-auto max-w-2xl"
            type="text"
            placeholder="latest"
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

      <FormRow v-if="values.type !== 'CUSTOM'">
        <template #label> Zusätzliche Netzwerke </template>
        <template #help> Docker-Netzwerke für Zugriff auf andere Container (kommasepariert) </template>
        <template #default>
          <FormInput
            name="additionalNetworks"
            class="w-full mx-auto max-w-2xl"
            type="text"
            placeholder="z.B. myapp_default, clickhouse-net"
            :disabled="disabled"
          />
        </template>
      </FormRow>

      <FormRow v-if="values.type === 'ADMINER'">
        <template #label> Standard Server </template>
        <template #help> Vorausgefüllter Server im Login-Formular </template>
        <template #default>
          <FormInput
            name="adminerDefaultServer"
            class="w-full mx-auto max-w-2xl"
            type="text"
            placeholder="z.B. clickhouse:8123, mongo:27017"
            :disabled="disabled"
          />
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
