<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { object, string } from 'yup';

import type { ModalContext } from '~/composables/use-modal';

import { useCreateContainerMutation } from '~/base';
import { getKindsOptions } from '~/vars/container-kinds';

const props = defineProps<{ context: ModalContext<{ projectId?: string }> }>();
const { close } = useModal();
const { notify } = useNotification();

const { data } = await useFindProjectsQuery(['id', 'name']);
const projectOptions = data.value?.findProjects.map((e) => {
  return { label: e.name, value: e.id };
});

const formSchema = toTypedSchema(
  object({
    kind: string().required(),
    name: string().required().max(14),
    projectId: string().required(),
  }),
);

const { handleSubmit, isSubmitting, resetForm } = useForm({
  validationSchema: formSchema,
});

onMounted(() => {
  if (props.context.data?.projectId) {
    resetForm({ values: { projectId: props.context.data.projectId } });
  }
});

const onSubmit = handleSubmit(async (values) => {
  const { kind, name, projectId } = values;
  const { mutate } = await useCreateContainerMutation({ input: { kind, name }, projectId: projectId }, ['id']);
  const result = await mutate();

  if (result?.data?.createContainer) {
    close();
    notify({ text: 'Successfully create a new container.', title: 'Well done', type: 'success' });
    navigateTo(`/projects/${projectId}/${result.data.createContainer.id}`);
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
        <h1 class="text-xl text-secondary-100 mb-5">Container</h1>
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

      <div class="max-h-[68vh] overflow-y-auto p-1">
        <form @submit="onSubmit">
          <FormSelect :options="projectOptions" label="Project" name="projectId" placeholder="Select project" />
          <FormInput label="Name" name="name" type="text" />
          <FormSelect :options="getKindsOptions()" label="Kind" name="kind" />
          <div class="mt-5 gap-5 sm:flex sm:flex-row-reverse">
            <FormSubmit label="Create" :is-submitting="isSubmitting" />
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
    </div>
  </BaseModal>
</template>
