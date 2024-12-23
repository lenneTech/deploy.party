import pkg from './package.json';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: process.env['INSTANCE_NAME'] ? process.env['INSTANCE_NAME'] + ' | ' : '' + 'deploy.party',
      viewport: 'width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no',
    },
  },

  compatibilityDate: '2024-12-20',

  devServer: {
    port: 3001,
  },

  experimental: {
    asyncContext: true,
    renderJsonPayloads: false,
  },

  googleFonts: {
    base64: true,
    download: true,
    families: {
      'Open Sans': [200, 300, 400, 500, 600, 800, 900],
      'Ubuntu Mono': [400, 500, 600, 800, 900],
      Urbanist: [200, 300, 400, 500, 600, 800, 900],
    },
    stylePath: '~/assets/css/fonts.css',
  },

  imports: {
    dirs: ['./states', './stores', './forms', './base'],
  },

  modules: [
    '@kevinmarrec/nuxt-pwa',
    '@nuxtjs/tailwindcss',
    '@lenne.tech/nuxt-base',
    '@nuxtjs/google-fonts',
    '@vueuse/nuxt',
    'nuxt-icon',
    'dayjs-nuxt',
  ],

  nuxtBase: {
    generateTypes: process.env['GENERATE_TYPES'] === '1',
    gqlHost: process.env.API_URL + '/graphql',
    host: process.env.API_URL,
    schema: process.env.API_SCHEMA,
    storagePrefix: process.env.STORAGE_PREFIX,
  },

  pwa: {
    icon: {
      fileName: 'icon_1080.png',
      maskablePadding: 0,
      source: './src/public/icon_1080.png',
    },
    manifest: {
      background_color: '#1D2025',
      categories: ['deploy', 'docker', 'app', 'party'],
      description: 'Best docker deploy app ever, really buddy',
      lang: 'de',
      name: 'deploy.party',
      orientation: 'portrait-primary',
      short_name: 'deploy.party',
    },
    meta: {
      appleStatusBarStyle: 'black-translucent',
      mobileApp: true,
      mobileAppIOS: true,
      name: 'deploy.party',
    },
    workbox: {
      enabled: true,
      templatePath: './public/service-worker.js',
    },
  },

  runtimeConfig: {
    public: {
      env: process.env['NODE_ENV'] || 'development',
      gqlHost: process.env.API_URL + '/graphql',
      host: process.env.API_URL,
      hostIp: process.env['HOST_IP'],
      instanceName: process.env['INSTANCE_NAME'],
      terminalHost: process.env['TERMINAL_HOST'] || 'ws://localhost:3002/terminal',
      version: pkg.version,
      webPushKey: process.env['WEB_PUSH_PUBLIC_KEY'],
    },
  },
  spaLoadingTemplate: false,
  srcDir: './src',
  ssr: true,
});