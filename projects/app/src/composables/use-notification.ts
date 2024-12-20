interface Notification {
  duration?: number;
  text?: string;
  title: string;
  type: 'error' | 'info' | 'success' | 'warning';
}

const notificationState = () => useState<Array<Notification & { uuid: string }>>(() => []);

export function useNotification() {
  const notifications = notificationState();

  function generateUUIDLocal() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = (Math.random() * 16) | 0;
      const value = char === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }

  const notify = (message: Notification) => {
    const data = Object.assign(message, { uuid: generateUUIDLocal() });
    data.duration ??= 5000;
    notifications.value.push(data);
  };

  const remove = (uuid: string) => {
    notifications.value = notifications.value.filter((n) => n.uuid !== uuid);
  };

  return {
    notifications,
    notify,
    remove,
  };
}
