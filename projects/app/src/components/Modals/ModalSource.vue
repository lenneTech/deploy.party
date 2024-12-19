<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { object, string } from 'yup';

import type { Source } from '~/base/default';
import type { ModalContext } from '~/composables/use-modal';

import { useCreateSourceMutation, useUpdateSourceMutation } from '~/base';

const props = defineProps<{ context: ModalContext<{ source: Source }> }>();
const { close } = useModal();
const source = computed(() => props.context.data?.source);
const typeOptions = [
  { label: 'Github', value: 'GITHUB' },
  { label: 'Gitlab', value: 'GITLAB' },
];

const formSchema = toTypedSchema(
  object({
    name: string().required(),
    token: string().required(),
    type: string().default('GITLAB').required(),
    url: string().url().required(),
  }),
);

const { handleSubmit, isSubmitting } = useForm({
  initialValues: source.value,
  validationSchema: formSchema,
});

const onSubmit = handleSubmit(async (values) => {
  if (source.value) {
    const { name, token, type, url } = values;
    const result = await useUpdateSourceMutation(
      { id: props.context.data?.source.id as string, input: { name, token, type, url } },
      null,
    );
    const mutation = await result.mutate();

    if (mutation?.data?.updateSource) {
      close();
      useNotification().notify({ text: 'Successfully updated this source.', title: 'Well done', type: 'success' });
    }
  } else {
    const { name, token, type, url } = values;
    const { teamState } = useTeamState();
    const result = await useCreateSourceMutation(
      { input: { name, team: teamState.value.id as string, token, type, url } },
      ['id'],
    );
    const data = await result.mutate();

    if (data?.data?.createSource) {
      close();
      useNotification().notify({ text: 'Successfully created this app.', title: 'Well done', type: 'success' });
    }
  }
});
</script>

<template>
  <BaseModal
    class="p-6"
    :show="context.show"
    :show-inner="context.showInner"
    :size="context.size"
    @cancel="context.closable ? close() : null"
  >
    <div>
      <div class="relative">
        <h1 class="text-xl text-secondary-100 mb-5">Source</h1>
        <div class="absolute right-0 top-0">
          <button
            type="button"
            class="rounded-md text-3xl text-secondary-150 hover:text-primary focus:outline-none"
            @click="close()"
          >
            <span class="sr-only">Close</span>
            <span class="i-bi-x"></span>
          </button>
        </div>
      </div>

      <form @submit="onSubmit">
        <FormInput label="Name" name="name" type="text" />
        <div class="relative mb-7">
          <FormInput label="URL" name="url" type="text" />
          <small class="text-foreground/50 text-xs font-light absolute -bottom-3"
            >For Github enter your profile url for example: https://github.com/pascal-klesse</small
          >
        </div>
        <FormInput label="Token" name="token" type="text" />
        <FormSelect label="Type" name="type" :options="typeOptions" />
        <div class="mt-5 sm:flex sm:flex-row-reverse">
          <FormSubmit :label="source ? 'Update' : 'Create'" :is-submitting="isSubmitting" />
        </div>
      </form>
    </div>
  </BaseModal>
</template>
