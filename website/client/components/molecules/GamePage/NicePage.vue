<template>
  <div class="text-center nicegame mx-auto mt-10 relative z-100 px-10">
    <div>
      <img class="mx-auto" src="/images/texts/nicegame.png" alt="Nice Game" />
    </div>

    <div class="mt-8 mb-20 text-center text-3xl text-navyBlue font-bold">
      <p>
        DON'T LOSE YOUR SCORE!
      </p>
    </div>

    <div class="w-full">
      <div class="font-bold text-left text-navyBlue mb-4">
        CREATE AN ACCOUNT TO SAVE YOUR SCORE & TICKETS!
      </div>
      <div class="w-full mb-4">
        <AtomsGamePageUIInput v-model="LoginValues.username" class="w-full" type="text" placeholder="Username" />
      </div>
      <div class="w-full mb-4">
        <AtomsGamePageUIInput v-model="LoginValues.email" class="w-full" type="text" placeholder="Email" />
      </div>
      <div v-if="LoginType === 'signup'" class="w-full">
        <AtomsGamePageUIInput v-model="LoginValues.email" class="w-full" type="password" placeholder="Password" />
      </div>

      <div class="flex mt-8 justify-center">
        <AtomsGamePageUIButton @click="doAuth" :disabled="loading" class="bg-limeGreen mr-2">
          <span v-if="!loading">Sign up</span>
          <span v-else>Loading...</span>
        </AtomsGamePageUIButton>
        <a href="/games/impactman">
          <AtomsGamePageUIButton class="py-0 opacity-50 hover:opacity-80 transition-all">
            <span>Or play again</span>
          </AtomsGamePageUIButton>
        </a>
      </div>
    </div>

    <hr class="mt-20 border-1 border-[#16114F] opacity-50"/>

    <p class="inline-block opacity-40 text-sm font-bold underline text-navyBlue mt-4 cursor-pointer">
      Already Have An Account?
    </p>
    <p class="text-sm font-bold mt-6">
      WE HATE SPAM LIKE OCEAN PLASTIC, SO WE'D NEVER SEND THAT TO YOU.
    </p>
</div>
</template>

<script lang="ts" setup>
const loading = ref(false)
const LoginType = ref<'signup' | 'login'>('signup')
const LoginValues = reactive({
  username: '',
  email: '',
  password: ''
})

const doAuth = async () => {
  const url = LoginType.value === 'signup' ? '/users/signup' : '/users/login'

  const res = await $apiCall(url, {
    method: 'POST',
    body: LoginValues
  })

}
</script>