<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { object, string } from 'yup';

import type { Container, ContainerInput } from '~/base/default';

import { useFindRegistrysQuery, useFindSourcesQuery } from '~/base';
import { useGithub } from '~/composables/use-github';
import { useGitlab } from '~/composables/use-gitlab';

const props = defineProps<{
  container?: Container | undefined;
  containerId?: string;
  disabled: boolean;
  projectId?: string;
  tab?: string;
}>();

const projectsOptions = ref([]);
const loadingGitlab = ref(false);
const gitProjects = ref<{ id: number }[]>([]);
const branchOptions = ref<{ label: string; value: string }[]>([]);
const { data: sources } = await useFindSourcesQuery({}, ['id', 'name', 'token', 'url', 'type']);
const sourceOptions = sources?.map((e) => {
  return { label: e.name, value: e.id };
});
const { data: registries } = await useFindRegistrysQuery({}, ['id', 'name']);
const registryOptions = registries?.map((e) => {
  return { label: e.name, value: e.id };
});

let selectedSourceId: string | undefined = '';
let selectedRepositoryId: string | undefined = '';

const formSchema = toTypedSchema(
  object({
    branch: string().required(),
    customDockerCompose: string(),
    customDockerfile: string(),
    name: string().required().max(14),
    registry: object({
      id: string().required(),
    }).required(),
    repositoryId: string().required(),
    source: object({
      id: string().required(),
    }).required(),
  }),
);

const {
  controlledValues: values,
  isSubmitting,
  meta,
  validate,
} = useForm({
  initialValues: props.container,
  validationSchema: formSchema,
});

watchDebounced(
  () => values.value,
  async () => {
    await submit();
  },
  { debounce: 800 },
);

watch(
  () => values.value,
  () => {
    if (
      values.value?.source?.id &&
      (values.value.source.id !== selectedSourceId || selectedRepositoryId !== values.value.repositoryId)
    ) {
      selectedSourceId = values.value.source.id;
      selectedRepositoryId = values.value.repositoryId;
      onSourceChanged(values.value.source.id, values.value.repositoryId);
    }
  },
);

onMounted(() => {
  if (props.container?.source?.id) {
    onSourceChanged(props.container.source.id, props.container.repositoryId);
  }
});

async function onSourceChanged(sourceId: string, repositoryId?: string) {
  loadingGitlab.value = true;
  await loadProjects(sourceId);
  if (repositoryId) {
    await loadBranches(sourceId, repositoryId);
  }
}

async function loadBranches(sourceId: string, repositoryId: string) {
  const source = sources?.find((e) => e.id === sourceId);
  if (!source) {
    return;
  }

  let branches: any[] = [];
  if (source.type === SourceType.GITLAB) {
    const gitlab = useGitlab(source!, false);
    const { data } = await gitlab.getBranches(repositoryId);
    branches = (data.value as any[]) || [];
  } else {
    const github = useGithub(source!, false);
    const { data } = await github.getBranches(repositoryId);
    branches = (data.value as any[]) || [];
  }

  branchOptions.value = (branches as any)?.map((e: any) => {
    return { label: e.name, value: e.name };
  });

  if (loadingGitlab.value) {
    loadingGitlab.value = false;
  }
}

async function loadProjects(sourceId: string) {
  if (!sourceId) {
    return;
  }

  const source = sources?.find((e) => e.id === sourceId);

  if (!source) {
    return;
  }

  if (source.type === SourceType.GITLAB) {
    const gitlab = useGitlab(source!, false);
    const { data: projects } = await gitlab.getProjects();

    gitProjects.value = (projects.value as any[]) || null;

    // e.web_url
    projectsOptions.value = (projects.value as any)?.map((e: any) => {
      return { label: e.name, value: e.id + '' };
    });
  } else {
    const github = useGithub(source!, false);
    const { data: projects } = await github.getRepos();

    gitProjects.value = (projects.value as any[]) || null;

    projectsOptions.value = (projects.value as any)?.map((e: any) => {
      return { label: e.full_name, value: e.full_name };
    });
  }

  if (loadingGitlab.value) {
    loadingGitlab.value = false;
  }
}

async function submit() {
  await validate();

  if (!values.value || !meta.value.touched || !meta.value.dirty) {
    return;
  }

  const data: any = { ...values.value };

  if (data && data.repositoryId) {
    const source = sources?.find((e) => e.id === data.source.id);
    if (source?.type === SourceType.GITLAB) {
      const { addProjectWebhook } = useGitlab(source!, false);
      const project = gitProjects.value.find((e) => Number(e.id) === Number(data.repositoryId));
      if (project) {
        data.repositoryUrl = (project as any)?.web_url;
        const { data: webhookData } = await addProjectWebhook(data.repositoryId);
        data.webhookId = (webhookData as any).value?.id + '';
      }
    } else {
      const { addProjectWebhook } = useGithub(source!, false);
      const project = gitProjects.value.find((e: any) => e.full_name === data.repositoryId);
      if (project) {
        data.repositoryUrl = (project as any)?.html_url;
        const { data: webhookData } = await addProjectWebhook(data.repositoryId);
        data.webhookId = (webhookData as any).value?.id + '';
      }
    }
  }

  if (data.registry?.id) {
    data.registry = data.registry.id;
  }

  if (data.source?.id) {
    data.source = data.source.id;
  }

  const { data: result, error } = await useUpdateContainerMutation(
    {
      id: props.containerId as string,
      input: data as ContainerInput,
    },
    ['id'],
  );
  if (error) {
    useNotification().notify({ text: error?.message, title: 'Error', type: 'error' });
  }
  if (result) {
    useNotification().notify({ text: 'Successfully updated the container.', title: 'Well done', type: 'success' });
  }
}
</script>

<template>
  <form novalidate class="flex flex-wrap flex-col w-full" @submit.prevent="null">
    <div class="w-full space-y-8 border-b border-white/10 pb-12 sm:space-y-0 sm:divide-y sm:divide-white/10 sm:pb-0">
      <template v-if="!tab">
        <FormRow>
          <template #label> Name </template>
          <template #help> Enter a name for your container </template>
          <template #default>
            <FormInput name="name" class="w-full mx-auto max-w-2xl" type="text" :disabled="disabled" />
          </template>
        </FormRow>

        <FormRow>
          <template #label> Registry </template>
          <template #help> Please choose a registry where the docker image will be pushed. </template>
          <template #default>
            <FormSelect
              name="registry.id"
              class="w-full mx-auto max-w-2xl"
              placeholder="Select a registry"
              :options="registryOptions"
              :disabled="disabled"
            />
          </template>
        </FormRow>

        <FormRow>
          <template #label> Dockerfile </template>
          <template #help> Enter your Dockerfile </template>
          <template #default>
            <FormCode
              name="customDockerfile"
              class="w-full mx-auto max-w-2xl"
              placeholder="Enter custom Dockerfile"
              :disabled="disabled"
            />
          </template>
        </FormRow>

        <FormRow>
          <template #label> Docker Compose </template>
          <template #help> Enter your Docker Compose file </template>
          <template #default>
            <FormCode
              name="customDockerCompose"
              class="w-full mx-auto max-w-2xl"
              placeholder="Enter custom DockerCompose"
              :disabled="disabled"
            />
          </template>
        </FormRow>
      </template>

      <template v-else-if="tab === 'source'">
        <FormRow>
          <template #label> Source </template>
          <template #help> Select the source for your container </template>
          <template #default>
            <FormSelect
              name="source.id"
              class="w-full mx-auto max-w-2xl"
              placeholder="Select a Source"
              :options="sourceOptions"
              :disabled="disabled"
            />
          </template>
        </FormRow>

        <FormRow>
          <template #label> Repository </template>
          <template #help> Select the repository from your container </template>
          <template #default>
            <FormSelect
              name="repositoryId"
              class="w-full mx-auto max-w-2xl"
              placeholder="Select a Repository"
              :options="projectsOptions"
              :loading="loadingGitlab"
              :disabled="disabled || loadingGitlab"
            />
          </template>
        </FormRow>

        <FormRow>
          <template #label> Branch </template>
          <template #help> Select the branch to be deployed </template>
          <template #default>
            <FormSelect
              name="branch"
              class="w-full mx-auto max-w-2xl"
              placeholder="Select a branch"
              :options="branchOptions"
              :loading="loadingGitlab"
              :disabled="disabled || loadingGitlab"
            />
          </template>
        </FormRow>
      </template>
    </div>
  </form>
</template>
