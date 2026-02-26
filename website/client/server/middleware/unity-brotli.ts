import { defineEventHandler, getRequestURL, setResponseHeaders } from 'h3'
import { readFileSync } from 'fs'
import { join } from 'path'

// Brotli-compressed Unity files — cached in memory on first request
const cache = new Map<string, Buffer>()

const UNITY_FILES: Record<string, { brFile: string; contentType: string }> = {
  '/unity/impactman/Build/impactman.data': {
    brFile: 'impactman.data.br',
    contentType: 'application/octet-stream',
  },
  '/unity/impactman/Build/impactman.framework.js': {
    brFile: 'impactman.framework.js.br',
    contentType: 'application/javascript',
  },
  '/unity/impactman/Build/impactman.wasm': {
    brFile: 'impactman.wasm.br',
    contentType: 'application/wasm',
  },
}

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const pathname = url.pathname

  const entry = UNITY_FILES[pathname]
  if (!entry) return // Not a Unity file — let Nitro handle normally

  // Serve from memory cache if available
  let data = cache.get(pathname)
  if (!data) {
    try {
      const buildDir = join(process.cwd(), 'public', 'unity', 'impactman', 'Build')
      data = readFileSync(join(buildDir, entry.brFile))
      cache.set(pathname, data)
    } catch {
      // .br file not found — fall through to default static handling
      return
    }
  }

  setResponseHeaders(event, {
    'Content-Encoding': 'br',
    'Content-Type': entry.contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
  })

  return data
})
