/**
 * Global polling state to track active polling requests across the app
 */
const pollingState = () => useState<number>('polling_active_count', () => 0);

export function usePollingState() {
  const activeCount = pollingState();
  const isPolling = computed<boolean>(() => activeCount.value > 0);

  function increment(): void {
    activeCount.value++;
  }

  function decrement(): void {
    if (activeCount.value > 0) {
      activeCount.value--;
    }
  }

  return {
    activeCount: readonly(activeCount),
    decrement,
    increment,
    isPolling,
  };
}
