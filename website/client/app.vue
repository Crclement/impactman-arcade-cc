<template>
  <div>
    <NuxtPage />
  </div>
</template>

<script setup>
useHead({
  title: "Impact Arcade",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  charset: "utf-8",
  meta: [{ name: "description", content: "Impact Arcade" }],
});
const appConfig = useAppConfig();
</script>

<style>
html,
body {
  margin: 0;
  box-sizing: border-box;
  overflow: hidden;
}

* {
  font-family: "Futura";
}

@font-face {
  font-family: "Futura";
  src: url("assets/fonts/Futura-Medium.woff2") format("woff2");
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Futura";
  src: url("assets/fonts/Futura-Bold.woff2") format("woff2");
  font-weight: bold;
  font-style: normal;
  font-display: swap;
}
</style>
