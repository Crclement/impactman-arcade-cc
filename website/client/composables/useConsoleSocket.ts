import { useGameStore } from '~~/store/game'

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
const listeners = new Map<string, Set<(data: any) => void>>()

export function useConsoleSocket() {
  const config = useRuntimeConfig()
  const store = useGameStore()

  const connected = ref(false)

  function getWsUrl() {
    const apiBase = config.public.apiBase || 'http://localhost:3001'
    return apiBase.replace(/^http/, 'ws')
  }

  function connect(consoleId: string) {
    if (ws && ws.readyState === WebSocket.OPEN) return

    const url = getWsUrl()
    ws = new WebSocket(url)

    ws.onopen = () => {
      connected.value = true
      // Register as this console
      ws!.send(JSON.stringify({ type: 'register', consoleId }))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        // Handle built-in messages
        if (data.type === 'userLoggedIn' && data.user) {
          store.loggedInUser = data.user
        }

        if (data.type === 'userLoggedOut') {
          store.loggedInUser = null
        }

        // Notify listeners
        const typeListeners = listeners.get(data.type)
        if (typeListeners) {
          typeListeners.forEach(fn => fn(data))
        }

        // Also notify wildcard listeners
        const allListeners = listeners.get('*')
        if (allListeners) {
          allListeners.forEach(fn => fn(data))
        }
      } catch (e) {
      }
    }

    ws.onclose = () => {
      connected.value = false
      reconnectTimer = setTimeout(() => connect(consoleId), 3000)
    }

    ws.onerror = (err) => {
    }
  }

  function send(message: any) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  function on(type: string, callback: (data: any) => void) {
    if (!listeners.has(type)) {
      listeners.set(type, new Set())
    }
    listeners.get(type)!.add(callback)

    // Return cleanup function
    return () => {
      listeners.get(type)?.delete(callback)
    }
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    if (ws) {
      ws.onclose = null // Prevent reconnect
      ws.close()
      ws = null
    }
    connected.value = false
  }

  return { connected, connect, send, on, disconnect }
}
