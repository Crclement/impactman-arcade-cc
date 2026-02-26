export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: process.env.API_URL || 'http://localhost:3001'
    }
  },

  css: [
    '~/assets/css/stroke.scss'
  ],

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/motion/nuxt'
  ],

  build: {
    transpile: ['@headlessui/vue']
  },

  nitro: {
    routeRules: {
      // HTML pages: always revalidate so deploys are picked up immediately
      '/**': { headers: { 'cache-control': 'no-cache, no-store, must-revalidate' } },
      // Hashed assets: cache forever (hash changes on rebuild)
      '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    }
  }
})