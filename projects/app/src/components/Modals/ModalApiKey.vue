<script setup lang="ts">
import {toTypedSchema} from '@vee-validate/yup';
import {useForm} from 'vee-validate';
import {object, string} from 'yup';

import type {ModalContext} from '~/composables/use-modal';
import {useCreateApiKeyMutation} from "~/base";

const props = defineProps<{ context: ModalContext }>();
const {close} = useModal();

const formSchema = toTypedSchema(
    object({
      name: string().required().max(14),
    }),
);

const {handleSubmit, isSubmitting} = useForm({
  validationSchema: formSchema,
});

const onSubmit = handleSubmit.withControlled(async (values) => {
  const result = await useCreateApiKeyMutation({input: values}, ['id']);
  result.onError((e) => {
    useNotification().notify({text: e.message, title: 'error', type: 'error'});
  });
  const mutation = await result.mutate();

  if (mutation?.data?.createApiKey) {
    close();
    useNotification().notify({text: 'Successfully create a new api key.', title: 'Well done', type: 'success'});
  }
}, ({errors}) => {
  console.error(errors);
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
        <h1 class="text-xl text-secondary-100 mb-5">API-Key</h1>
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
        <FormInput label="Name" name="name" type="text" placeholder="deploy.board" />
        <div class="mt-5 gap-5 sm:flex sm:flex-row-reverse">
          <FormSubmit label="Create" :is-submitting="isSubmitting"/>
          <button
              type="button"
              class="mt-3 inline-flex w-full justify-center rounded-md bg-transparent px-3 py-2 text-sm font-semibold text-secondary-150 border border-secondary-150 shadow-sm hover:bg-secondary-200 sm:ml-3 duration-200 sm:mt-0 sm:w-auto"
              @click="close()"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </BaseModal>
</template>
