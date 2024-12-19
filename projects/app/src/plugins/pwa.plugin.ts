export default defineNuxtPlugin(async (_nuxtApp) => {
  const applicationServerKey = useRuntimeConfig().public.webPushKey as string;
  const permissionState = ref<PermissionState>('prompt');
  const subscription = ref<PushSubscription | null>(null);

  if (process.client) {
    const iosPWASplash = (await import('ios-pwa-splash')).default;
    iosPWASplash('/notification.png', '#1D2025');
  }

  async function subscribe() {
    const sw = await navigator.serviceWorker.ready;
    const push = await sw.pushManager.subscribe({
      applicationServerKey,
      userVisibleOnly: true,
    });
    await refreshSubscription();
    await refreshPermissionState();
    const body = {
      payload: push,
    };
    try {
      await useAuthFetch('/web-push/subscribe', {
        baseURL: useRuntimeConfig().public.apiUrl,
        body,
        method: 'POST',
      });
    } catch (error) {}
  }

  async function refreshPermissionState() {
    const sw = await navigator.serviceWorker.ready;
    permissionState.value = await sw.pushManager.permissionState({
      applicationServerKey,
      userVisibleOnly: true,
    });
  }

  async function refreshSubscription() {
    const sw = await navigator.serviceWorker.ready;
    subscription.value = await sw.pushManager.getSubscription();
  }

  async function unsubscribe() {
    if (subscription.value) {
      await subscription.value.unsubscribe();
      const body = {
        payload: subscription.value,
      };
      await refreshPermissionState();
      try {
        await useAuthFetch('/web-push/', {
          baseURL: useRuntimeConfig().public.apiUrl,
          body,
          method: 'DELETE',
        });
      } catch (error) {}
      subscription.value = null;
    }
  }

  const route = useRoute();
  const pwa = ref(false);
  const isPwa = computed(() => route.query.standalone === 'true' || pwa.value);

  if (process.client) {
    if (window && window.matchMedia && document && window.matchMedia('(display-mode: standalone)').matches) {
      if (navigator && navigator.serviceWorker) {
        await refreshSubscription();
        await refreshPermissionState();
      }
      pwa.value = true;
      document.body.classList.add('select-none', 'overscroll-y-none', 'no-scrollbar');
    } else {
      pwa.value = false;
      document.body.classList.remove('select-none', 'overscroll-y-none', 'no-scrollbar');
    }
  }

  useHead({
    htmlAttrs: { class: isPwa.value ? 'pwa' : '' },
    meta: [
      {
        content: 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no',
        hid: 'viewport',
        name: 'viewport',
      },
    ],
  });

  return {
    provide: {
      pwa: {
        isPwa: () => isPwa.value,
        permissionState,
        subscribe,
        subscription,
        unsubscribe,
      },
    },
  };
});
