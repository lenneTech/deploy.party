import { usePollingState } from '~/states/polling';

// ============================================================================
// Constants
// ============================================================================
const SHOW_DELAY = 150;
const MIN_DURATION = 300;

// ============================================================================
// Global State (shared across all components)
// ============================================================================
const loaderState = () => useState<number>('loader_active_requests', () => 0);
const loaderVisible = () => useState<boolean>('loader_visible', () => false);

// Timer references (module-level for singleton behavior)
let showDelayTimer: ReturnType<typeof setTimeout> | null = null;
let minDurationTimer: ReturnType<typeof setTimeout> | null = null;
let visibleSince: number = 0;

export function useLoader() {
  // ============================================================================
  // Composables
  // ============================================================================
  const { isPolling } = usePollingState();

  // ============================================================================
  // Variables
  // ============================================================================
  const activeRequests = loaderState();
  const isVisible = loaderVisible();

  // ============================================================================
  // Computed Properties
  // ============================================================================
  const shouldShow = computed<boolean>(() => activeRequests.value > 0 && !isPolling.value);

  // ============================================================================
  // Functions
  // ============================================================================

  /**
   * Clear all pending timers
   */
  function clearTimers(): void {
    if (showDelayTimer) {
      clearTimeout(showDelayTimer);
      showDelayTimer = null;
    }
    if (minDurationTimer) {
      clearTimeout(minDurationTimer);
      minDurationTimer = null;
    }
  }

  /**
   * Show the loader after delay
   */
  function scheduleShow(): void {
    if (showDelayTimer || isVisible.value) {
      return;
    }

    showDelayTimer = setTimeout(() => {
      showDelayTimer = null;
      if (shouldShow.value) {
        isVisible.value = true;
        visibleSince = Date.now();
      }
    }, SHOW_DELAY);
  }

  /**
   * Hide the loader, respecting minimum duration
   */
  function scheduleHide(): void {
    if (!isVisible.value) {
      clearTimers();
      return;
    }

    const elapsed: number = Date.now() - visibleSince;
    const remaining: number = MIN_DURATION - elapsed;

    if (remaining <= 0) {
      isVisible.value = false;
      clearTimers();
    } else {
      if (minDurationTimer) {
        return;
      }

      minDurationTimer = setTimeout(() => {
        minDurationTimer = null;
        if (!shouldShow.value) {
          isVisible.value = false;
        }
      }, remaining);
    }
  }

  /**
   * Update visibility based on current state
   */
  function updateVisibility(): void {
    if (shouldShow.value && !isVisible.value) {
      scheduleShow();
    } else if (!shouldShow.value && isVisible.value) {
      scheduleHide();
    } else if (!shouldShow.value && !isVisible.value) {
      clearTimers();
    }
  }

  /**
   * Increment active request count
   */
  function increment(): void {
    activeRequests.value++;
    updateVisibility();
  }

  /**
   * Decrement active request count
   */
  function decrement(): void {
    if (activeRequests.value > 0) {
      activeRequests.value--;
    }
    updateVisibility();
  }

  /**
   * Legacy: Start loading (alias for increment)
   */
  function start(): void {
    increment();
  }

  /**
   * Legacy: Stop loading (alias for decrement)
   */
  function stop(): void {
    decrement();
  }

  // ============================================================================
  // Return
  // ============================================================================
  return {
    decrement,
    increment,
    loading: readonly(isVisible),
    start,
    stop,
  };
}
