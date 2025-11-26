import type { Ref } from 'vue';

/**
 * Options for the usePolling composable
 */
export interface PollingOptions {
  /** Whether polling should start immediately (default: true) */
  immediate?: boolean;
  /** Delay in milliseconds between completed request and next request start */
  interval: number;
  /** Maximum number of consecutive errors before auto-pause (default: 3) */
  maxConsecutiveErrors?: number;
  /** Callback when an error occurs during polling */
  onError?: (error: Error) => void;
}

/**
 * Return type of the usePolling composable
 */
export interface PollingReturn {
  /** Number of consecutive errors */
  errorCount: Readonly<Ref<number>>;
  /** Whether polling is currently active */
  isActive: Readonly<Ref<boolean>>;
  /** Whether a request is currently pending */
  isPending: Readonly<Ref<boolean>>;
  /** Pause polling */
  pause: () => void;
  /** Resume polling */
  resume: () => void;
  /** Manually trigger the polling function once (outside of interval) */
  trigger: () => Promise<void>;
}
