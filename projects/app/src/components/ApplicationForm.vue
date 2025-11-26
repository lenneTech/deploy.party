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

const emit = defineEmits(['refresh']);

const lastSaved = ref<Date | null>(null);
const loadingGitlab = ref(false);
const basicAuth = ref(false);
const containerType = ref();
const projectsOptions = ref([]);
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

const typeOptions = [
  { label: 'Node', value: 'NODE' },
  { label: 'Static', value: 'STATIC' },
  { label: 'Custom', value: 'CUSTOM' },
];

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
let selectedSourceId: string | undefined = '';
let selectedRepositoryId: string | undefined = '';

const basicAuthSchema = object({
  basicAuth: object({
    pw: string().required(),
    username: string().required(),
  }).nullable(),
});

const baseFormSchema = object({
  autoDeploy: boolean().nullable().default(true),
  baseDir: string().default('.').nullable(),
  branch: string().nullable(),
  buildCmd: string().nullable().default('npm run build').nullable(),
  buildImage: string().nullable(),
  compress: boolean().nullable().default(true),
  customDockerfile: string().nullable(),
  customImageCommands: string().nullable(),
  deploymentType: string().nullable(),
  env: string().nullable(),
  exposedPort: string().nullable(),
  healthCheckCmd: string().nullable(),
  installCmd: string().default('npm install').nullable(),
  isCustomRule: boolean().nullable().default(false),
  name: string().nullable().max(14),
  port: string().nullable(),
  registry: object({
    id: string(),
  }).nullable(),
  repositoryId: string().nullable(),
  skipCiPatterns: array().of(string()).default(['[skip ci]', '[ci skip]', '[no ci]', '[skip build]']).nullable(),
  source: object({
    id: string(),
  }).nullable(),
  ssl: boolean().nullable(),
  startCmd: string().default('npm run start').nullable(),
  tag: string().nullable(),
  tagMatchType: string().nullable(),
  tagPattern: string().nullable(),
  type: string().default('NODE'),
  url: string().nullable(),
  volumes: array()
    .of(
      object({
        destination: string().nullable(),
        source: string().nullable(),
        type: string(),
      }),
    )
    .default([])
    .nullable(),
  www: boolean().nullable().default(true),
});

const formSchema = computed(() => {
  return toTypedSchema(basicAuth.value ? baseFormSchema.concat(basicAuthSchema) : baseFormSchema);
});

const {
  controlledValues: values,
  meta,
  resetForm,
  setFieldTouched,
  setFieldValue,
  validate,
} = useForm({
  initialValues: props.container as any,
  validationSchema: formSchema,
});

function applyTagPatternTemplate(pattern: string) {
  setFieldValue('tagPattern', pattern);
}

watch(
  () => props.tab,
  () => {
    resetForm({ touched: {}, values: props.container });
  },
);

watchDebounced(
  () => values.value,
  async () => {
    await submit();
  },
  { debounce: 1000, immediate: false },
);

watch(
  () => basicAuth.value,
  async () => {
    setTimeout(async () => {
      if (!basicAuth.value) {
        setFieldTouched('name', true);
        await submit();
      }
    }, 800);
  },
);

watch(
  () => values.value,
  () => {
    if (values.value?.type) {
      containerType.value = values.value.type;
    }

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

  if (props.container?.basicAuth?.username || props.container?.basicAuth?.pw) {
    basicAuth.value = true;
  }
});

async function onSourceChanged(sourceId: string, repositoryId?: string, loading = true) {
  loadingGitlab.value = loading;
  await loadProjects(sourceId);
  if (repositoryId) {
    await loadBranches(sourceId, repositoryId);
    await loadTags(sourceId, repositoryId);
  }
}

async function loadBranches(sourceId: string, repositoryId: string) {
  const source = sources.find((e) => e.id === sourceId);
  if (!source) {
    return;
  }

  let branches: any[] = [];
  if (source?.type === SourceType.GITLAB) {
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

  if (source?.type === SourceType.GITLAB) {
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

  if (!basicAuth.value) {
    data.basicAuth = { pw: null, username: null };
  }

  if (!data.registry || (typeof data.registry === 'object' && Object.keys(data.registry).length === 0)) {
    delete data.registry;
  }

  if (!data.source || (typeof data.source === 'object' && Object.keys(data.source).length === 0)) {
    delete data.source;
  }

  console.debug('Update container with data', data);
  const { error } = await useUpdateContainerMutation(
    {
      id: props.containerId as string,
      input: data as ContainerInput,
    },
    ['id'],
  );
  lastSaved.value = new Date();
  emit('refresh');
  if (error) {
    useNotification().notify({ text: error?.message, title: 'Error', type: 'error' });
  }
}
</script>

<template>
  <form novalidate class="flex flex-wrap flex-col w-full" @submit.prevent="null">
    <div class="w-full flex justify-end text-xs text-white/10">
      <span v-if="lastSaved">Changes saved {{ $dayjs(lastSaved).fromNow() }}</span>
      <span v-else-if="meta.touched">You have unsaved changes</span>
      <span v-else>No changes</span>
    </div>
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
          <template #label> Type </template>
          <template #help> Select a type for your application. </template>
          <template #default>
            <FormSelect name="type" class="w-full mx-auto max-w-2xl" :options="typeOptions" :disabled="disabled" />
          </template>
        </FormRow>

        <FormRow v-show="containerType === 'CUSTOM'">
          <template #label> Dockerfile </template>
          <template #help> Enter the path to your Dockerfile </template>
          <template #default>
            <FormCode
              name="customDockerfile"
              class="w-full mx-auto max-w-2xl"
              placeholder="Enter custom Dockerfile"
              :disabled="disabled"
            />
          </template>
        </FormRow>

        <div v-show="containerType !== 'CUSTOM'">
          <FormRow v-show="containerType !== 'STATIC'">
            <template #label> Base image </template>
            <template #help> Select a base image for your application. Example node:20</template>
            <template #default>
              <FormInput name="buildImage" class="w-full mx-auto max-w-2xl" type="text" :disabled="disabled" />
            </template>
          </FormRow>

          <FormRow>
            <template #label> Custom image commands </template>
            <template #help>
              Enter custom commands for your image. For example RUN apt-get update && apt-get install -y curl
            </template>
            <template #default>
              <FormCode name="customImageCommands" class="w-full mx-auto max-w-2xl" :disabled="disabled" />
            </template>
          </FormRow>

          <FormRow>
            <template #label> Base directory </template>
            <template #help>
              Enter the base directory. This is quite practical for monorepro. Example: ./projects/app</template
            >
            <template #default>
              <FormInput name="baseDir" class="w-full mx-auto max-w-2xl" type="text" :disabled="disabled" />
            </template>
          </FormRow>

          <FormRow>
            <template #label> Install command </template>
            <template #help>
              Enter the install command of your project. For example npm install or npm ci. Exmaple: npm
              install</template
            >
            <template #default>
              <FormInput name="installCmd" class="w-full mx-auto max-w-2xl" type="text" :disabled="disabled" />
            </template>
          </FormRow>

          <FormRow>
            <template #label> Build command </template>
            <template #help> Enter the build command. For example npm run build. </template>
            <template #default>
              <FormInput name="buildCmd" class="w-full mx-auto max-w-2xl" type="text" :disabled="disabled" />
            </template>
          </FormRow>

          <FormRow v-show="containerType !== 'STATIC'">
            <template #label> Start command </template>
            <template #help> Enter the start command. For example npm run start. </template>
            <template #default>
              <FormInput name="startCmd" class="w-full mx-auto max-w-2xl" type="text" :disabled="disabled" />
            </template>
          </FormRow>

          <FormRow>
            <template #label> Healthcheck command </template>
            <template #help>
              Enter the command for the healthcheck. For example curl --fail http://localhost:4000/
            </template>
            <template #default>
              <FormInput name="healthCheckCmd" class="w-full mx-auto max-w-2xl" type="text" :disabled="disabled" />
            </template>
          </FormRow>
        </div>
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
                <div v-for="(field, idx) in fields" :key="field.key" class="flex items-end gap-2">
                  <FormInput
                    :name="`skipCiPatterns[${idx}]`"
                    type="text"
                    placeholder="e.g., [skip ci] or [no deploy]"
                    class="flex-1"
                    :disabled="disabled"
                  />

                  <button type="button" :disabled="disabled" class="pb-3 px-3" @click.prevent="remove(idx)">
                    <span class="i-bi-trash text-md self-end text-red-500"></span>
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
                        // Reset to defaults
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

      <template v-else-if="tab === 'webserver'">
        <FormRow>
          <template #label> Url </template>
          <template #help>
            Enter a url for your container (choose localhost for local setup and exposed port)
          </template>
          <template #default>
            <div class="w-full">
              <FormInput name="url" class="w-full mx-auto max-w-2xl" type="text" :disabled="disabled" />
              <div class="mx-auto max-w-2xl">
                <FormToggle name="isCustomRule" label="Enable custom rule" class="mx-auto" :disabled="disabled" />
              </div>
            </div>
          </template>
        </FormRow>

        <!-- Traefik fields -->
        <FormRow v-show="containerType !== 'STATIC'">
          <template #label> Port </template>
          <template #help> Please enter the port of your application. For example 4000 for Angular SSR. </template>
          <template #default>
            <FormInput name="port" class="w-full mx-auto max-w-2xl" type="text" :disabled="disabled" />
          </template>
        </FormRow>

        <FormRow>
          <template #label> Exposed port </template>
          <template #help> Enter the port to be exposed, if you want (for local handling) </template>
          <template #default>
            <FormInput name="exposedPort" class="w-full mx-auto max-w-2xl" type="text" :disabled="disabled" />
          </template>
        </FormRow>

        <FormRow>
          <template #label> Enable SSL </template>
          <template #default>
            <FormToggle name="ssl" class="mx-auto" :disabled="disabled" />
          </template>
        </FormRow>

        <FormRow>
          <template #label> Enable Compress </template>
          <template #default>
            <FormToggle name="compress" class="mx-auto" :disabled="disabled" />
          </template>
        </FormRow>

        <FormRow>
          <template #label> Enable WWW redirect </template>
          <template #default>
            <FormToggle name="www" class="mx-auto" :disabled="disabled" />
          </template>
        </FormRow>

        <FormRow>
          <template #label> Basic Auth </template>
          <template #help> Enable basic auth for your container </template>
          <template #default>
            <BaseToggle v-model:active="basicAuth" class="mx-auto" :disabled="disabled" />
          </template>
        </FormRow>

        <template v-if="basicAuth">
          <FormRow>
            <template #label> Username </template>
            <template #help> Enter a username for your container </template>
            <template #default>
              <FormInput name="basicAuth.username" class="w-full mx-auto max-w-2xl" type="text" :disabled="disabled" />
            </template>
          </FormRow>
          <FormRow>
            <template #label> Password </template>
            <template #help> Enter a password for your container </template>
            <template #default>
              <FormInput name="basicAuth.pw" class="w-full mx-auto max-w-2xl" type="text" :disabled="disabled" />
            </template>
          </FormRow>
        </template>
      </template>

      <template v-else-if="tab === 'env'">
        <div class="w-full">
          <FormRow>
            <template #label> .env file </template>
            <template #help> Content of .env files </template>
            <template #default>
              <FormCode name="env" class="w-full mx-auto max-w-3xl" :disabled="disabled" />
            </template>
          </FormRow>
        </div>
      </template>

      <template v-else-if="tab === 'storages'">
        <FieldArray v-slot="{ fields, push, remove }" name="volumes">
          <div v-for="(field, idx) in fields" :key="field.key" class="w-full mt-1">
            <div class="flex items-center justify-between my-2">
              <label class="font-medium leading-6 text-foreground">Volume #{{ idx + 1 }}</label>
              <BaseButton
                variant="danger"
                class="flex items-center justify-center"
                :disabled="disabled"
                @click.prevent="remove(idx)"
              >
                <span class="i-bi-trash text-base"></span>
              </BaseButton>
            </div>
            <FormRow>
              <template #label> Source Directory </template>
              <template #help> Directory on the host system. </template>
              <template #default>
                <FormInput
                  :name="`volumes[${idx}].source`"
                  class="w-full mx-auto max-w-2xl"
                  type="text"
                  :disabled="disabled"
                />
              </template>
            </FormRow>
            <FormRow>
              <template #label> Destination Directory </template>
              <template #help> Directory inside the container. </template>
              <template #default>
                <FormInput
                  :name="`volumes[${idx}].destination`"
                  class="w-full mx-auto max-w-2xl"
                  type="text"
                  :disabled="disabled"
              /></template>
            </FormRow>

            <FormRow>
              <template #label> Type </template>
              <template #help> Type of volume. </template>
              <template #default>
                <FormSelect
                  :name="`volumes[${idx}].type`"
                  class="w-full mx-auto max-w-2xl"
                  :disabled="disabled"
                  :options="[{ label: 'Directory Mount', value: 'DIRECTORY_MOUNT' }]"
              /></template>
            </FormRow>
          </div>
          <div class="flex justify-end py-3">
            <BaseButton
              class="!mt-2"
              :disabled="disabled"
              @click.prevent="push({ source: '', destination: '', type: 'DIRECTORY_MOUNT' })"
            >
              Add Volume
            </BaseButton>
          </div>
        </FieldArray>
      </template>
    </div>
  </form>
</template>
