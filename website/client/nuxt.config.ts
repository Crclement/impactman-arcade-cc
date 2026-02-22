// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  title: "Impact Arcade",
  target: "static",
  app: {
    head: {
      link: [
        {
          rel: "icon",
          type: "image/x-icon",
          href: "/favicon.png",
        },
      ],
    },
  },
});
