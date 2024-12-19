<script setup lang="ts">
import type { ModalContext } from '~/composables/use-modal';

const props = defineProps<{ context: ModalContext<{ text?: string }> }>();
const { close } = useModal();

function cancel() {
  close();
  props.context!.confirm!(false);
}

function confirm() {
  close();
  props.context!.confirm!(true);
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
        <h1 class="text-xl text-secondary-100 mb-5">Confirm the action</h1>
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

      <p class="text-foreground">
        {{ context.data?.text || 'Are you sure you want to continue?' }}
      </p>

      <div class="mt-7 gap-5 sm:flex sm:flex-row-reverse">
        <BaseButton type="button" variant="primary" @click="confirm()"> Yes </BaseButton>
        <BaseButton type="button" variant="outline" @click="cancel()"> Cancel </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
