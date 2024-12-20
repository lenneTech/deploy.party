<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { array, object, string } from 'yup';

import type { User, UserCreateInput } from '~/base/default';
import type { ModalContext } from '~/composables/use-modal';

import { useInviteTeamMemberMutation, useUpdateUserMutation } from '~/base';
import { getRolesOptions } from '~/vars/roles';

const props = defineProps<{ context: ModalContext<{ member?: User; refreshFn: () => void }> }>();
const { close } = useModal();
const { notify } = useNotification();
const { teamState } = useTeamState();

const formSchema = toTypedSchema(
  object({
    email: string().email().required().lowercase().trim().label('E-Mail'),
    firstName: string().required().label('First Name'),
    lastName: string().required().label('Last Name'),
    roles: array().of(string().required()).required().label('Roles'),
    username: string().required().lowercase().label('Username'),
  }),
);

const { controlledValues, handleSubmit, isSubmitting } = useForm({
  initialValues: props.context.data?.member,
  validationSchema: formSchema,
});

const onSubmit = handleSubmit(async (values) => {
  if (props.context.data?.member?.id) {
    const { data, error } = await useUpdateUserMutation(
      {
        id: props.context.data?.member.id,
        input: controlledValues.value,
      },
      ['id'],
    );
    if (error) {
      useNotification().notify({ text: error?.message, title: 'Error', type: 'error' });
    }

    if (data) {
      notify({ text: 'Successfully updated user from team.', title: 'Successfully', type: 'success' });
      close();
      props.context.data?.refreshFn();
    }
  } else {
    const { data, error } = await useInviteTeamMemberMutation(
      {
        input: controlledValues.value as UserCreateInput,
        teamId: teamState.value.id,
      },
      ['id'],
    );
    if (error) {
      useNotification().notify({ text: error?.message, title: 'Error', type: 'error' });
    }

    if (data) {
      notify({ text: 'Successfully invited new user to team.', title: 'Successfully', type: 'success' });
      close();
      props.context.data?.refreshFn();
    }
  }
});
</script>

<template>
  <BaseModal
    class="p-10"
    :show="context.show"
    :show-inner="context.showInner"
    :size="context.size"
    @cancel="context.closable ? close() : null"
  >
    <div>
      <div class="relative">
        <h1 class="text-xl text-secondary-100 mb-5">Invite new member</h1>
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
        <FormInput label="E-Mail" name="email" type="email" />
        <FormSelect :options="getRolesOptions()" :multiple="true" label="Roles" name="roles" />
        <FormInput label="Firstname" name="firstName" type="text" />
        <FormInput label="Lastname" name="lastName" type="text" />
        <FormInput label="Username" name="username" type="text" />

        <div class="mt-5 sm:flex sm:flex-row-reverse">
          <FormSubmit v-if="context.data?.member?.id" label="Save" :is-submitting="isSubmitting" />
          <FormSubmit v-else label="Invite" :is-submitting="isSubmitting" />
        </div>
      </form>
    </div>
  </BaseModal>
</template>
