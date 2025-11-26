import type { PollingOptions, PollingReturn } from '~/interfaces/polling.interface';

/**
 * Composable for sequential polling that waits for the previous request to complete
 * before starting the next interval timer.
 *
 * Unlike useIntervalFn, this ensures requests don't stack up when the server
 * is slow or network latency is high.
 *
 * @param fn - Async function to poll (must return a Promise)
 * @param options - Polling configuration
 * @returns Control methods and state refs
 *
 * @example
 * ```typescript
 * const { data, refresh } = await useAsyncGetContainerQuery({ id: containerId.value }, null);
 *
 * const { pause, resume, isActive, isPending } = usePolling(refresh, {
 *   interval: 2000,
 *   onError: (error) => console.error('Polling error:', error),
 * });
 * ```
 */
export function usePolling(fn: () => Promise<unknown>, options: PollingOptions): PollingReturn {
  // ============================================================================
  // Variables
  // ============================================================================
  const { immediate = true, interval, maxConsecutiveErrors = 3, onError } = options;

  const errorCount = ref<number>(0);
  const isActive = ref<boolean>(immediate);
  const isPending = ref<boolean>(false);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  // ============================================================================
  // Functions
  // ============================================================================

  /**
   * Schedule the next polling execution
   */
  function scheduleNext(): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      execute();
    }, interval);
  }

  /**
   * Execute the polling function and schedule the next call
   */
  async function execute(): Promise<void> {
    if (isPending.value || !isActive.value) {
      return;
    }

    isPending.value = true;

    try {
      await fn();
      errorCount.value = 0;
    } catch (error) {
      errorCount.value++;

      if (onError && error instanceof Error) {
        onError(error);
      }

      // Auto-pause after too many consecutive errors
      if (errorCount.value >= maxConsecutiveErrors) {
        console.warn(`[usePolling] Paused after ${maxConsecutiveErrors} consecutive errors`);
        isActive.value = false;
      }
    } finally {
      isPending.value = false;

      if (isActive.value) {
        scheduleNext();
      }
    }
  }

  /**
   * Pause polling
   */
  function pause(): void {
    isActive.value = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  /**
   * Resume polling
   */
  function resume(): void {
    if (isActive.value) {
      return;
    }

    isActive.value = true;
    errorCount.value = 0;
    scheduleNext();
  }

  /**
   * Manually trigger the polling function once (outside of regular interval)
   */
  async function trigger(): Promise<void> {
    if (isPending.value) {
      return;
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    await execute();
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  if (immediate) {
    scheduleNext();
  }

  onBeforeUnmount(() => {
    pause();
  });

  // ============================================================================
  // Return
  // ============================================================================
  return {
    errorCount: readonly(errorCount),
    isActive: readonly(isActive),
    isPending: readonly(isPending),
    pause,
    resume,
    trigger,
  };
}
