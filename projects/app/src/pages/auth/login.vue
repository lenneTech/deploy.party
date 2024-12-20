<script setup lang="ts">
import { useAuth, useBackgroundKeys, useTeamState } from '#imports';
import { toTypedSchema } from '@vee-validate/yup';
import { Form, useForm } from 'vee-validate';
import { object, string } from 'yup';

import FormSubmit from '~/components/Form/FormSubmit.vue';

const { instanceName } = useRuntimeConfig().public;
useSeoMeta({
  title: `Login | ${instanceName}`,
});

definePageMeta({
  layout: false,
});

const { init } = useBackgroundKeys();
const { $pwa } = useNuxtApp();

const formSchema = toTypedSchema(
  object({
    email: string().email().required(),
    password: string().min(6).required(),
  }),
);

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: formSchema,
});

const onSubmit = handleSubmit.withControlled(async (values) => {
  const { data, error } = await useSignInMutation({ input: values }, [
    'token',
    'refreshToken',
    { user: ['id', 'email', 'firstName', 'lastName', 'avatar', 'roles', { team: ['id'] }] },
  ]);

  if (error) {
    useNotification().notify({ text: error?.message, title: 'Error', type: 'error' });
  }

  if (data) {
    const signIn = data;
    const { setCurrentUser, setTokens } = useAuth();
    const { teamState } = useTeamState();
    teamState.value = signIn.user.team;
    setTokens(signIn.token!, signIn.refreshToken!);
    setCurrentUser(signIn.user);
    useNotification().notify({ text: 'Successfully logged in.', title: 'Well done', type: 'success' });
    await navigateTo('/');

    setTimeout(() => {
      init();
    }, 500);

    await $pwa.subscribe();
  }
});
</script>

<template>
  <div class="flex min-h-screen bg-background flex-col justify-center px-6 py-12 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-foreground">
        Sign in to your account
      </h2>
    </div>

    <div class="mt-5 sm:mx-auto sm:w-full sm:max-w-sm">
      <form @submit="onSubmit">
        <FormInput label="E-Mail" name="email" type="email" />
        <FormPassword label="Password" name="password" />

        <div class="flex items-center justify-center mt-5">
          <FormSubmit label="Sign in" :is-submitting="isSubmitting" />
        </div>
      </form>
    </div>
  </div>
</template>
