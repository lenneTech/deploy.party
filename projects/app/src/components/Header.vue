<script setup lang="ts">
import { useAuth, useAuthState } from '#imports';

import ModalApiKey from '~/components/Modals/ModalApiKey.vue';
import ModalContainer from '~/components/Modals/ModalContainer.vue';
import InviteModal from '~/components/Modals/ModalInvite.vue';
import ModalProject from '~/components/Modals/ModalProject.vue';
import ModalRegistry from '~/components/Modals/ModalRegistry.vue';
import ModalSource from '~/components/Modals/ModalSource.vue';

const props = defineProps<{
  hideButton?: boolean;
}>();
const showUserDropdown = ref<boolean>(false);
const showAddDropdown = ref<boolean>(false);
const { currentUserState } = useAuthState();
const { open } = useModal();
const { version } = useRuntimeConfig().public;

async function logout() {
  await useLogoutMutation({});
  const { clearSession } = useAuth();
  const { reset } = useTeamState();
  clearSession();
  reset();

  // passing 'to' as a string
  await navigateTo('/auth/login');
}

function add(type: 'api-key' | 'container' | 'member' | 'project' | 'registry' | 'source') {
  switch (type) {
    case 'project':
      open({ component: ModalProject, size: 'auto' });
      break;
    case 'source':
      open({ component: ModalSource, size: 'auto' });
      break;
    case 'registry':
      open({ component: ModalRegistry, size: 'auto' });
      break;
    case 'container':
      open({ component: ModalContainer, size: 'auto' });
      break;
    case 'member':
      open({ component: InviteModal, size: 'auto' });
      break;
    case 'api-key':
      open({ component: ModalApiKey, size: 'auto' });
      break;
  }
}
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-50 flex h-[calc(env(safe-area-inset-top)_+_4rem)] bg-background backdrop-blur-lg border-b border-border pt-[env(safe-area-inset-top)]"
  >
    <div class="mx-auto flex w-full items-center justify-between px-4 sm:px-6 lg:px-8">
      <div class="flex flex-1 items-center gap-x-6 md:text-sm md:font-semibold text-secondary-100">
        <NuxtLink to="/">
          <img class="hidden md:inline h-7 me-2" src="/logo.png" alt="Logo" />
        </NuxtLink>
        <div class="ms-3">
          <BaseBreadcrumb />
        </div>
      </div>
      <div class="flex flex-1 items-center justify-end gap-x-5">
        <div class="hidden lg:flex text-white/80">
          {{ version }}
        </div>
        <slot name="action"></slot>
        <div v-if="!currentUserState?.roles?.includes('viewer')" class="relative flex items-center">
          <button
            type="button"
            class="flex items-center text-gray-400 hover:text-primary-500"
            @click="showAddDropdown = !showAddDropdown"
          >
            <span class="sr-only">Add new</span>
            <span class="i-bi-plus text-3xl"></span>
          </button>

          <TransitionFade>
            <div
              v-show="showAddDropdown"
              class="absolute right-0 origin-top-right border border-border mt-5 z-10 w-56 bg-background shadow-lg rounded-md focus:outline-none"
              @mouseleave="showAddDropdown = !showAddDropdown"
            >
              <div class="py-1" role="none">
                <button
                  type="button"
                  class="w-full text-left text-secondary-100 px-4 py-2 text-sm hover:bg-hover hover:text-foreground flex justify-between items-center"
                  role="menuitem"
                  tabindex="0"
                  @click="add('project')"
                >
                  Project <Key>P</Key>
                </button>
                <button
                  type="button"
                  class="w-full text-left text-foreground px-4 py-2 text-sm hover:bg-hover hover:text-foreground flex justify-between items-center"
                  role="menuitem"
                  tabindex="1"
                  @click="add('container')"
                >
                  Container <Key>C</Key>
                </button>
                <button
                  v-if="currentUserState?.roles?.includes('admin')"
                  type="button"
                  class="w-full text-left text-foreground px-4 py-2 text-sm hover:bg-hover hover:text-foreground flex justify-between items-center"
                  role="menuitem"
                  tabindex="1"
                  @click="add('source')"
                >
                  Source <Key>S</Key>
                </button>
                <button
                  v-if="currentUserState?.roles?.includes('admin')"
                  type="button"
                  class="w-full text-left text-foreground px-4 py-2 text-sm hover:bg-hover hover:text-foreground flex justify-between items-center"
                  role="menuitem"
                  tabindex="2"
                  @click="add('registry')"
                >
                  Registry <Key>R</Key>
                </button>
                <button
                  v-if="currentUserState?.roles?.includes('admin')"
                  type="button"
                  class="w-full text-left text-foreground px-4 py-2 text-sm hover:bg-hover hover:text-foreground flex justify-between items-center"
                  role="menuitem"
                  tabindex="2"
                  @click="add('member')"
                >
                  Member <Key>M</Key>
                </button>
                <button
                  v-if="currentUserState?.roles?.includes('admin')"
                  type="button"
                  class="w-full text-left text-foreground px-4 py-2 text-sm hover:bg-hover hover:text-foreground flex justify-between items-center"
                  role="menuitem"
                  tabindex="2"
                  @click="add('api-key')"
                >
                  Api-Key <Key>A</Key>
                </button>
              </div>
            </div>
          </TransitionFade>
        </div>

        <div class="relative flex items-center">
          <button
            class="h-8 w-8 rounded-full overflow-hidden bg-background hover:ring-1 hover:ring-hover duration-200"
            type="button"
            @click="showUserDropdown = !showUserDropdown"
          >
            <span class="sr-only">Your profile</span>
            <Gravatar v-if="currentUserState" :email="currentUserState?.email" />
          </button>

          <TransitionFade>
            <div
              v-show="showUserDropdown"
              class="absolute right-0 origin-top-right border border-border mt-5 z-[60] w-56 bg-background shadow-lg rounded-md focus:outline-none"
              @mouseleave="showUserDropdown = !showUserDropdown"
            >
              <div class="px-4 py-3" role="none">
                <p class="text-sm text-foreground" role="none">Signed in as</p>
                <p class="truncate text-sm font-medium text-foreground/50" role="none">
                  {{ currentUserState?.email }}
                </p>
              </div>
              <div class="py-1" role="none">
                <button
                  type="button"
                  class="w-full text-left text-foreground block px-4 py-2 text-sm hover:bg-hover hover:text-foreground"
                  role="menuitem"
                  tabindex="-1"
                  @click="logout"
                >
                  Logout
                </button>
              </div>
            </div>
          </TransitionFade>
        </div>
      </div>
    </div>
  </header>
</template>
