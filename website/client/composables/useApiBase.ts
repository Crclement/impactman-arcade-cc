/**
 * Resolves the correct API base URL for the current environment.
 *
 * Priority:
 *  1. Cloudflare tunnel (when hostname matches trycloudflare.com)
 *  2. Railway deployment (frontend *-game.up.railway.app → API *-api.up.railway.app)
 *  3. Nuxt runtime config (API_URL env var or default localhost:3001)
 */
export function resolveApiBase(): string {
  const config = useRuntimeConfig()

  if (process.client) {
    const hostname = window.location.hostname

    // Cloudflare tunnel
    if (hostname.includes('trycloudflare.com')) {
      return 'https://heavy-random-exhibits-alto.trycloudflare.com'
    }

    // Railway deployment — frontend is *-game.up.railway.app, API is *-api.up.railway.app
    if (hostname.includes('-game.up.railway.app')) {
      return `https://${hostname.replace('-game.', '-api.')}`
    }
  }

  return config.public.apiBase || 'http://localhost:3001'
}
