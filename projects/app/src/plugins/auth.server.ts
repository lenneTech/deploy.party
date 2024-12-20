import { callWithNuxt, defineNuxtPlugin, useNuxtApp, useRuntimeConfig } from 'nuxt/app';
import { ofetch } from 'ofetch';

import { useTeamState } from '~/states/team';

export default defineNuxtPlugin({
  dependsOn: ['cookies', 'graphql-meta'], // from nuxt-base
  name: 'auth-server',
  async setup() {
    const _nuxt = useNuxtApp();
    const config = await callWithNuxt(_nuxt, useRuntimeConfig);
    const { accessTokenState, currentUserState, refreshTokenState } = await callWithNuxt(_nuxt, useAuthState);
    const { clearSession, getDecodedAccessToken, isTokenExpired, setCurrentUser, setTokens } = await callWithNuxt(
      _nuxt,
      useAuth,
    );

    if (!accessTokenState.value || !refreshTokenState.value) {
      return;
    }

    const { teamState } = await callWithNuxt(_nuxt, useTeamState);
    const payload = accessTokenState.value ? getDecodedAccessToken(accessTokenState.value) : null;

    let token = accessTokenState.value;
    if (isTokenExpired(accessTokenState.value)) {
      const refreshTokenResult = await ofetch(config.public.gqlHost, {
        body: JSON.stringify({
          query: 'mutation refreshToken {refreshToken {token, refreshToken}}',
          variables: {},
        }),
        headers: {
          Authorization: `Bearer ${refreshTokenState.value}`,
        },
        method: 'POST',
      }).catch((err) => {
        console.error('2.auth.server.ts::refreshToken::catch', err.data);
        clearSession();
        navigateTo('/auth/login');
      });

      const data = refreshTokenResult?.data?.refreshToken;
      if (data) {
        setTokens(data.token, data.refreshToken);
        token = data?.token;
      } else {
        clearSession();
        await navigateTo('/auth/login');
      }
    }

    if (token && payload?.id) {
      const userResult = await ofetch(config.public.gqlHost, {
        body: JSON.stringify({
          query: 'query getUser($id: String!){getUser(id: $id){id firstName lastName email avatar verified roles}}',
          variables: {
            id: payload.id,
          },
        }),
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: 'POST',
      }).catch((err) => {
        console.error('2.auth.server.ts::getUser::catch', err.data);
        clearSession();
        navigateTo('/auth/login');
      });

      if (userResult?.data) {
        setCurrentUser(userResult?.data?.getUser);
      }

      const data = await ofetch(config.public.gqlHost, {
        body: JSON.stringify({
          query: 'query getTeamByCurrentUser { getTeamByCurrentUser { id name } }',
          variables: {},
        }),
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: 'POST',
      }).catch((err) => {
        console.error('2.auth.server.ts::getTeamByCurrentUser::catch', err.data);
        clearSession();
        navigateTo('/auth/login');
      });

      if (data?.data?.getTeamByCurrentUser) {
        teamState.value = data.data.getTeamByCurrentUser;
      }
    }
  },
});
