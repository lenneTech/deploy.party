<script setup lang="ts">
import { DeployRoleEnum } from '~/vars/roles';

const { currentUserState: user } = useAuthState();
</script>

<template>
  <aside
    id="default-sidebar"
    class="pt-[64px] z-40 w-64 h-screen flex-none hidden lg:inline-block relative"
    aria-label="Sidenav"
  >
    <div class="sticky top-0 overflow-y-auto h-full py-5 px-3 border-r border-border bg-background flex flex-col">
      <ul class="space-y-1 flex-grow">
        <MenuItem to="/">
          <Icon name="bi:collection" size="20" />
          <span class="ml-3">Projects</span>
        </MenuItem>
        <MenuItem v-if="user?.roles?.includes(DeployRoleEnum.ADMIN)" to="/sources">
          <Icon name="ic:round-apps" size="20" />
          <span class="ml-3">Sources</span>
        </MenuItem>
        <MenuItem v-if="user?.roles?.includes(DeployRoleEnum.ADMIN)" to="/registries">
          <Icon name="ic:baseline-cloud-queue" size="20" />
          <span class="ml-3">Registries</span>
        </MenuItem>
        <MenuItem v-if="user?.roles?.includes(DeployRoleEnum.ADMIN)" to="/team">
          <Icon name="ic:baseline-groups" size="20" />
          <span class="ml-3">Team</span>
        </MenuItem>
      </ul>
      <ul class="mt-auto">
        <MenuItem v-if="user?.roles?.includes(DeployRoleEnum.ADMIN)" to="/admin">
          <Icon name="ic:outline-admin-panel-settings" size="20" />
          <span class="ml-3">Administration</span>
        </MenuItem>
      </ul>
    </div>
  </aside>
</template>
