<template>
  <div>
    <!-- Controls -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="font-retro text-navyBlue text-lg uppercase">System Tests</h2>
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

const tests = ref<TestItem[]>([
  makeTest('Health Check', 'GET /health — API running, DB connected', async () => {
    const res = await $fetch<any>(`${apiBase}/health`)
    if (res.status !== 'ok') throw new Error(`Expected status ok, got ${res.status}`)
    if (res.db !== 'connected') throw new Error(`DB not connected: ${res.db}`)
  }),

  makeTest('Get Consoles', 'GET /api/consoles — Returns array', async () => {
    const res = await $fetch<any>(`${apiBase}/api/consoles`)
    if (!Array.isArray(res)) throw new Error('Expected array response')
  }),

  makeTest('Get Stats', 'GET /api/stats — Returns fleet summary', async () => {
    const res = await $fetch<any>(`${apiBase}/api/stats`)
    if (typeof res !== 'object' || res === null) throw new Error('Expected object response')
    if (!('online' in res)) throw new Error('Missing online field')
  }),

  makeTest('Get Leaderboard', 'GET /api/leaderboard — Returns array', async () => {
    const res = await $fetch<any>(`${apiBase}/api/leaderboard`)
    if (!Array.isArray(res)) throw new Error('Expected array response')
  }),

  makeTest('Payments Config', 'GET /api/payments/config — Returns activeProvider + providers', async () => {
    const res = await $fetch<any>(`${apiBase}/api/payments/config`)
    if (typeof res !== 'object' || res === null) throw new Error('Expected object response')
    if (!res.activeProvider) throw new Error('Missing activeProvider')
    if (!['stripe', 'bolt'].includes(res.activeProvider)) throw new Error(`Invalid activeProvider: ${res.activeProvider}`)
    if (!res.providers) throw new Error('Missing providers object')
    if (!('stripe' in res.providers)) throw new Error('Missing providers.stripe')
    if (!('bolt' in res.providers)) throw new Error('Missing providers.bolt')
    if (!('environment' in res)) throw new Error('Missing environment field')
  }),

  makeTest('Bolt Order Token (no auth)', 'POST /api/payments/bolt/order-token — Expects 401', async () => {
    try {
      await $fetch(`${apiBase}/api/payments/bolt/order-token`, {
        method: 'POST',
      })
      throw new Error('Expected 401 but request succeeded')
    } catch (e: any) {
      const status = e?.response?.status || e?.status || e?.statusCode
      if (status === 401) return // pass
      if (e.message === 'Expected 401 but request succeeded') throw e
      throw new Error(`Expected 401, got ${status || e.message || 'unknown'}`)
    }
  }),

  makeTest('Admin: Switch Provider (no auth)', 'POST /api/admin/payments/provider — Expects 401', async () => {
    try {
      await $fetch(`${apiBase}/api/admin/payments/provider`, {
        method: 'POST',
        body: { provider: 'stripe' },
      })
      throw new Error('Expected 401 but request succeeded')
    } catch (e: any) {
      const status = e?.response?.status || e?.status || e?.statusCode
      if (status === 401) return // pass
      if (e.message === 'Expected 401 but request succeeded') throw e
      throw new Error(`Expected 401, got ${status || e.message || 'unknown'}`)
    }
  }),

  makeTest('Auth: Reject No Token', 'POST /api/users/nobody/scores — Expects 401', async () => {
    try {
      await $fetch(`${apiBase}/api/users/nobody/scores`, {
        method: 'POST',
        body: { score: 100 },
      })
      throw new Error('Expected 401 but request succeeded')
    } catch (e: any) {
      const status = e?.response?.status || e?.status || e?.statusCode
      if (status === 401) return // pass
      if (e.message === 'Expected 401 but request succeeded') throw e
      throw new Error(`Expected 401, got ${status || e.message || 'unknown'}`)
    }
  }),

  makeTest('Auth: Reject Bad Token', 'POST /api/users/nobody/scores — Bad token expects 401', async () => {
    try {
      await $fetch(`${apiBase}/api/users/nobody/scores`, {
        method: 'POST',
        body: { score: 100 },
        headers: { Authorization: 'Bearer invalidtoken123' },
      })
      throw new Error('Expected 401 but request succeeded')
    } catch (e: any) {
      const status = e?.response?.status || e?.status || e?.statusCode
      if (status === 401) return // pass
      if (e.message === 'Expected 401 but request succeeded') throw e
      throw new Error(`Expected 401, got ${status || e.message || 'unknown'}`)
    }
  }),

  makeTest('WebSocket Connect', 'WS connect + register — Expects ack', async () => {
    const wsUrl = apiBase.replace(/^http/, 'ws')
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close()
        reject(new Error('WebSocket timeout (5s)'))
      }, 5000)

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'register', consoleId: '__test__ws' }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'registered') {
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

  makeTest('Console Reset', 'POST /api/consoles/TEST-001/reset — Clears stale login', async () => {
    const res = await $fetch<any>(`${apiBase}/api/consoles/TEST-001/reset`, {
      method: 'POST',
    })
    if (!res.success) throw new Error('Expected success=true')
    // Verify login was cleared
    const login = await $fetch<any>(`${apiBase}/api/consoles/TEST-001/logged-in-user`)
    if (login.user) throw new Error('Expected null user after reset')
  }),

  makeTest('Console Total Bags', 'GET /api/consoles/IMP-001/total-bags — Returns totalBags number', async () => {
    const res = await $fetch<any>(`${apiBase}/api/consoles/IMP-001/total-bags`)
    if (typeof res.totalBags !== 'number') throw new Error(`Expected number, got ${typeof res.totalBags}`)
  }),

  makeTest('Console Status POST', 'POST /api/status — Mock heartbeat', async () => {
    const res = await $fetch<any>(`${apiBase}/api/status`, {
      method: 'POST',
      body: {
        consoleId: '__test__console',
        name: 'Test Console',
        temperature: 42,
        cpuUsage: 25,
        memoryUsage: 50,
        version: '0.0.0-test',
      },
    })
    if (!res || typeof res !== 'object') throw new Error('Expected object response')
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
