export function useBackButton() {
  const router = useRouter();

  const routes = computed(() =>
    router.currentRoute.value.fullPath.split('/').map((route, index, routes) => routes.slice(0, index + 1).join('/')),
  );
  const showBackButton = computed(() => routes.value.length > 1);
  const back = () => {
    const existRoutes = router.getRoutes();
    let previousRoute = routes.value[routes.value.length - 2];
    const existRoute = existRoutes.find((value) => {
      const pathArray = value.path.split('/');
      const routeArray = previousRoute.split('/');
      let valid = false;

      if (pathArray.length !== routeArray.length) {
        return false;
      }

      for (let i = 0; i < routeArray.length; i++) {
        if (pathArray[i] !== routeArray[i]) {
          valid = pathArray[i].startsWith(':');

          if (!valid) {
            break;
          }
        } else {
          valid = true;
        }
      }

      return valid;
    });

    if (!existRoute) {
      previousRoute = routes.value[routes.value.length - 3];
    }

    if (!existRoute && (previousRoute.endsWith('/builds') || previousRoute.endsWith('/projects/edit'))) {
      previousRoute = routes.value[routes.value.length - 4];
    } else if (previousRoute.endsWith('/builds') || previousRoute.endsWith('/projects/edit')) {
      previousRoute = routes.value[routes.value.length - 3];
    }

    navigateTo(previousRoute || '/', { replace: true });
  };

  return {
    back,
    routes,
    showBackButton,
  };
}
