import type { Source } from '~/base/default';

import { useLoader } from '~/composables/use-loader';

export function useGithub(source: Source, loading = true) {
  const config = useRuntimeConfig();
  const apiUrl = source.url.includes('//api.') ? source.url : 'https://api.github.com';
  const { start, stop } = useLoader();

  async function getRepos() {
    if (loading) {
      start();
    }

    const params: any = new URLSearchParams({
      page: '1',
      per_page: '150',
    });

    const result = useFetch(`${apiUrl}/user/repos?${params}`, {
      headers: {
        Authorization: `Bearer ${source.token}`,
      },
    });

    result.finally(() => {
      if (loading) {
        stop();
      }
    });

    return result;
  }

  async function getBranches(full_name: string) {
    const result = useFetch(`${apiUrl}/repos/${full_name}/branches`, {
      headers: {
        Authorization: `Bearer ${source.token}`,
      },
    });

    result.finally(() => {
      if (loading) {
        stop();
      }
    });

    return result;
  }

  async function checkWebhookExist(full_name: string) {
    if (config.public.env === 'dev') {
      return true;
    }
    let webhook = null;

    const result = await useFetch(`${apiUrl}/repos/${full_name}/hooks`, {
      headers: {
        Authorization: `Bearer ${source.token}`,
      },
      method: 'GET',
    });

    if (Array.isArray(result.data.value)) {
      webhook = result.data.value.find((value) => value.config.url === config.public.apiUrl + '/webhook');
    }

    // eslint-disable-next-line no-console
    console.log('checkWebhookExist', webhook);

    return webhook;
  }

  async function addProjectWebhook(full_name: string) {
    if (config.public.env === 'dev') {
      return { data: { id: 'dev' } };
    }
    const webhookExist = await checkWebhookExist(full_name);
    if (webhookExist) {
      return { data: { id: webhookExist.id } };
    }

    const body: any = {
      active: true,
      config: {
        content_type: 'json',
        insecure_ssl: '0',
        url: config.public.apiUrl + '/webhook',
      },
      events: ['push', 'pull_request'],
    };

    return useFetch(`${apiUrl}/repos/${full_name}/hooks`, {
      body: body,
      headers: {
        Authorization: `Bearer ${source.token}`,
      },
      method: 'POST',
    });
  }

  async function removeProjectWebhook(full_name: string, hookId: string) {
    if (config.public.env === 'dev') {
      return { data: true };
    }

    return useFetch(`${apiUrl}/repos/${full_name}/hooks/${hookId}`, {
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
