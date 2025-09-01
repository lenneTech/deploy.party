<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import { boolean, object, string } from 'yup';

import type { AllContainerTypes, Backup, BackupCreateInput, BackupInput, Container } from '~/base/default';

import {
  useAsyncGetBackupByDatabaseQuery,
  useAsyncGetContainerQuery,
  useCreateBackupMutation,
  useRestoreBackupMutation,
  useUpdateBackupMutation,
} from '~/base';
import { BackupType, ContainerKind } from '~/base/default';
import FormRow from '~/components/FormRow.vue';
import ModalBackupLog from '~/components/Modals/ModalBackupLog.vue';
import ModalRestoreLog from '~/components/Modals/ModalRestoreLog.vue';
import { getCronExpressionOptions } from '~/vars/cron-expression.enum';

const { instanceName } = useRuntimeConfig().public;
useSeoMeta({
  title: `Backup | ${instanceName}`,
});

definePageMeta({
  breadcrumbs: 'Backup',
});

const route = useRoute();
const { notify } = useNotification();
const { data, refresh } = await useAsyncGetBackupByDatabaseQuery(
  {
    containerId: route.params.containerId as string,
  },
  null,
);
const { data: containerData } = await useAsyncGetContainerQuery({ id: route.params.containerId as string }, [
  'id',
  'status',
  'kind',
]);
const backup = computed<Backup>(() => data.value);
const container = computed<Container>(() => containerData.value);
const selectedBackup = ref(undefined);
const inputFile = ref<HTMLElement>();
const backupOptions = ref<{ label: string; value: string }[]>([]);
const loading = ref(false);

// Determine the appropriate backup type based on container type
const defaultBackupType = computed(() => {
  if (!container.value) {
    return BackupType.VOLUME;
  }

  // For service containers like Directus, default to SERVICE backup
  if (container.value.kind === ContainerKind.SERVICE) {
    return BackupType.SERVICE;
  }

  // For database containers, default to DATABASE backup
  if (container.value.kind === ContainerKind.DATABASE) {
    return BackupType.DATABASE;
  }

  // For application containers, default to VOLUME backup
  return BackupType.VOLUME;
});

// Available backup type options based on container type
const backupTypeOptions = computed(() => {
  if (!container.value) {
    return [];
  }

  const options = [];

  if (container.value.kind === ContainerKind.SERVICE) {
    // Services can use SERVICE backup (multi-container) or VOLUME backup
    options.push({ label: 'Service Backup (Multi-Container)', value: BackupType.SERVICE });
    options.push({ label: 'Volume Backup', value: BackupType.VOLUME });
  } else if (container.value.kind === ContainerKind.DATABASE) {
    // Databases can use DATABASE or VOLUME backup
    options.push({ label: 'Database Backup', value: BackupType.DATABASE });
    options.push({ label: 'Volume Backup', value: BackupType.VOLUME });
  } else {
    // Applications only support VOLUME backup
    options.push({ label: 'Volume Backup', value: BackupType.VOLUME });
  }

  return options;
});

// Show type selection based on container type
const showTypeSelection = computed(() => {
  return (
    container.value &&
    (container.value.kind === ContainerKind.SERVICE || container.value.kind === ContainerKind.DATABASE)
  );
});

const formSchema = toTypedSchema(
  object({
    active: boolean(),
    bucket: string()
      .nullable()
      .when('active', {
        is: true,
        then: (schema) => schema.required(),
      }),
    cronExpression: string()
      .nullable()
      .when('active', {
        is: true,
        then: (schema) => schema.required(),
      }),
    host: string()
      .nullable()
      .when('active', {
        is: true,
        then: (schema) => schema.required(),
      }),
    key: string()
      .nullable()
      .when('active', {
        is: true,
        then: (schema) => schema.required(),
      }),
    path: string().nullable(),
    region: string()
      .nullable()
      .when('active', {
        is: true,
        then: (schema) => schema.required(),
      }),
    secret: string()
      .nullable()
      .when('active', {
        is: true,
        then: (schema) => schema.required(),
      }),
    type: string().nullable(),
  }),
);

const {
  controlledValues: values,
  isSubmitting,
  meta,
  resetForm,
  validate,
} = useForm({
  initialValues: {
    ...backup.value,
    type: backup.value?.type || defaultBackupType.value,
  },
  validationSchema: formSchema,
});

// Show path field based on backup type (needs to be after form definition)
const showPathField = computed(() => {
  const currentType = values.value?.type || defaultBackupType.value;
  return currentType === BackupType.VOLUME;
});

watchDebounced(
  () => values.value,
  async () => {
    await submit();
  },
  { debounce: 800 },
);

watch(
  () => backup.value,
  () => {
    resetForm({
      values: {
        ...backup.value,
        type: backup.value?.type || defaultBackupType.value,
      },
    });
  },
);

watch(
  () => backup.value?.lastBackup,
  async () => {
    if (backup.value?.lastBackup) {
      const { data } = await useListBackupsQuery({ containerId: route.params.containerId as string }, null);
      if (data) {
        backupOptions.value = data.map((backup) => {
          return {
            label: backup.label,
            value: backup.key,
          };
        });
      }
    }
  },
  { immediate: true },
);

async function submit() {
  await validate();

  if (!values.value || isSubmitting.value || !meta.value.touched || !meta.value.valid) {
    return;
  }

  isSubmitting.value = true;

  if (backup.value?.id) {
    const { data, error } = await useUpdateBackupMutation(
      {
        id: backup.value.id,
        input: values.value as BackupInput,
      },
      null,
    );
    if (error) {
      useNotification().notify({ text: error?.message, title: 'Error', type: 'error' });
    }

    if (data) {
      notify({
        title: 'Backup updated',
        type: 'success',
      });
    }
  } else {
    const { data, error } = await useCreateBackupMutation(
      {
        input: {
          container: route.params.containerId as string,
          ...values.value,
        } as BackupCreateInput,
      },
      null,
    );
    if (error) {
      useNotification().notify({ text: error?.message, title: 'Error', type: 'error' });
    }

    if (data) {
      notify({
        title: 'Backup created',
        type: 'success',
      });
    }
  }

  await refresh();
  isSubmitting.value = false;
}

function timeAgo(date: string) {
  return useTimeAgo(new Date(date)).value;
}

function handleRestore() {
  const currentType = backup.value?.type || defaultBackupType.value;

  if (currentType === BackupType.DATABASE || currentType === BackupType.SERVICE) {
    restore();
  } else {
    restoreVolume();
  }
}

async function restore() {
  if (!selectedBackup.value || !route.params.containerId) {
    return;
  }

  const { data, error } = await useRestoreBackupMutation({
    containerId: route.params.containerId as string,
    s3Key: selectedBackup.value,
  });
  if (error) {
    useNotification().notify({ text: error?.message, title: 'Error', type: 'error' });
  }

  if (data) {
    notify({
      title: 'Backup restore started.',
      type: 'success',
    });
    useModal().open({ component: ModalRestoreLog });
  }
}

async function restoreVolume() {
  if (!selectedBackup.value || !route.params.containerId) {
    return;
  }

  const { data, error } = await useRestoreBackupVolumeMutation({
    containerId: route.params.containerId as string,
    s3Key: selectedBackup.value,
  });
  if (error) {
    useNotification().notify({ text: error?.message, title: 'Error', type: 'error' });
  }

  if (data) {
    notify({
      title: 'Backup restore started.',
      type: 'success',
    });
    useModal().open({ component: ModalRestoreLog });
  }
}

function showBackupLogs() {
  useModal().open({ component: ModalBackupLog });
}

async function downloadBackup() {
  loading.value = true;
  const result = await useAuthFetch(`/backup/download/${route.params.containerId}`);

  const link = document.createElement('a');
  link.href = URL.createObjectURL(result as Blob);
  link.download = 'dump.tar.gz';
  link.click();
  URL.revokeObjectURL(link.href);
  loading.value = false;
}

async function uploadBackup(e: any) {
  loading.value = true;
  const data = new FormData();
  data.append('file', e.target.files![0]);
  const result = await useAuthFetch<{ id: string }>(`/backup/upload/${route.params.containerId}`, {
    body: data,
    method: 'POST',
  });
  loading.value = false;
}
</script>

<template>
  <div class="w-full dark:text-white">
    <div
      v-if="container?.kind === ContainerKind.SERVICE"
      class="w-full m-2 p-2 border border-blue-500 text-white rounded-lg flex items-center gap-3 justify-start"
    >
      <i class="i-bi-info-circle text-blue-500 text-xl"></i>
      <div class="text-blue-500 text-sm">
        <p class="font-semibold">Service Backup Info:</p>
        <p>• <strong>Service Backup:</strong> Backs up all containers and data (databases, uploads, etc.)</p>
        <p>• <strong>Volume Backup:</strong> Backs up only the specified path from the main container</p>
      </div>
    </div>
    <div
      class="border-b border-white/10 pb-4 pt-4 text-sm text-light text-secondary-100/50 flex items-end justify-between"
    >
      <span v-if="backup?.lastBackup">Last backup at {{ timeAgo(backup?.lastBackup) }}</span>
      <div v-if="container?.status === ContainerStatus.DEPLOYED" class="flex items-end gap-2">
        <FormSelect
          v-if="backupOptions?.length"
          v-model="selectedBackup"
          name="selectedBackup"
          :options="backupOptions"
          placeholder="Select backup"
        />
        <BaseButton
          v-if="backupOptions?.length"
          class="mb-2"
          variant="outline"
          :disabled="loading"
          @click="handleRestore()"
        >
          Restore
        </BaseButton>
        <BaseButton class="mb-2" variant="outline" :disabled="loading" @click="showBackupLogs()">
          <span class="i-bi-body-text"></span>
        </BaseButton>
        <div class="mb-2">
          <input ref="inputFile" hidden accept="application/gzip, .gz" type="file" @change="uploadBackup" />
          <BaseButton variant="outline" :disabled="loading" @click="inputFile?.click()">
            <span class="i-bi-upload"></span>
          </BaseButton>
        </div>
        <BaseButton class="mb-2" variant="outline" :disabled="loading" @click="downloadBackup()">
          <span class="i-bi-download"></span>
        </BaseButton>
      </div>
    </div>

    <form novalidate @submit.prevent="null">
      <div class="space-y-8 border-b border-border pb-12 sm:space-y-0 sm:divide-y sm:divide-white/10 sm:pb-0">
        <FormRow>
          <template #label> Enable </template>
          <template #help> Activate backup for this container. </template>
          <template #default>
            <div class="flex items-center w-full">
              <FormToggle name="active" class="mx-auto" />
            </div>
          </template>
        </FormRow>
        <FormRow v-if="showTypeSelection">
          <template #label> Backup Type </template>
          <template #help> Choose the backup strategy for this container. </template>
          <template #default>
            <div class="flex items-center w-full">
              <FormSelect name="type" class="w-full mx-auto max-w-2xl" :options="backupTypeOptions" />
            </div>
          </template>
        </FormRow>
        <FormRow>
          <template #label> Cron expression </template>
          <template #help> Cron expression for backup. </template>
          <template #default>
            <div class="flex items-center w-full">
              <FormSelect
                name="cronExpression"
                class="w-full mx-auto max-w-2xl"
                :options="getCronExpressionOptions()"
              />
            </div>
          </template>
        </FormRow>
        <FormRow v-if="showPathField">
          <template #label> Path </template>
          <template #help> File path to backup (only required for volume backups) </template>
          <template #default>
            <div class="flex items-center w-full">
              <FormInput name="path" class="w-full mx-auto max-w-2xl" type="text" />
            </div>
          </template>
        </FormRow>
        <FormRow>
          <template #label> S3 Url </template>
          <template #help> Backup storage url from s3. </template>
          <template #default>
            <div class="flex items-center w-full">
              <FormInput name="host" class="w-full mx-auto max-w-2xl" type="text" />
            </div>
          </template>
        </FormRow>
        <FormRow>
          <template #label> S3 Key </template>
          <template #help> Backup storage key from s3. </template>
          <template #default>
            <div class="flex items-center w-full">
              <FormInput name="key" class="w-full mx-auto max-w-2xl" type="text" />
            </div>
          </template>
        </FormRow>
        <FormRow>
          <template #label> S3 Secret </template>
          <template #help> Backup storage secret from s3. </template>
          <template #default>
            <div class="flex items-center w-full">
              <FormInput name="secret" class="w-full mx-auto max-w-2xl" type="text" />
            </div>
          </template>
        </FormRow>
        <FormRow>
          <template #label> S3 Region </template>
          <template #help> Backup storage region from s3. </template>
          <template #default>
            <div class="flex items-center w-full">
              <FormInput name="region" class="w-full mx-auto max-w-2xl" type="text" />
            </div>
          </template>
        </FormRow>
        <FormRow>
          <template #label> S3 Bucket </template>
          <template #help> Backup storage bucket from s3. </template>
          <template #default>
            <div class="flex items-center w-full">
              <FormInput name="bucket" class="w-full mx-auto max-w-2xl" type="text" />
            </div>
          </template>
        </FormRow>
      </div>
    </form>
  </div>
</template>
