import type { Source } from '~/base/default';

import { useLoader } from '~/composables/use-loader';

export function useGithub(source: Source) {
  const config = useRuntimeConfig();
  const apiUrl = source.url.includes('//api.') ? source.url : 'https://api.github.com';
  const { start, stop } = useLoader();

  async function getRepos() {
    start();
    const params: URLSearchParams = new URLSearchParams({
      page: '1',
      per_page: '150',
    });

    const result = useFetch(`${apiUrl}/user/repos?${params}`, {
      headers: {
        Authorization: `Bearer ${source.token}`,
      },
    });

    result.finally(() => {
      stop();
    });

    return result;
  }

  async function getBranches(fullName: string) {
    start();
    const result = useFetch(`${apiUrl}/repos/${fullName}/branches`, {
      headers: {
        Authorization: `Bearer ${source.token}`,
      },
    });

    result.finally(() => {
      stop();
    });

    return result;
  }

  async function checkWebhookExist(fullName: string) {
    if (config.public.env === 'dev') {
      return true;
    }
    let webhook = null;

    const result = await useFetch(`${apiUrl}/repos/${fullName}/hooks`, {
      headers: {
        Authorization: `Bearer ${source.token}`,
      },
      method: 'GET',
    });

    if (Array.isArray(result.data.value)) {
      webhook = result.data.value.find((value) => value.config.url === config.public.host + '/webhook');
    }

    // eslint-disable-next-line no-console
    console.log('checkWebhookExist', webhook);

    return webhook;
  }

  async function addProjectWebhook(fullName: string) {
    if (config.public.env === 'dev') {
      return { data: { id: 'dev' } };
    }
    const webhookExist = await checkWebhookExist(fullName);
    if (webhookExist) {
      return { data: { id: webhookExist.id } };
    }

    const body: Record<string, unknown> = {
      active: true,
      config: {
        content_type: 'json',
        insecure_ssl: '0',
        url: config.public.host + '/webhook',
      },
      events: ['push', 'pull_request'],
    };

    return useFetch(`${apiUrl}/repos/${fullName}/hooks`, {
      body: body,
      headers: {
        Authorization: `Bearer ${source.token}`,
      },
      method: 'POST',
    });
  }

  async function removeProjectWebhook(fullName: string, hookId: string) {
    if (config.public.env === 'dev') {
      return { data: true };
    }

    return useFetch(`${apiUrl}/repos/${fullName}/hooks/${hookId}`, {
      headers: {
        Authorization: `Bearer ${source.token}`,
      },
      method: 'DELETE',
    });
  }

  return {
    addProjectWebhook,
    getBranches,
    getRepos,
    removeProjectWebhook,
  };
}
