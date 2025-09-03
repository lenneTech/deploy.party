<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { number, object, string } from 'yup';

import type { Container, ContainerInput } from '~/base/default';

const props = defineProps<{
  container?: Container | undefined;
  containerId?: string;
  disabled: boolean;
  projectId?: string;
  tab?: string;
}>();

const auth = ref(false);
const containerType = ref();
const typeOptions = [
  { label: 'Mongo', value: 'MONGO' },
  { label: 'MariaDB', value: 'MARIA_DB' },
  { label: 'Custom', value: 'CUSTOM' },
];
const mongoOptions = [
  { label: 'mongo:4.4', value: 'mongo:4.4' },
  { label: 'mongo:5', value: 'mongo:5' },
  { label: 'mongo:6', value: 'mongo:6' },
  { label: 'mongo:7', value: 'mongo:7' },
  { label: 'mongo:8', value: 'mongo:8' },
  { label: 'mongo:latest', value: 'mongo:latest' },
];
const mariaOptions = [
  { label: 'mariadb:11', value: 'mariadb:11' },
  { label: 'mariadb:11.1', value: 'mariadb:11.1' },
  { label: 'mariadb:11.2', value: 'mariadb:11.2' },
  { label: 'mariadb:11.3', value: 'mariadb:11.3' },
  { label: 'mariadb:11.8', value: 'mariadb:11.8' },
  { label: 'mariadb:11.8.3', value: 'mariadb:11.8.3' },
  { label: 'mariadb:12.0', value: 'mariadb:12.0' },
  { label: 'mariadb:lts', value: 'mariadb:lts' },
  { label: 'mariadb:latest', value: 'mariadb:latest' },
];

onMounted(() => {
  if (props.container?.basicAuth?.username || props.container?.basicAuth?.pw) {
    auth.value = true;
  }
});

const basicAuthSchema = object({
  basicAuth: object({
    pw: string().required(),
    username: string().required(),
  }),
});

const generalSchema = object({
  buildImage: string(),
  env: string().nullable(),
  exposedPort: string().nullable(),
  maxMemory: number().nullable(),
  name: string().required().max(14),
  type: string().required(),
});

const formSchema = computed(() => {
  return toTypedSchema(auth.value ? generalSchema.concat(basicAuthSchema) : generalSchema);
});

const {
  controlledValues: values,
  isSubmitting,
  meta,
  setFieldTouched,
  validate,
} = useForm({
  initialValues: props.container as any,
  validationSchema: formSchema,
});

onMounted(() => {
  containerType.value = props.container?.type;
});

async function submit() {
  const data = values.value;
  await validate();

  if (!values.value || isSubmitting.value || !meta.value.touched || !meta.value.valid) {
    return;
  }

  isSubmitting.value = true;

  if (!auth.value) {
    data.basicAuth = { pw: null, username: null };
  }

  const { data: result, error } = await useUpdateContainerMutation(
    {
      id: props.containerId as string,
      input: data as unknown as ContainerInput,
    },
    ['id'],
  );
  if (error) {
    useNotification().notify({ text: error?.message, title: 'Error', type: 'error' });
  }

  if (result) {
    useNotification().notify({ text: 'Successfully updated the container.', title: 'Well done', type: 'success' });
  }

  isSubmitting.value = false;
}

watch(
  () => auth.value,
  async () => {
    setTimeout(async () => {
      if (!auth.value) {
        setFieldTouched('name', true);
        await submit();
      }
    }, 800);
  },
);

watchDebounced(
  () => values.value,
  async () => {
    await submit();
  },
  { debounce: 800 },
);

const buildImageOptions = computed(() => {
  if (containerType.value === 'MONGO') {
    return mongoOptions;
  }

  if (containerType.value === 'MARIA_DB') {
    return mariaOptions;
  }

  return [];
});
</script>

<template>
  <form novalidate class="flex flex-wrap flex-col w-full" @submit.prevent="null">
    <div class="w-full space-y-8 border-b border-white/10 pb-12 sm:space-y-0 sm:divide-y sm:divide-white/10 sm:pb-0">
      <FormRow>
        <template #label> Name</template>
        <template #help> Enter a name for your container</template>
        <template #default>
          <FormInput name="name" class="w-full mx-auto max-w-2xl" type="text" :disabled="disabled" />
        </template>
      </FormRow>

      <FormRow>
        <template #label> Type</template>
        <template #help> Select a type for your database.</template>
        <template #default>
          <FormSelect
            v-model="containerType"
            name="type"
            class="w-full mx-auto max-w-2xl"
            placeholder="Select a type"
            :options="typeOptions"
            :disabled="disabled"
          />
        </template>
      </FormRow>

      <FormRow v-show="containerType !== 'CUSTOM'">
        <template #label> Base image</template>
        <template #help> Select a base image for your database.</template>
        <template #default>
          <FormSelect
            name="buildImage"
            class="w-full mx-auto max-w-2xl"
            placeholder="Select a image"
            :options="buildImageOptions"
            :disabled="disabled"
          />
        </template>
      </FormRow>

      <FormRow v-show="containerType !== 'CUSTOM'">
        <template #label> Exposed port </template>
        <template #help> DANGER! This will exposed the port to network. </template>
        <template #default>
          <FormInput name="exposedPort" class="w-full mx-auto max-w-2xl" type="text" :disabled="disabled" />
        </template>
      </FormRow>

      <FormRow v-if="containerType !== 'MONGO'">
        <template #label> environment </template>
        <template #help> Content of environment </template>
        <template #default>
          <FormCode name="env" class="w-full mx-auto max-w-2xl" :disabled="disabled" />
        </template>
      </FormRow>

      <FormRow v-show="containerType === 'MONGO'">
        <template #label> Max. memory</template>
        <template #help> Memory limit of database</template>
        <template #default>
          <FormInput
            name="maxMemory"
            placeholder="Enter a max memory"
            class="w-full mx-auto max-w-2xl"
            type="number"
            :disabled="disabled"
          />
        </template>
      </FormRow>

      <div v-show="containerType === 'CUSTOM'">
        <FormRow>
          <template #label> Base image</template>
          <template #help> Select a base image for your database.</template>
          <template #default>
            <FormInput
              name="buildImage"
              placeholder="Enter a image"
              class="w-full mx-auto max-w-2xl"
              type="text"
              :disabled="disabled"
            />
          </template>
        </FormRow>
      </div>

      <FormRow v-if="containerType === 'MONGO'">
        <template #label>Auth</template>
        <template #help> Activate auth for your database</template>
        <template #default>
          <BaseToggle v-model:active="auth" class="mx-auto" :disabled="disabled" />
        </template>
      </FormRow>

      <FormRow v-if="auth">
        <template #label> Username</template>
        <template #help> Enter a username for your database</template>
        <template #default>
          <FormInput
            name="basicAuth.username"
            placeholder="Select a username"
            class="w-full mx-auto max-w-2xl"
            type="text"
            :disabled="disabled"
          />
        </template>
      </FormRow>

      <FormRow v-if="auth">
        <template #label> Password</template>
        <template #help> Enter a password for your database</template>
        <template #default>
          <FormInput
            name="basicAuth.pw"
            placeholder="Select a password"
            class="w-full mx-auto max-w-2xl"
            type="text"
            :disabled="disabled"
          />
        </template>
      </FormRow>
    </div>
  </form>
</template>
