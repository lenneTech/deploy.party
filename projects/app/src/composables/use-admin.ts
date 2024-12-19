import { useStartAllStoppedContainersMutation, useStopAllContainersMutation } from '~/base';

export function useAdmin() {
  async function stopAllContainer() {
    const { mutate, onError } = await useStopAllContainersMutation(null);
    onError((e) => {
      useNotification().notify({ text: e.message, title: 'error', type: 'error' });
    });

    const result = await mutate();

    if (result?.data?.stopAllContainers) {
      useNotification().notify({ text: 'All containers stopped', title: 'Successfully', type: 'success' });
    }

    return result?.data?.stopAllContainers;
  }

  async function startAllStoppedContainers() {
    const { mutate, onError } = await useStartAllStoppedContainersMutation(null);
    onError((e) => {
      useNotification().notify({ text: e.message, title: 'error', type: 'error' });
    });

    const result = await mutate();

    if (result?.data?.startAllStoppedContainers) {
      useNotification().notify({ text: 'All containers stopped', title: 'Successfully', type: 'success' });
    }

    return result?.data?.startAllStoppedContainers;
  }

  return {
    startAllStoppedContainers,
    stopAllContainer,
  };
}
