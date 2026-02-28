import { resolveApiBase } from './useApiBase'

const QUEUE_KEY = 'impactarcade_offline_queue'
const SYNC_INTERVAL = 30000 // 30 seconds

interface QueuedRequest {
  id: string
  url: string
  method: string
  body: any
  headers: Record<string, string>
  createdAt: string
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function getQueue(): QueuedRequest[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveQueue(queue: QueuedRequest[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

/** Rewrite a stored URL's origin to match the current API base. */
function rewriteUrl(storedUrl: string, currentBase: string): string {
  try {
    const parsed = new URL(storedUrl)
    const baseParsed = new URL(currentBase)
    parsed.protocol = baseParsed.protocol
    parsed.host = baseParsed.host
    return parsed.toString()
  } catch {
    return storedUrl
  }
}

export function useOfflineQueue() {
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const queueLength = ref(getQueue().length)
  let syncTimer: ReturnType<typeof setInterval> | null = null

  function enqueue(url: string, method: string, body: any, headers: Record<string, string> = {}) {
    const queue = getQueue()

    // Generate idempotency key for score saves
    const idempotencyKey = generateId()
    if (body && !body.idempotencyKey) {
      body.idempotencyKey = idempotencyKey
    }

    queue.push({
      id: idempotencyKey,
      url,
      method,
      body,
      headers,
      createdAt: new Date().toISOString(),
    })

    saveQueue(queue)
    queueLength.value = queue.length
  }

  async function syncQueue() {
    const queue = getQueue()
    if (queue.length === 0) return

    const currentBase = resolveApiBase()
    const remaining: QueuedRequest[] = []

    for (const req of queue) {
      // Rewrite URL origin — fixes stale localhost URLs when API is on Railway/tunnel
      const url = rewriteUrl(req.url, currentBase)

      try {
        await $fetch(url, {
          method: req.method as any,
          body: req.body,
          headers: req.headers,
        })
      } catch (e: any) {
        // If it's a 409 (duplicate) or 4xx client error, don't retry
        const status = e?.response?.status || e?.status
        if (status && status >= 400 && status < 500) {
        } else {
          // Network error or 5xx — keep in queue for retry
          remaining.push(req)
        }
      }
    }

    saveQueue(remaining)
    queueLength.value = remaining.length
  }

  function startAutoSync() {
    if (!process.client) return

    // Sync when coming back online
    window.addEventListener('online', () => {
      isOnline.value = true
      syncQueue()
    })

    window.addEventListener('offline', () => {
      isOnline.value = false
    })

    // Periodic sync
    syncTimer = setInterval(() => {
      if (navigator.onLine) {
        syncQueue()
      }
    }, SYNC_INTERVAL)

    // Initial sync
    if (navigator.onLine) {
      syncQueue()
    }
  }

  function stopAutoSync() {
    if (syncTimer) {
      clearInterval(syncTimer)
      syncTimer = null
    }
  }

  return {
    isOnline: readonly(isOnline),
    queueLength: readonly(queueLength),
    enqueue,
    syncQueue,
    startAutoSync,
    stopAutoSync,
  }
}
