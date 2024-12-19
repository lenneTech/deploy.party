const loading = ref<boolean>(false);
export function useLoader() {
  function start() {
    loading.value = true;
  }

  function stop() {
    loading.value = false;
  }

  return { loading, start, stop };
}
