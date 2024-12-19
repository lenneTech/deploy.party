<script setup lang="ts">
import type {Project} from '~/base/default';
import type {ModalContext} from '~/composables/use-modal';
import {object, string} from "yup";
import {toTypedSchema} from "@vee-validate/yup";
import {useForm} from "vee-validate";

const props = defineProps<{ context: ModalContext<{ project: Project; refresh: () => void }> }>();
const {close} = useModal();
const target = ref(null);
const {currentUserState: user} = useAuthState();
const project = computed(() => props.context.data?.project);
onClickOutside(target, (event) => close(500));
const isSubscribed = computed(() => project.value?.subscribers?.map((e) => e.id)?.includes(user.value.id) ?? false);

const formSchema = toTypedSchema(
    object({
      name: string().required().max(14),
      identifier: string().optional().uppercase().max(4),
    }),
);

const {controlledValues, validate, meta} = useForm({
  validationSchema: formSchema,
  initialValues: props.context.data?.project,
});

const {mutate} = await useUpdateProjectMutation(
    {id: props.context.data?.project.id as string, input: {name: controlledValues.value.name}},
    ['id'],
);

watchDebounced(
    () => controlledValues.value,
    async () => {
      await submit();
    },
    {debounce: 800},
);

async function submit() {
  await validate()

  if (!meta.value.touched || !meta.value.valid) {
    return;
  }

  const result = await mutate({
    id: props.context.data?.project.id as string,
    input: {
      name: controlledValues.value.name,
      identifier: controlledValues.value.identifier,
    },
  });

  if (result?.data?.updateProject) {
    useNotification().notify({text: 'Project updated', title: 'Successfully', type: 'success'});
    if (props.context.data?.refresh) {
      props.context.data.refresh();
    }
  }
}

async function subscribeToProject() {
  const result = await mutate({
    id: props.context.data?.project.id as string,
    input: {
      subscribers: [...(project.value?.subscribers?.map((user) => user.id) ?? []), user.value.id],
    },
  });

  if (result?.data?.updateProject) {
    useNotification().notify({text: 'Subscribed to project', title: 'Successfully', type: 'success'});
    props.context.data?.refresh();
  }
}

async function unsubscribeToProject() {
  const result = await mutate({
    id: props.context.data?.project.id as string,
    input: {
      subscribers: project.value?.subscribers?.map((user) => user.id).filter((id) => id !== user.value.id) ?? [],
    },
  });

  if (result?.data?.updateProject) {
    useNotification().notify({text: 'Unsubscribed from project', title: 'Successfully', type: 'success'});
    props.context.data?.refresh();
  }
}
</script>

<template>
  <div class="relative z-[100]" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
    <TransitionFade>
      <div
          v-show="props.context.show"
          class="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
          @click="close(500)"
      ></div>
    </TransitionFade>
    <div class="fixed inset-0 overflow-hidden">
      <div class="absolute inset-0 overflow-hidden">
        <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
          <Transition
              enter-active-class="transform transition ease-in-out duration-500 sm:duration-700"
              enter-from-class="translate-x-full"
              enter-to-class="translate-x-0"
              leave-active-class="transform transition ease-in-out duration-500 sm:duration-700"
              leave-from-class="translate-x-0"
              leave-to-class="translate-x-full"
          >
            <div v-show="props.context.showInner" ref="target" class="pointer-events-auto w-screen max-w-md">
              <form novalidate @submit.prevent="null" class="flex h-full flex-col divide-y divide-border bg-background shadow-xl">
                <div class="h-0 flex-1 overflow-y-auto">
                  <div class="bg-background px-4 py-6 sm:px-6">
                    <div class="flex items-center justify-between">
                      <h2 id="slide-over-title" class="text-base font-semibold leading-6 text-white">Project</h2>
                      <div class="ml-3 flex h-7 items-center">
                        <button
                            type="button"
                            class="relative rounded-md text-white hover:text-primary focus:outline-none focus:ring-2 focus:ring-white"
                            @click="close()"
                        >
                          <span class="i-bi-x text-2xl"></span>
                        </button>
                      </div>
                    </div>
                    <div class="mt-1">
                      <p class="text-sm text-white">Change information about the project</p>
                    </div>
                  </div>
                  <div class="flex flex-1 flex-col justify-between">
                    <div class="divide-y divide-gray-200 px-4 sm:px-6">
                      <div class="space-y-6 pb-5 pt-6">
                        <FormInput
                            type="text"
                            label="Name"
                            name="name"
                        />
                        <FormInput
                            type="text"
                            label="Identifier"
                            name="identifier"
                        />
                        <BaseButton type="button" v-if="!isSubscribed" @click="subscribeToProject">
                          Inform me about changes
                        </BaseButton>
                        <BaseButton type="button" v-else @click="unsubscribeToProject"> Unsubscribe</BaseButton>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>
