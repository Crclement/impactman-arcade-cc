<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
</div>
</template>

<script setup>
useHead({
  title: "Impact Arcade",
  meta: [{
    name: "description", content: "Impact Arcade"
  }],
  link: [
    {
      rel: "icon", type: "image/x-icon", href: "/favicon.png"
    },
    {
      rel: "stylesheet", href: "/fonts/style.css"
    },
    {
      rel: "preload", as: 'font', crossorigin: 'anonymous', href: "/fonts/Kontesa-Typeface-Bold.woff"
    },
    {
      rel: "preload", as: 'font', crossorigin: 'anonymous', href: "/fonts/Retro-Land-Mayhem.woff"
    },
    {
      rel: "preload", as: 'font', crossorigin: 'anonymous', href: "/fonts/Agrandir-700.woff"
    },
    {
      rel: "preload", as: 'font', crossorigin: 'anonymous', href: "/fonts/Agrandir-800.woff"
    }
  ]
});
const appConfig = useAppConfig();
</script>

<style lang="sass">
.bg-gradient-pink
  background: linear-gradient(180.02deg, #F3B3E1 -36.79%, #FFFAFC 99.99%)
  border: 3px solid #16114F
  box-shadow: 4px 4px 0px #16114F
</style>

