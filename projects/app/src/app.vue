<script setup lang="ts">
import { useAuthState } from '#imports';

import { useBackgroundKeys } from '~/composables/use-background-keys';

const isDark = usePreferredDark();
const { currentUserState } = useAuthState();
useHead({
  bodyAttrs: {
    class: () => (isDark ? 'dark' : 'light'),
  },
});

const { init } = useBackgroundKeys();
onMounted(() => {
  if (currentUserState.value) {
    init();
  }
});
</script>

<template>
  <div>
    <NuxtLayout>
      <BaseNotificationContainer />
      <BaseContextMenuContainer />
      <BaseModalContainer />
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
