<script setup lang="ts">
import type { ModalContext } from '~/composables/use-modal';

const props = defineProps<{ context: ModalContext<{ text?: string; value: string }> }>();
const { close } = useModal();

const inputVal = ref('');
const invalidVal = ref(false);

function cancel() {
  invalidVal.value = false;
  close();
  props.context!.confirm!(false);
}

function confirm() {
  invalidVal.value = false;

  if (inputVal.value !== props.context.data?.value) {
    invalidVal.value = true;
    return;
  }

  close();
  props.context!.confirm!(true);
}

function copyName(name: string) {
  const { $copyToClipboard } = useNuxtApp();
  $copyToClipboard(name);
  useNotification().notify({ text: 'Successfully copy name', title: 'Success', type: 'success' });
}
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
        <h1 class="text-xl text-secondary-100 mb-5">Delete</h1>
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

      <p class="text-foreground mb-3">
        Are you sure you want to delete
        <span
          class="bg-foreground/10 ms-1 me-2 px-2 py-1 rounded text-foreground/80"
          @click="copyName(context.data?.value)"
          >{{ context.data?.value }}</span
        >
        continue?
      </p>

      <div>
        <input
          v-model="inputVal"
          type="text"
          placeholder="Enter name to confirm"
          class="bg-background block w-full rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset ring-border placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
        />
        <span v-if="invalidVal" class="text-sm text-red-500 font-light">Please enter correct name</span>
      </div>

      <div class="mt-7 gap-5 sm:flex sm:flex-row-reverse">
        <BaseButton type="button" variant="danger" @click="confirm()"> Delete</BaseButton>
        <BaseButton type="button" variant="outline" @click="cancel()"> Cancel</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
