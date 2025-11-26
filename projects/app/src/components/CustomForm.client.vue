<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { FieldArray, useForm } from 'vee-validate';
import { array, boolean, object, string } from 'yup';

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
const tagOptions = ref<{ label: string; value: string }[]>([]);
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

const deploymentTypeOptions = [
  { label: 'Branch', value: 'BRANCH' },
  { label: 'Tag', value: 'TAG' },
];

const tagMatchTypeOptions = [
  { label: 'Specific Tag', value: 'EXACT' },
  { label: 'Tag Pattern', value: 'PATTERN' },
];

const tagPatternTemplates = [
  {
    description: 'Matches tags ending with .dev (e.g., v1.0.0-dev.1, v2.1.0-dev.3)',
    icon: '🔧',
    label: 'Development Tags',
    value: '*-dev*',
  },
  {
    description: 'Matches tags containing -test (e.g., v1.0.0-test, v2.1.0-test.1)',
    icon: '🧪',
    label: 'Test/Staging Tags',
    value: '*-test*',
  },
  {
    description: 'Matches production version tags without suffixes (e.g., v1.0.0, v2.1.0, but not v1.0.0-dev)',
    icon: '🚀',
    label: 'Production Tags',
    value: 'v[0-9]+.[0-9]+.[0-9]+$',
  },
  {
    description: 'Matches release candidate tags (e.g., v1.0.0-rc.1, v2.0.0-rc.2)',
    icon: '🎯',
    label: 'Release Candidates',
    value: '*-rc*',
  },
  {
    description: 'Matches beta version tags (e.g., v1.0.0-beta.1, v2.0.0-beta)',
    icon: '🔄',
    label: 'Beta Releases',
    value: '*-beta*',
  },
  {
    description: 'Matches alpha version tags (e.g., v1.0.0-alpha.1, v2.0.0-alpha)',
    icon: '⚡',
    label: 'Alpha Releases',
    value: '*-alpha*',
  },
];

const formSchema = toTypedSchema(
  object({
    autoDeploy: boolean().nullable().default(true),
    branch: string().required(),
    customDockerCompose: string(),
    customDockerfile: string(),
    deploymentType: string().nullable(),
    name: string().required().max(14),
    registry: object({
      id: string().required(),
    }).required(),
    repositoryId: string().required(),
    skipCiPatterns: array().of(string()).default(['[skip ci]', '[ci skip]', '[no ci]', '[skip build]']).nullable(),
    source: object({
      id: string().required(),
    }).required(),
    tag: string().nullable(),
    tagMatchType: string().nullable(),
    tagPattern: string().nullable(),
  }),
);

const {
  controlledValues: values,
  isSubmitting,
  meta,
  setFieldValue,
  validate,
} = useForm({
  initialValues: props.container,
  validationSchema: formSchema,
});

function applyTagPatternTemplate(pattern: string) {
  setFieldValue('tagPattern', pattern);
}

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
    await loadTags(sourceId, repositoryId);
  }
}

async function loadBranches(sourceId: string, repositoryId: string) {
  const source = sources?.find((e) => e.id === sourceId);
  if (!source) {
    return;
  }

  let branches: any[] = [];
  if (source.type === SourceType.GITLAB) {
    const gitlab = useGitlab(source!);
    const { data } = await gitlab.getBranches(repositoryId);
    branches = (data.value as any[]) || [];
  } else {
    const github = useGithub(source!);
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

async function loadTags(sourceId: string, repositoryId: string) {
  const source = sources?.find((e) => e.id === sourceId);
  if (!source) {
    return;
  }

  let releases: any[] = [];
  if (source?.type === SourceType.GITLAB) {
    const gitlab = useGitlab(source!);
    const { data } = await gitlab.getReleases(repositoryId);
    releases = (data.value as any[]) || [];
  } else {
    const github = useGithub(source!);
    const { data } = await github.getBranches(repositoryId);
    releases = (data.value as any[]) || [];
  }

  tagOptions.value = (releases as any)?.map((e: any) => {
    return { label: e.tag_name, value: e.tag_name };
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
    const gitlab = useGitlab(source!);
    const { data: projects } = await gitlab.getProjects();

    gitProjects.value = (projects.value as any[]) || null;

    // e.web_url
    projectsOptions.value = (projects.value as any)?.map((e: any) => {
      return { label: e.name, value: e.id + '' };
    });
  } else {
    const github = useGithub(source!);
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
      const { addProjectWebhook } = useGitlab(source!);
      const project = gitProjects.value.find((e) => Number(e.id) === Number(data.repositoryId));
      if (project) {
        data.repositoryUrl = (project as any)?.web_url;
        const { data: webhookData } = await addProjectWebhook(data.repositoryId);
        data.webhookId = (webhookData as any).value?.id + '';
      }
    } else {
      const { addProjectWebhook } = useGithub(source!);
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
          <template #label> Deployment type </template>
          <template #help> Select the repository from your container </template>
          <template #default>
            <FormSelect
              name="deploymentType"
              class="w-full mx-auto max-w-2xl"
              placeholder="Select a deployment type"
              :options="deploymentTypeOptions"
              :loading="loadingGitlab"
              :disabled="disabled || loadingGitlab"
            />
          </template>
        </FormRow>

        <FormRow v-if="values.deploymentType === 'BRANCH'">
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

        <template v-if="values.deploymentType === 'TAG'">
          <FormRow>
            <template #label> Tag matching type </template>
            <template #help> Choose how tags should be matched for deployment </template>
            <template #default>
              <FormSelect
                name="tagMatchType"
                class="w-full mx-auto max-w-2xl"
                placeholder="Select tag matching type"
                :options="tagMatchTypeOptions"
                :disabled="disabled"
              />
            </template>
          </FormRow>

          <FormRow v-if="values.tagMatchType === 'EXACT'">
            <template #label> Tag </template>
            <template #help> Select the specific tag to be deployed </template>
            <template #default>
              <FormSelect
                name="tag"
                class="w-full mx-auto max-w-2xl"
                placeholder="Select a tag"
                :options="tagOptions"
                :loading="loadingGitlab"
                :disabled="disabled || loadingGitlab"
              />
            </template>
          </FormRow>

          <FormRow v-if="values.tagMatchType === 'PATTERN'">
            <template #label> Tag pattern </template>
            <template #help>
              Enter a pattern to match tags automatically or choose from common templates below.
            </template>
            <template #default>
              <div class="w-full mx-auto max-w-2xl space-y-4">
                <FormInput name="tagPattern" type="text" placeholder="e.g., *.dev or v*-dev.*" :disabled="disabled" />

                <div class="space-y-2">
                  <label class="text-sm font-medium text-gray-300">Quick templates:</label>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <button
                      v-for="template in tagPatternTemplates"
                      :key="template.value"
                      type="button"
                      class="flex items-start p-3 text-left border border-white/10 rounded-lg hover:border-white/20 hover:bg-white/5 transition-colors group"
                      :disabled="disabled"
                      @click="applyTagPatternTemplate(template.value)"
                    >
                      <span class="text-lg mr-3 group-hover:scale-110 transition-transform">{{ template.icon }}</span>
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-sm text-white">{{ template.label }}</div>
                        <div class="text-xs text-gray-400 mt-1">{{ template.value }}</div>
                        <div class="text-xs text-gray-500 mt-1 leading-tight">{{ template.description }}</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </FormRow>
        </template>

        <FormRow>
          <template #label> Enable auto deploy </template>
          <template #default>
            <FormToggle name="autoDeploy" class="mx-auto" :disabled="disabled" />
          </template>
        </FormRow>

        <FormRow>
          <template #label> Skip CI Patterns </template>
          <template #help>
            Configure patterns that will skip CI/deployment when found in commits, tags, or release descriptions
          </template>
          <template #default>
            <FieldArray v-slot="{ fields, push, remove }" name="skipCiPatterns">
              <div class="w-full mx-auto max-w-2xl space-y-3">
                <div v-for="(field, idx) in fields" :key="field.key" class="flex items-center gap-2">
                  <FormInput
                    :name="`skipCiPatterns[${idx}]`"
                    type="text"
                    placeholder="e.g., [skip ci] or [no deploy]"
                    class="flex-1"
                    :disabled="disabled"
                  />
                  <button :disabled="disabled" class="flex items-center text-danger" @click.prevent="remove(idx)">
                    <span class="i-bi-trash text-sm"></span>
                  </button>
                </div>

                <div class="flex justify-between items-center pt-2">
                  <BaseButton variant="outline" size="sm" :disabled="disabled" @click.prevent="push('')">
                    Add Pattern
                  </BaseButton>

                  <BaseButton
                    variant="outline"
                    size="sm"
                    :disabled="disabled"
                    @click.prevent="
                      () => {
                        setFieldValue('skipCiPatterns', ['[skip ci]', '[ci skip]', '[no ci]', '[skip build]']);
                      }
                    "
                  >
                    Reset to Defaults
                  </BaseButton>
                </div>

                <div class="text-xs text-gray-400 bg-gray-800/30 p-3 rounded border border-white/5">
                  <div class="font-medium mb-1">Common patterns:</div>
                  <div class="space-y-1">
                    <div><code>[skip ci]</code> - Standard skip pattern</div>
                    <div><code>[no deploy]</code> - Custom skip for deployments</div>
                    <div><code>semantic-release-skip</code> - For semantic-release tools</div>
                  </div>
                </div>
              </div>
            </FieldArray>
          </template>
        </FormRow>
      </template>
    </div>
  </form>
</template>
