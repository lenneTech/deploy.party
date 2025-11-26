// ============================================================================
// Constants
// ============================================================================
const SHOW_DELAY = 150;
const MIN_DURATION = 300;

// ============================================================================
// Global State (module-level singleton)
// ============================================================================
const activeRequests = ref<number>(0);
const isVisible = ref<boolean>(false);

// Timer references
let showDelayTimer: ReturnType<typeof setTimeout> | null = null;
let minDurationTimer: ReturnType<typeof setTimeout> | null = null;
let visibleSince = 0;

export function useLoader() {
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
   * Update loader visibility with anti-flicker logic
   */
  function updateVisibility(): void {
    const shouldShow: boolean = activeRequests.value > 0;

    if (shouldShow && !isVisible.value && !showDelayTimer) {
      // Schedule showing after delay
      showDelayTimer = setTimeout(() => {
        showDelayTimer = null;
        if (activeRequests.value > 0) {
          isVisible.value = true;
          visibleSince = Date.now();
        }
      }, SHOW_DELAY);
    } else if (!shouldShow && isVisible.value) {
      // Hide with minimum duration
      const elapsed: number = Date.now() - visibleSince;
      const remaining: number = MIN_DURATION - elapsed;

      if (remaining <= 0) {
        isVisible.value = false;
        clearTimers();
      } else if (!minDurationTimer) {
        minDurationTimer = setTimeout(() => {
          minDurationTimer = null;
          if (activeRequests.value === 0) {
            isVisible.value = false;
          }
        }, remaining);
      }
    } else if (!shouldShow && !isVisible.value) {
      clearTimers();
    }
  }

  /**
   * Start loading indicator
   */
  function start(): void {
    activeRequests.value++;
    updateVisibility();
  }

  /**
   * Stop loading indicator
   */
  function stop(): void {
    if (activeRequests.value > 0) {
      activeRequests.value--;
    }
    updateVisibility();
  }

  // ============================================================================
  // Return
  // ============================================================================
  return {
    loading: readonly(isVisible),
    start,
    stop,
  };
}
