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
  }
})