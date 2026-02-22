<template>
  <div class="hero" :class="{ 'is-active': isActive }">
    <div class="impact-arcade-wrapper">
      <img class="arcade" src="assets/images/arcade-right.svg" />
      <div class="arcade-text">
        <img v-if="isMobile" src="assets/images/mobile-impact-arcade.png" />
        <img v-else src="assets/images/impact-arcade.png" />
        <h3>Launching 2023</h3>
      </div>
      <img class="arcade" src="assets/images/arcade-left.svg" />
    </div>
    <div class="form-container">
      <EmailForm />
    </div>
  </div>
  <img src="assets/images/gradient.jpeg" class="gradient" />
</template>

<script lang="ts" setup>
import { ref, onBeforeUnmount, onMounted } from "vue";

const isMobile = ref(true);
const isActive = ref(false);

onMounted(() => {
  checkIsMobile();
  window.addEventListener("resize", checkIsMobile, true);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", checkIsMobile, true);
});

function checkIsMobile(): void {
  isMobile.value = window.innerWidth < 768;
  nextTick(() => (isActive.value = true));
}
</script>

<style scoped>
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;

  width: 100%;
  height: fit-content;
  min-height: 100vh;

  overflow: hidden;

  opacity: 0;
  transition: opacity 300ms ease-in-out;
}

.hero.is-active {
  opacity: 1;
}

.impact-arcade-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3rem;
}

.arcade {
  width: 100%;
  max-width: 150px;
}

.arcade-text {
  position: relative;
}

.arcade-text img {
  width: 100%;
  max-width: 600px;
  object-fit: contain;
}

.arcade-text h3 {
  position: absolute;
  left: 50%;
  translate: -50%;
  white-space: nowrap;

  font-weight: 700;
  font-size: 24px;
}

.form-container {
  width: 100%;
  margin-top: 5rem;
}

.gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  z-index: -1;
}

@media only screen and (max-width: 768px) {
  .impact-arcade-wrapper {
    gap: 1rem;
  }
  .arcade {
    width: 100%;
    max-width: 90px;
    object-fit: contain;
  }

  .arcade-text img {
    width: 100%;
    object-fit: contain;
  }

  .form-container {
    width: calc(100% - 2rem);
    margin: 7rem auto 0;
  }
}
</style>
