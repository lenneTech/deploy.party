export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    // handle error, e.g. report to a service
    console.error(error);
  };

  nuxtApp.vueApp.config.warnHandler = (warning, instance, info) => {
    // handle error, e.g. report to a service
    // console.warn(warning);
  };

  // Also possible
  nuxtApp.hook('vue:error', (error, instance, info) => {
    // handle error, e.g. report to a service
    console.error(error);
  });
});
