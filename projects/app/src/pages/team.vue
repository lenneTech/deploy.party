<script setup lang="ts">
import type { User } from '~/base/default';

import { useAsyncGetMembersOfTeamQuery, useGetMembersOfTeamQuery } from '~/base';
import ModalInvite from '~/components/Modals/ModalInvite.vue';

const { instanceName } = useRuntimeConfig().public;
useSeoMeta({
  title: `Team | ${instanceName}`,
});

definePageMeta({
  breadcrumbs: 'Team',
});

const { data, refresh } = await useAsyncGetMembersOfTeamQuery(null);
const members = computed(() => data?.value || []);
const { open: openMenu } = useContextMenu();
const { open: openModal } = useModal();

function timeAgo(date: string) {
  return useTimeAgo(new Date(date)).value;
}

function showContextMenu(member: User) {
  openMenu({
    items: [
      {
        click: () => {
          openModal({
            component: ModalInvite,
            data: {
              member,
              refreshFn: async () => {
                await refresh();
              },
            },
          });
        },
        label: 'Edit',
      },
      {
        click: async () => {
          const { data } = await useDeleteUserMutation({ id: member.id! }, ['id']);
          if (data) {
            useNotification().notify({
              text: 'Successfully deleted user from team.',
              title: 'Success',
              type: 'success',
            });
          } else {
            useNotification().notify({ text: 'User could not be deleted', title: 'Error', type: 'error' });
          }
          await refresh();
        },
        label: 'Delete',
      },
    ],
  });
}
</script>

<template>
  <div class="pt-[63px] w-full">
    <List>
      <ListItem v-for="member of members" :key="member.id" @contextmenu.prevent="showContextMenu(member)">
        <template #name1> {{ member.firstName }} {{ member.lastName }} </template>
        <template #subtitle1>
          {{ member.email }}
        </template>
        <template #subtitle2> joined {{ timeAgo(member.createdAt) }} </template>
      </ListItem>
    </List>
  </div>
</template>
