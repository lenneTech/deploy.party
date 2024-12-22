<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { object, ref, string } from 'yup';

import { useResetPasswordMutation } from '~/base';

const { instanceName } = useRuntimeConfig().public;
useSeoMeta({
  title: `Password set | ${instanceName}`,
});

definePageMeta({
  layout: false,
});

const route = useRoute();
const { notify } = useNotification();

onMounted(() => {
  if (!route.query.token) {
    navigateTo('/auth/login');
  }
});

const formSchema = toTypedSchema(
  object({
    password: string().required('Password is required.'),
    password_confirm: string()
      .required()
      .min(6)
      .oneOf([ref('password')], 'Passwords must match.'),
  }),
);

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: formSchema,
});

const onSubmit = handleSubmit.withControlled(async (values) => {
  const { data, error } = await useResetPasswordMutation({
    password: values.password,
    token: route.query.token as string,
  });

  if (error) {
    useNotification().notify({ text: error?.message, title: 'Error', type: 'error' });
  }

  if (data) {
    notify({ text: 'Successfully set password.', title: 'Successfully', type: 'success' });
    navigateTo('/auth/login');
  }
});
</script>

<template>
  <div class="flex min-h-screen bg-background flex-col justify-center px-6 py-12 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-foreground">
        Set password for your account
      </h2>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <form class="space-y-6" novalidate @submit.prevent="onSubmit">
        <FormPassword name="password" label="Password" />
        <FormPassword name="password_confirm" label="Password" />

        <FormSubmit :is-submitting="isSubmitting" label="Set password" />
      </form>
    </div>
  </div>
</template>
