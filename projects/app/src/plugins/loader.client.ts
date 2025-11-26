import { useLoader } from '~/composables/use-loader';

/**
 * Plugin that intercepts all fetch requests to automatically show/hide the loader.
 * Polling requests are automatically excluded via usePollingState integration in useLoader.
 */
export default defineNuxtPlugin(() => {
  const { decrement, increment } = useLoader();

  const originalFetch = globalThis.fetch;

  globalThis.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    increment();
    try {
      return await originalFetch.call(globalThis, input, init);
    } finally {
      decrement();
    }
  };
});
