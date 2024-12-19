import { useAuthState } from '#imports';

export default defineNuxtRouteMiddleware((to, from) => {
  const { accessTokenState, currentUserState, refreshTokenState } = useAuthState();

  if (to.fullPath.startsWith('/auth/')) {
    return;
  }

  if (!accessTokenState.value || !refreshTokenState.value || !currentUserState.value) {
    return navigateTo('/auth/login');
  }
});
