<template>
  <div>
    <!-- Controls -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="font-retro text-navyBlue text-lg uppercase">UX Tests</h2>
      <div class="flex gap-2">
        <button
          @click="cleanup"
          :disabled="running || cleaning"
          class="font-retro text-xs uppercase py-2 px-4 text-navyBlue rounded-sm transition-all"
          :style="{ border: '2px solid #16114F', boxShadow: '0 3px 0 #16114F', background: '#fca5a5' }"
        >
          {{ cleaning ? 'Cleaning...' : 'Cleanup Test Data' }}
        </button>
        <button
          @click="runAll"
          :disabled="running"
          class="font-retro text-xs uppercase py-2 px-4 bg-green text-navyBlue rounded-sm transition-all"
          :style="{ border: '2px solid #16114F', boxShadow: '0 3px 0 #16114F' }"
        >
          {{ running ? 'Running...' : 'Run All' }}
        </button>
      </div>
    </div>

    <!-- Cleanup message -->
    <div v-if="cleanupMessage" class="mb-4 text-sm p-3 rounded-lg" :class="cleanupError ? 'bg-red-50 text-red-700' : 'bg-green/30 text-navyBlue'">
      {{ cleanupMessage }}
    </div>

    <!-- Test Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <div
        v-for="(test, i) in tests"
        :key="i"
        class="test-card"
        :class="test.status"
      >
        <div class="flex justify-between items-start mb-2">
          <div>
            <div class="font-retro text-xs text-navyBlue uppercase">{{ test.name }}</div>
            <div class="text-[0.7rem] text-navyBlue/60 mt-0.5">{{ test.description }}</div>
          </div>
          <span class="status-pill" :class="test.status">{{ test.status }}</span>
        </div>

        <div class="flex justify-between items-center mt-3">
          <span v-if="test.time !== null" class="text-[0.65rem] text-navyBlue/50">{{ test.time }}ms</span>
          <span v-else class="text-[0.65rem] text-navyBlue/50">&nbsp;</span>
          <button
            @click="runTest(i)"
            :disabled="test.status === 'running'"
            class="run-btn font-retro text-[0.6rem] uppercase py-1 px-3 rounded-sm"
          >
            Run
          </button>
        </div>

        <div v-if="test.error" class="mt-2 text-[0.65rem] text-red-600 bg-red-50 rounded p-1.5 break-words">
          {{ test.error }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const apiBase = resolveApiBase()
const running = ref(false)
const cleaning = ref(false)
const cleanupMessage = ref('')
const cleanupError = ref(false)

// Shared state across sequential tests
const ctx = reactive({
  testEmail: `__test__${Date.now()}@test.impactarcade.com`,
  userId: '' as string,
  token: '' as string,
  sessionCode: '' as string,
  idempotencyKey: `__test__idem_${Date.now()}`,
})

interface TestItem {
  name: string
  description: string
  status: 'pending' | 'running' | 'pass' | 'fail' | 'skip'
  time: number | null
  error: string | null
  run: () => Promise<void>
}

function makeTest(name: string, description: string, run: () => Promise<void>): TestItem {
  return { name, description, status: 'pending', time: null, error: null, run }
}

const tests = ref<TestItem[]>([
  // 1. User Signup
  makeTest('User Signup', 'POST /api/users/login — New user, isNewUser=true', async () => {
    const res = await $fetch<any>(`${apiBase}/api/users/login`, {
      method: 'POST',
      body: { email: ctx.testEmail, name: 'Test User' },
    })
    if (!res.token) throw new Error('No token returned')
    if (!res.user?.id) throw new Error('No user id returned')
    if (res.isNewUser !== true) throw new Error(`Expected isNewUser=true, got ${res.isNewUser}`)
    ctx.token = res.token
    ctx.userId = res.user.id
  }),

  // 2. User Login (existing)
  makeTest('User Login (existing)', 'POST /api/users/login — Same email, isNewUser=false', async () => {
    if (!ctx.userId) throw new Error('Signup test must pass first')
    const res = await $fetch<any>(`${apiBase}/api/users/login`, {
      method: 'POST',
      body: { email: ctx.testEmail },
    })
    if (!res.token) throw new Error('No token returned')
    if (res.isNewUser !== false) throw new Error(`Expected isNewUser=false, got ${res.isNewUser}`)
    ctx.token = res.token
  }),

  // 3. Get User Profile
  makeTest('Get User Profile', 'GET /api/users/:id — Returns user + scores', async () => {
    if (!ctx.userId) throw new Error('Signup test must pass first')
    const res = await $fetch<any>(`${apiBase}/api/users/${ctx.userId}`)
    if (!res.email) throw new Error('No email in user response')
    if (res.email !== ctx.testEmail) throw new Error('Email mismatch')
  }),

  // 4. Get User Scores
  makeTest('Get User Scores', 'GET /api/users/:id/scores — Returns scores array', async () => {
    if (!ctx.userId) throw new Error('Signup test must pass first')
    const res = await $fetch<any>(`${apiBase}/api/users/${ctx.userId}/scores`)
    if (!Array.isArray(res.scores)) throw new Error('Expected scores array')
    if (!('stats' in res)) throw new Error('Expected stats object')
  }),

  // 5. Save Score (authed)
  makeTest('Save Score (authed)', 'POST /api/users/:id/scores — Save with token', async () => {
    if (!ctx.token) throw new Error('Login test must pass first')
    const res = await $fetch<any>(`${apiBase}/api/users/${ctx.userId}/scores`, {
      method: 'POST',
      body: {
        score: 1234,
        level: 3,
        bags: 5,
        consoleId: '__test__console',
        idempotencyKey: ctx.idempotencyKey,
      },
      headers: { Authorization: `Bearer ${ctx.token}` },
    })
    if (!res.success) throw new Error(`Expected success=true, got ${JSON.stringify(res)}`)
  }),

  // 6. Save Score (idempotent)
  makeTest('Save Score (idempotent)', 'Same idempotencyKey — duplicate=true', async () => {
    if (!ctx.token) throw new Error('Login test must pass first')
    const res = await $fetch<any>(`${apiBase}/api/users/${ctx.userId}/scores`, {
      method: 'POST',
      body: {
        score: 1234,
        level: 3,
        bags: 5,
        consoleId: '__test__console',
        idempotencyKey: ctx.idempotencyKey,
      },
      headers: { Authorization: `Bearer ${ctx.token}` },
    })
    if (!res.duplicate) throw new Error(`Expected duplicate=true, got ${JSON.stringify(res)}`)
  }),

  // 7. Console Login
  makeTest('Console Login', 'POST /api/consoles/TEST-001/login — Set user on console', async () => {
    if (!ctx.userId) throw new Error('Signup test must pass first')
    const res = await $fetch<any>(`${apiBase}/api/consoles/TEST-001/login`, {
      method: 'POST',
      body: {
        userId: ctx.userId,
        email: ctx.testEmail,
        name: 'Test User',
      },
    })
    if (typeof res !== 'object') throw new Error('Expected object response')
  }),

  // 8. Poll Logged-In User
  makeTest('Poll Logged-In User', 'GET /api/consoles/TEST-001/logged-in-user', async () => {
    const res = await $fetch<any>(`${apiBase}/api/consoles/TEST-001/logged-in-user`)
    if (!res.user) throw new Error('No user returned from poll')
    if (res.user.userId !== ctx.userId && res.user.id !== ctx.userId) {
      throw new Error('Wrong user returned')
    }
  }),

  // 9. Clear Logged-In User
  makeTest('Clear Logged-In User', 'DELETE /api/consoles/TEST-001/logged-in-user', async () => {
    if (!ctx.token) throw new Error('Login test must pass first')
    await $fetch(`${apiBase}/api/consoles/TEST-001/logged-in-user`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ctx.token}` },
    })
    const res = await $fetch<any>(`${apiBase}/api/consoles/TEST-001/logged-in-user`)
    if (res.user) throw new Error('User not cleared')
  }),

  // 10. Create Session
  makeTest('Create Session', 'POST /api/sessions — Returns session code', async () => {
    const res = await $fetch<any>(`${apiBase}/api/sessions`, {
      method: 'POST',
      body: {
        consoleId: '__test__console',
        score: 999,
        level: 2,
        bags: 3,
      },
    })
    if (!res.code) throw new Error('No session code returned')
    ctx.sessionCode = res.code
  }),

  // 11. Get Session
  makeTest('Get Session', 'GET /api/sessions/:code — Returns session data', async () => {
    if (!ctx.sessionCode) throw new Error('Create Session must pass first')
    const res = await $fetch<any>(`${apiBase}/api/sessions/${ctx.sessionCode}`)
    if (!res.code && !res.session) throw new Error('No session data returned')
  }),

  // 12. Claim Session
  makeTest('Claim Session', 'POST /api/sessions/:code/claim — Creates/updates user', async () => {
    if (!ctx.sessionCode) throw new Error('Create Session must pass first')
    const res = await $fetch<any>(`${apiBase}/api/sessions/${ctx.sessionCode}/claim`, {
      method: 'POST',
      body: { email: ctx.testEmail, name: 'Test User' },
    })
    if (!res.token) throw new Error('No token returned from claim')
  }),

  // 13. Get Credits
  makeTest('Get Credits', 'GET /api/users/:id/credits — Returns credit info', async () => {
    if (!ctx.userId) throw new Error('Signup test must pass first')
    const res = await $fetch<any>(`${apiBase}/api/users/${ctx.userId}/credits`)
    if (typeof res !== 'object') throw new Error('Expected object response')
    if (!('freePlayUsed' in res) && !('free_play_used' in res)) {
      throw new Error('Missing freePlayUsed field')
    }
  }),

  // 14. Use Credit
  makeTest('Use Credit', 'POST /api/users/:id/use-credit — Uses free play first', async () => {
    if (!ctx.token) throw new Error('Login test must pass first')
    try {
      const res = await $fetch<any>(`${apiBase}/api/users/${ctx.userId}/use-credit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ctx.token}` },
      })
      if (typeof res !== 'object') throw new Error('Expected object response')
    } catch (e: any) {
      const status = e?.response?.status || e?.status
      // 400/402 = no credits is acceptable, means endpoint works
      if (status === 400 || status === 402) return
      throw e
    }
  }),

  // 15. Stale User → 404
  makeTest('Stale User → 404', 'POST /api/consoles/TEST-001/start-game with fake userId returns 404', async () => {
    try {
      await $fetch<any>(`${apiBase}/api/consoles/TEST-001/start-game`, {
        method: 'POST',
        body: { userId: 'usr_nonexistent_stale_user' },
      })
      throw new Error('Expected 404 but request succeeded')
    } catch (e: any) {
      const status = e?.response?.status || e?.status
      if (status === 404) return // expected
      throw e
    }
  }),

  // 16. Dev Add Credit
  makeTest('Dev Add Credit', 'POST /api/users/:id/dev-credit — Adds credit and returns updated count', async () => {
    if (!ctx.userId) throw new Error('Signup test must pass first')
    const res = await $fetch<any>(`${apiBase}/api/users/${ctx.userId}/dev-credit`, {
      method: 'POST',
    })
    if (!res.success) throw new Error(`Expected success=true, got ${JSON.stringify(res)}`)
    if (typeof res.credits !== 'number') throw new Error('Expected credits number')
    if (typeof res.availablePlays !== 'number') throw new Error('Expected availablePlays number')
  }),

  // 17. Bolt Order Token (authed)
  makeTest('Bolt Order Token', 'POST /api/payments/bolt/order-token — Returns orderToken or mock', async () => {
    if (!ctx.token) throw new Error('Login test must pass first')
    const res = await $fetch<any>(`${apiBase}/api/payments/bolt/order-token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ctx.token}` },
    })
    // Either mock mode (success+mock) or real token
    if (res.mock) {
      if (!res.success) throw new Error('Mock mode missing success=true')
      if (typeof res.credits !== 'number') throw new Error('Mock mode missing credits')
    } else {
      if (!res.orderToken) throw new Error('Missing orderToken in response')
    }
  }),

  // 18. Switch Provider (non-admin → 403)
  makeTest('Switch Provider (non-admin)', 'POST /api/admin/payments/provider — Non-admin expects 403', async () => {
    if (!ctx.token) throw new Error('Login test must pass first')
    try {
      await $fetch(`${apiBase}/api/admin/payments/provider`, {
        method: 'POST',
        body: { provider: 'bolt' },
        headers: { Authorization: `Bearer ${ctx.token}` },
      })
      throw new Error('Expected 403 but request succeeded')
    } catch (e: any) {
      const status = e?.response?.status || e?.status
      if (status === 403) return // expected — not admin
      if (e.message === 'Expected 403 but request succeeded') throw e
      throw new Error(`Expected 403, got ${status || e.message || 'unknown'}`)
    }
  }),

  // 19. Payments Config Shape
  makeTest('Payments Config Shape', 'GET /api/payments/config — activeProvider + providers object', async () => {
    const res = await $fetch<any>(`${apiBase}/api/payments/config`)
    if (!res.activeProvider) throw new Error('Missing activeProvider')
    if (!res.providers?.stripe) throw new Error('Missing providers.stripe')
    if (!res.providers?.bolt) throw new Error('Missing providers.bolt')
    if (!('configured' in res.providers.stripe)) throw new Error('Missing stripe.configured')
    if (!('configured' in res.providers.bolt)) throw new Error('Missing bolt.configured')
  }),

  // 20. Offline Queue
  makeTest('Offline Queue', 'Enqueue + dequeue via useOfflineQueue', async () => {
    const { enqueue, syncQueue } = useOfflineQueue()

    // Save current queue length
    const beforeRaw = localStorage.getItem('impactarcade_offline_queue')
    const before = beforeRaw ? JSON.parse(beforeRaw) : []

    // Enqueue a test item
    enqueue(`${apiBase}/api/users/__test__fake/scores`, 'POST', {
      score: 1,
      idempotencyKey: `__test__offline_${Date.now()}`,
    }, { Authorization: `Bearer ${ctx.token}` })

    const afterRaw = localStorage.getItem('impactarcade_offline_queue')
    const after = afterRaw ? JSON.parse(afterRaw) : []

    if (after.length <= before.length) {
      throw new Error('Enqueue did not add to queue')
    }

    // Sync should process (and drop since user is fake -> 4xx)
    await syncQueue()

    const finalRaw = localStorage.getItem('impactarcade_offline_queue')
    const final = finalRaw ? JSON.parse(finalRaw) : []

    // Should have been removed (4xx gets dropped)
    if (final.length >= after.length) {
      throw new Error('SyncQueue did not process the queued item')
    }
  }),
])

async function runTest(index: number) {
  const test = tests.value[index]
  test.status = 'running'
  test.error = null
  test.time = null
  const start = performance.now()
  try {
    await test.run()
    test.time = Math.round(performance.now() - start)
    test.status = 'pass'
  } catch (e: any) {
    test.time = Math.round(performance.now() - start)
    test.error = e.message || String(e)
    test.status = 'fail'
  }
}

async function runAll() {
  running.value = true
  // Reset shared context for fresh run
  ctx.testEmail = `__test__${Date.now()}@test.impactarcade.com`
  ctx.userId = ''
  ctx.token = ''
  ctx.sessionCode = ''
  ctx.idempotencyKey = `__test__idem_${Date.now()}`

  for (let i = 0; i < tests.value.length; i++) {
    tests.value[i].status = 'pending'
    tests.value[i].error = null
    tests.value[i].time = null
  }
  for (let i = 0; i < tests.value.length; i++) {
    await runTest(i)
  }
  running.value = false
}

async function cleanup() {
  cleaning.value = true
  cleanupMessage.value = ''
  cleanupError.value = false
  try {
    const token = localStorage.getItem('impactarcade_token')
    if (!token) {
      throw new Error('Not logged in — admin token required')
    }
    const res = await $fetch<any>(`${apiBase}/api/admin/cleanup-test-data`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const d = res.deleted || {}
    const parts = Object.entries(d)
      .filter(([, v]) => (v as number) > 0)
      .map(([k, v]) => `${k}: ${v}`)
    cleanupMessage.value = parts.length
      ? `Cleaned up: ${parts.join(', ')}`
      : 'No test data found to clean up'
  } catch (e: any) {
    cleanupError.value = true
    cleanupMessage.value = `Cleanup failed: ${e.message || String(e)}`
  } finally {
    cleaning.value = false
  }
}
</script>

<style lang="sass" scoped>
.test-card
  @apply bg-white rounded-lg p-4 transition-all
  border: 2px solid #16114F
  box-shadow: 0 3.7px 0 #16114F

  &.pass
    background: #ecfdf5

  &.fail
    background: #fef2f2

  &.running
    background: #fefce8

.status-pill
  @apply py-0.5 px-2 rounded-sm text-[0.6rem] uppercase text-navyBlue whitespace-nowrap
  font-family: 'Retro'
  border: 2px solid #16114F
  box-shadow: 0 2px 0 #16114F

  &.pass
    @apply bg-green

  &.fail
    background: #fca5a5

  &.running
    background: #fde68a

  &.pending
    @apply bg-white

.run-btn
  background: #16114F
  color: white
  border: 2px solid #16114F
  box-shadow: 0 2px 0 #16114F
  cursor: pointer

  &:hover
    transform: translateY(-1px)
    box-shadow: 0 3px 0 #16114F

  &:disabled
    opacity: 0.5
    cursor: not-allowed
</style>
