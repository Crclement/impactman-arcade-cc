<template>
  <form class="email-form" @submit.prevent="submitEmail">
    <input
      class="email-input"
      type="text"
      v-model="email"
      placeholder="Email address"
    />
    <button
      class="submit-btn"
      type="submit"
      :disabled="message === 'Loading...'"
    >
      Notify Me
      <img src="/images/arrow-circle-right.svg" />
    </button>
    <p class="submit-message">
      {{ message }}
    </p>
  </form>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const email = ref("");
const message = ref("");

const submitEmail = async () => {
  message.value = "Loading...";

  try {
    const response: {
      status: number;
      message: string;
    } = await $fetch("/api/subscribe-to-newsletter", {
      method: "POST",
      body: { email: email.value },
    });

    if (response.status === 200) {
      message.value = "Subscribed!";
    } else if (response.message === "Invalid Resource") {
      message.value = "Invalid E-mail";
    } else if (response.message === "Member Exists") {
      message.value = "Wait a sec... we already have that email! 🤔";
    } else {
      message.value = response.message;
    }
  } catch (e) {
    message.value = "Something went wrong";
  }
};
</script>

<style scoped>
.email-form {
  display: flex;
  width: 100%;
  max-width: 500px;
  background-color: white;
  font-size: 18px;
  border-radius: 8px;
  padding: 1px;
  margin: 0 auto;
  position: relative;
}

.email-input {
  width: 100%;
  border-radius: 8px;
  font-size: inherit;
  border: none;
  padding: 4px 1.5rem;
}

.submit-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 1rem;
  cursor: pointer;

  background-color: white;
  border: 1px solid black;
  border-radius: 8px;
  font-size: inherit;
  white-space: nowrap;
}

.submit-btn img {
  width: 40px;
}

.submit-message {
  position: absolute;
  top: 100%;
  left: 50%;
  translate: -50%;
  margin-top: 2rem;
  font-size: 20px;
  text-align: center;
}

@media only screen and (max-width: 768px) {
  .email-form {
    font-size: 14px;
  }

  .email-input {
    width: 100%;
    border-radius: 8px;
    font-size: inherit;
    border: none;
    padding: 4px 1rem;
  }

  .submit-btn {
    gap: 4px;
    padding: 4px 0.75rem;
  }
}
</style>
