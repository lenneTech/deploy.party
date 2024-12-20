<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { object, string } from 'yup';

import type { ModalContext } from '~/composables/use-modal';

const props = defineProps<{ context: ModalContext }>();
const { close } = useModal();
const registry = computed(() => props.context.data?.registry);

const formSchema = toTypedSchema(
  object({
    name: string().required(),
    pw: string(),
    url: string().required(),
    username: string(),
  }),
);

const { handleSubmit, isSubmitting } = useForm({
  initialValues: registry.value,
  validationSchema: formSchema,
});

const onSubmit = handleSubmit(async (values) => {
  if (registry.value) {
    const { data, error } = await useUpdateRegistryMutation({ id: registry.value?.id, input: values }, ['id']);
    if (error) {
      useNotification().notify({ text: error?.message, title: 'Error', type: 'error' });
    }

    if (data) {
      close();
      useNotification().notify({ text: 'Successfully updated this registry.', title: 'Well done', type: 'success' });
    }
  } else {
    const { teamState } = useTeamState();
    const { data, error } = await useCreateRegistryMutation({ input: values as any, teamId: teamState.value?.id }, [
      'id',
    ]);
    if (error) {
      useNotification().notify({ text: error?.message, title: 'Error', type: 'error' });
    }

    if (data) {
      close();
      useNotification().notify({ text: 'Successfully created this registry.', title: 'Well done', type: 'success' });
    }
  }
});

async function deleteRegistry() {
  const { data, error } = await useDeleteRegistryMutation({ id: registry.value?.id as string }, ['id']);
  if (error) {
    useNotification().notify({ text: error?.message, title: 'Error', type: 'error' });
  }

  if (data) {
    close();
    useNotification().notify({ text: 'Successfully deleted this registry.', title: 'Well done', type: 'success' });
  }
}
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
        <h1 class="text-xl text-secondary-100 mb-5">Registry</h1>
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
        <FormInput label="URL" name="url" type="text" />
        <FormInput label="Username" name="username" type="text" />
        <FormInput label="Password" name="pw" type="text" />

        <div class="mt-5 sm:flex sm:flex-row-reverse gap-5">
          <FormSubmit :label="registry ? 'Update' : 'Create'" :is-submitting="isSubmitting" />
          <BaseButton v-if="registry" variant="danger" type="button" @click="deleteRegistry"> Delete </BaseButton>
        </div>
      </form>
    </div>
  </BaseModal>
</template>
