import { useStartAllStoppedContainersMutation, useStopAllContainersMutation } from '~/base';

export function useAdmin() {
  async function stopAllContainer() {
    const { data, error } = await useStopAllContainersMutation();
    if (error) {
      useNotification().notify({ text: error?.message, title: 'error', type: 'error' });
    }

    if (data) {
      useNotification().notify({ text: 'All containers stopped', title: 'Successfully', type: 'success' });
    }

    return data;
  }

  async function startAllStoppedContainers() {
    const { data, error } = await useStartAllStoppedContainersMutation();
    if (error) {
      useNotification().notify({ text: error?.message, title: 'error', type: 'error' });
    }

    if (data) {
      useNotification().notify({ text: 'All containers stopped', title: 'Successfully', type: 'success' });
    }

    return data;
  }

  return {
    startAllStoppedContainers,
    stopAllContainer,
  };
}
