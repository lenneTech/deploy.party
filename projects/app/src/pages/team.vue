<script setup lang="ts">
import type { User } from '~/base/default';

import { useGetMembersOfTeamQuery } from '~/base';
import ModalInvite from '~/components/Modals/ModalInvite.vue';

const { instanceName } = useRuntimeConfig().public;
useSeoMeta({
  title: `Team | ${instanceName}`,
});

definePageMeta({
  breadcrumbs: 'Team',
});

const { data, refresh } = await useGetMembersOfTeamQuery(null);
const members = computed(() => data?.value?.getMembersOfTeam || []);
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
          const { mutate } = await useDeleteUserMutation({ id: member.id! }, ['id']);
          const result = await mutate();
          if (result?.data?.deleteUser) {
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
