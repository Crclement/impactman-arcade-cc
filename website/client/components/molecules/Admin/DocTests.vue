<template>
  <div>
    <!-- Controls -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="font-retro text-navyBlue text-lg uppercase">Doc Fact-Check</h2>
      <button
        @click="runAll"
        :disabled="running"
        class="font-retro text-xs uppercase py-2 px-4 bg-green text-navyBlue rounded-sm transition-all"
        :style="{ border: '2px solid #16114F', boxShadow: '0 3px 0 #16114F' }"
      >
        {{ running ? 'Running...' : 'Run All' }}
      </button>
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

// Documented API endpoints from README — verify each responds with expected status
const tests = ref<TestItem[]>([
  // Health & Info
  makeTest('GET /', 'README: API info + version — returns name, version, status', async () => {
    const res = await $fetch<any>(`${apiBase}/`)
    if (!res.name) throw new Error('Missing name field')
    if (!res.version) throw new Error('Missing version field')
    if (!res.status) throw new Error('Missing status field')
    if (!res.endpoints) throw new Error('Missing endpoints field')
  }),

  makeTest('GET /health', 'README: Returns {status, db, timestamp}', async () => {
    const res = await $fetch<any>(`${apiBase}/health`)
    if (!('status' in res)) throw new Error('Missing status field')
    if (!('db' in res)) throw new Error('Missing db field')
    if (!('timestamp' in res)) throw new Error('Missing timestamp field')
  }),

  // Users
  makeTest('POST /api/users/login', 'README: Returns JWT token — verify token + user + isNewUser', async () => {
    const res = await $fetch<any>(`${apiBase}/api/users/login`, {
      method: 'POST',
      body: { email: `__test__doc_${Date.now()}@test.impactarcade.com`, name: 'Doc Test' },
    })
    if (!res.token) throw new Error('Missing token — README says returns JWT')
    if (!res.user) throw new Error('Missing user object')
    if (!('isNewUser' in res)) throw new Error('Missing isNewUser field')
  }),

  makeTest('GET /api/users/:id', 'README: User profile + top 10 scores', async () => {
    // Create a test user first
    const login = await $fetch<any>(`${apiBase}/api/users/login`, {
      method: 'POST',
      body: { email: `__test__doc2_${Date.now()}@test.impactarcade.com`, name: 'Doc Test 2' },
    })
    const res = await $fetch<any>(`${apiBase}/api/users/${login.user.id}`)
    if (!res.email) throw new Error('Missing email')
    if (!('scores' in res)) throw new Error('Missing scores — README says profile + scores')
    if (!('highScore' in res)) throw new Error('Missing highScore')
  }),

  makeTest('GET /api/users/:id/scores', 'README: Full score history with stats', async () => {
    const login = await $fetch<any>(`${apiBase}/api/users/login`, {
      method: 'POST',
      body: { email: `__test__doc3_${Date.now()}@test.impactarcade.com`, name: 'Doc Test 3' },
    })
    const res = await $fetch<any>(`${apiBase}/api/users/${login.user.id}/scores`)
    if (!Array.isArray(res.scores)) throw new Error('Missing scores array')
    if (!res.stats) throw new Error('Missing stats — README says "with stats"')
  }),

  makeTest('GET /api/users/:id/credits', 'README: freePlayUsed, paidCredits, availablePlays', async () => {
    const login = await $fetch<any>(`${apiBase}/api/users/login`, {
      method: 'POST',
      body: { email: `__test__doc4_${Date.now()}@test.impactarcade.com`, name: 'Doc Test 4' },
    })
    const res = await $fetch<any>(`${apiBase}/api/users/${login.user.id}/credits`)
    if (!('freePlayUsed' in res)) throw new Error('Missing freePlayUsed')
    if (!('paidCredits' in res)) throw new Error('Missing paidCredits')
    if (!('availablePlays' in res)) throw new Error('Missing availablePlays')
  }),

  // Sessions
  makeTest('POST /api/sessions', 'README: Returns 6-char code', async () => {
    const res = await $fetch<any>(`${apiBase}/api/sessions`, {
      method: 'POST',
      body: { consoleId: '__test__doc_console', score: 100, level: 1, bags: 1 },
    })
    if (!res.code) throw new Error('Missing code')
    if (res.code.length !== 6) throw new Error(`Code length ${res.code.length}, expected 6`)
  }),

  makeTest('GET /api/sessions/:code', 'README: Returns session or 410 if expired', async () => {
    const created = await $fetch<any>(`${apiBase}/api/sessions`, {
      method: 'POST',
      body: { consoleId: '__test__doc_console2', score: 50 },
    })
    const res = await $fetch<any>(`${apiBase}/api/sessions/${created.code}`)
    if (!res.code && !res.consoleId) throw new Error('Missing session data')
  }),

  // Fleet Management
  makeTest('GET /api/consoles', 'README: All consoles with status + game stats', async () => {
    const res = await $fetch<any>(`${apiBase}/api/consoles`)
    if (!Array.isArray(res)) throw new Error('Expected array')
  }),

  makeTest('GET /api/stats', 'README: Fleet summary — online/offline/playing/totalGamesPlayed/topScore', async () => {
    const res = await $fetch<any>(`${apiBase}/api/stats`)
    const required = ['online', 'offline', 'playing', 'totalGamesPlayed', 'topScore']
    const missing = required.filter(f => !(f in res))
    if (missing.length) throw new Error(`Missing fields: ${missing.join(', ')}`)
  }),

  makeTest('GET /api/leaderboard', 'README: Global high scores, default limit 10', async () => {
    const res = await $fetch<any>(`${apiBase}/api/leaderboard`)
    if (!Array.isArray(res)) throw new Error('Expected array')
    if (res.length > 10) throw new Error(`Got ${res.length} entries, README says default limit 10`)
  }),

  // Payments
  makeTest('GET /api/payments/config', 'Returns activeProvider, environment, providers (stripe + bolt)', async () => {
    const res = await $fetch<any>(`${apiBase}/api/payments/config`)
    if (!('pricePerPlay' in res)) throw new Error('Missing pricePerPlay')
    if (!('currency' in res)) throw new Error('Missing currency')
    if (!('activeProvider' in res)) throw new Error('Missing activeProvider')
    if (!('environment' in res)) throw new Error('Missing environment')
    if (!res.providers) throw new Error('Missing providers object')
    if (!('stripe' in res.providers)) throw new Error('Missing providers.stripe')
    if (!('bolt' in res.providers)) throw new Error('Missing providers.bolt')
    if (!('configured' in res.providers.stripe)) throw new Error('Missing providers.stripe.configured')
    if (!('configured' in res.providers.bolt)) throw new Error('Missing providers.bolt.configured')
    if (!('cdnUrl' in res.providers.bolt)) throw new Error('Missing providers.bolt.cdnUrl')
  }),

  makeTest('POST /api/payments/bolt/order-token', 'Returns orderToken or mock — requires auth', async () => {
    const login = await $fetch<any>(`${apiBase}/api/users/login`, {
      method: 'POST',
      body: { email: `__test__doc_bolt_${Date.now()}@test.impactarcade.com`, name: 'Bolt Test' },
    })
    const res = await $fetch<any>(`${apiBase}/api/payments/bolt/order-token`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${login.token}` },
    })
    if (res.mock) {
      if (!res.success) throw new Error('Mock mode missing success')
    } else {
      if (!res.orderToken) throw new Error('Missing orderToken')
    }
  }),

  makeTest('POST /api/admin/payments/provider (no auth)', 'Admin-only — expects 401 without token', async () => {
    try {
      await $fetch(`${apiBase}/api/admin/payments/provider`, {
        method: 'POST',
        body: { provider: 'stripe' },
      })
      throw new Error('Expected 401 but succeeded')
    } catch (e: any) {
      const status = e?.response?.status || e?.status
      if (status === 401) return
      if (e.message === 'Expected 401 but succeeded') throw e
      throw new Error(`Expected 401, got ${status}`)
    }
  }),

  // Admin
  makeTest('GET /api/admin/verify (no auth)', 'README: Admin-only — expects 401 without token', async () => {
    try {
      await $fetch(`${apiBase}/api/admin/verify`)
      throw new Error('Expected 401 but succeeded')
    } catch (e: any) {
      const status = e?.response?.status || e?.status
      if (status === 401) return
      if (e.message === 'Expected 401 but succeeded') throw e
      throw new Error(`Expected 401, got ${status}`)
    }
  }),

  // WebSocket protocol
  makeTest('WS register → registered', 'README: Console sends register, receives registered ack', async () => {
    const wsUrl = apiBase.replace(/^http/, 'ws')
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close()
        reject(new Error('No registered ack within 5s'))
      }, 5000)

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'register', consoleId: '__test__doc_ws' }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'registered') {
            if (!data.consoleId) {
              clearTimeout(timeout)
              ws.close()
              reject(new Error('registered ack missing consoleId'))
              return
            }
            clearTimeout(timeout)
            ws.close()
            resolve()
          }
        } catch {}
      }

      ws.onerror = () => {
        clearTimeout(timeout)
        reject(new Error('WebSocket connection failed'))
      }
    })
  }),

  // Dev credit
  makeTest('POST /api/users/:id/dev-credit', 'Adds a dev credit — returns success, credits, availablePlays', async () => {
    const login = await $fetch<any>(`${apiBase}/api/users/login`, {
      method: 'POST',
      body: { email: `__test__doc_devcredit_${Date.now()}@test.impactarcade.com`, name: 'Dev Credit Test' },
    })
    const res = await $fetch<any>(`${apiBase}/api/users/${login.user.id}/dev-credit`, {
      method: 'POST',
    })
    if (!res.success) throw new Error('Missing success')
    if (typeof res.credits !== 'number') throw new Error('Missing credits (number)')
    if (typeof res.availablePlays !== 'number') throw new Error('Missing availablePlays (number)')
    // New user: free play (1) + 1 dev credit = 2 available plays
    if (res.availablePlays < 2) throw new Error(`Expected at least 2 availablePlays, got ${res.availablePlays}`)
  }),

  // Response shape checks for documented fields
  makeTest('Score Save Response', 'README: POST scores returns success + user + scoreEntry', async () => {
    const login = await $fetch<any>(`${apiBase}/api/users/login`, {
      method: 'POST',
      body: { email: `__test__doc5_${Date.now()}@test.impactarcade.com`, name: 'Doc Test 5' },
    })
    const res = await $fetch<any>(`${apiBase}/api/users/${login.user.id}/scores`, {
      method: 'POST',
      body: { score: 42, level: 1, bags: 1, consoleId: '__test__doc_console3', idempotencyKey: `__test__doc_${Date.now()}` },
      headers: { Authorization: `Bearer ${login.token}` },
    })
    if (!res.success) throw new Error('Missing success')
    if (!res.user) throw new Error('Missing user in response')
    if (!res.scoreEntry) throw new Error('Missing scoreEntry in response')
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
  for (let i = 0; i < tests.value.length; i++) {
    await runTest(i)
  }
  running.value = false
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
