const dockerEventsState = () => useState<Array<Notification>>('docker_events', () => []);

export async function useDockerEvents() {
  const events = dockerEventsState();
  let subscribed = false;

  async function subscribe() {
    if (subscribed) {
      return;
    }

    const { onResult, start } = await useEventsSubscription(['log']);
    onResult((value) => {
      const payload = value.data?.events;
      if (payload) {
        events.value?.push(payload.log as never);
      }
    });
    start();
    subscribed = true;
  }
  subscribe();

  return {
    events,
  };
}
