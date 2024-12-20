const dockerEventsState = () => useState<Array<string>>('docker_events', () => []);

export async function useDockerEvents() {
  const events = dockerEventsState();
  let subscribed = false;

  async function subscribe() {
    if (subscribed) {
      return;
    }

    const { data, start } = await useEventsSubscription(['log']);
    watch(
      () => data.value,
      () => {
        if (data.value) {
          events.value.push(data.value?.log);
        }
      },
    );
    start();
    subscribed = true;
  }
  subscribe();

  return {
    events,
  };
}
