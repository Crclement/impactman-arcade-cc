import { useGameStore } from '~~/store/game'
import { resolveApiBase } from './useApiBase'

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
const listeners = new Map<string, Set<(data: any) => void>>()

export function useConsoleSocket() {
  const store = useGameStore()

  const connected = ref(false)

  function getWsUrl() {
    return resolveApiBase().replace(/^http/, 'ws')
  }

  function connect(consoleId: string) {
    if (ws && ws.readyState === WebSocket.OPEN) return

    const url = getWsUrl()
    ws = new WebSocket(url)

    ws.onopen = () => {
      connected.value = true
      console.log(`[WS] Connected to ${url}, registering as ${consoleId}`)
      ws!.send(JSON.stringify({ type: 'register', consoleId }))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('[WS] Received:', data.type, data)

        // Handle built-in messages
        if (data.type === 'userLoggedIn' && data.user) {
          // Reset readyToPlay when a different user logs in
          if (store.loggedInUser?.id !== data.user.id) {
            store.readyToPlay = false
          }
          store.loggedInUser = data.user
        }

        if (data.type === 'userLoggedOut') {
          store.loggedInUser = null
          store.readyToPlay = false
        }

        if (data.type === 'readyToPlay') {
          // Ensure user is set immediately alongside readyToPlay
          if (data.userId && !store.loggedInUser) {
            store.loggedInUser = { id: data.userId, name: data.userName, email: '' }
          }
          store.readyToPlay = true
          console.log('[WS] readyToPlay set to true, loggedInUser:', store.loggedInUser?.name)
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
        console.error('[WS] Parse error:', e)
      }
    }

    ws.onclose = () => {
      connected.value = false
      console.log('[WS] Disconnected, reconnecting in 3s...')
      reconnectTimer = setTimeout(() => connect(consoleId), 3000)
    }

    ws.onerror = (err) => {
      console.error('[WS] Error:', err)
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
