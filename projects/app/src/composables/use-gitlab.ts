import type { Source } from '~/base/default';

export function useGitlab(source: Source) {
  const config = useRuntimeConfig();
  const apiUrl = source.url.includes('/api/') ? source.url : source.url + '/api/v4';

  async function getGroups() {
    const params: URLSearchParams = new URLSearchParams({
      page: '1',
      per_page: '100',
    });

    return useFetch(`${apiUrl}/groups?${params}`, {
      headers: {
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Origin': '*',
        Authorization: `Bearer ${source.token}`,
      },
    });
  }

  async function getProjects() {
    const params: URLSearchParams = new URLSearchParams({
      membership: 'true',
      page: '1',
      per_page: '100',
    });

    return useFetch(`${apiUrl}/projects?${params}`, {
      headers: {
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Origin': '*',
        Authorization: `Bearer ${source.token}`,
      },
    });
  }

  async function getProjectById(id: string) {
    return useFetch(`${apiUrl}/project/${id}`, {
      headers: {
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Origin': '*',
        Authorization: `Bearer ${source.token}`,
      },
    });
  }

  async function getBranches(id: string) {
    const params: URLSearchParams = new URLSearchParams({
      page: '1',
      per_page: '100',
    });

    return useFetch(`${apiUrl}/projects/${id}/repository/branches?${params}`, {
      headers: {
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Origin': '*',
        Authorization: `Bearer ${source.token}`,
      },
    });
  }

  async function getReleases(id: string) {
    const params: URLSearchParams = new URLSearchParams({
      page: '1',
      per_page: '100',
    });

    return useFetch(`${apiUrl}/projects/${id}/releases?${params}`, {
      headers: {
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Origin': '*',
        Authorization: `Bearer ${source.token}`,
      },
    });
  }

  async function checkWebhookExist(id: string) {
    if (config.public.env === 'dev') {
      return true;
    }
    let webhook = null;

    const result = await useFetch(`${apiUrl}/projects/${id}/hooks`, {
      headers: {
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Origin': '*',
        Authorization: `Bearer ${source.token}`,
      },
      method: 'GET',
    });

    if (Array.isArray(result.data.value)) {
      webhook = result.data.value.find((value) => value.url === config.public.host + '/webhook');
    }

    // eslint-disable-next-line no-console
    console.log('checkWebhookExist', webhook);

    return webhook;
  }

  async function addProjectWebhook(id: string) {
    if (config.public.env === 'dev') {
      return { data: { id: 'dev' } };
    }
    const webhookExist = await checkWebhookExist(id);
    if (webhookExist) {
      return { data: { id: webhookExist.id } };
    }

    const body: any = {
      merge_requests_events: true,
      push_events: true,
      releases_events: true,
      url: config.public.host + '/webhook',
    };

    return useFetch(`${apiUrl}/projects/${id}/hooks`, {
      body: body,
      headers: {
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Origin': '*',
        Authorization: `Bearer ${source.token}`,
      },
      method: 'POST',
    });
  }

  async function removeProjectWebhook(id: string, hookId: string) {
    if (config.public.env === 'dev') {
      return { data: true };
    }

    return useFetch(`${apiUrl}/projects/${id}/hooks/${hookId}`, {
      headers: {
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Origin': '*',
        Authorization: `Bearer ${source.token}`,
      },
      method: 'DELETE',
    });
  }

  return {
    addProjectWebhook,
    getBranches,
    getGroups,
    getProjectById,
    getProjects,
    getReleases,
    removeProjectWebhook,
  };
}
