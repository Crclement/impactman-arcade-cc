import { defineEventHandler, setResponseHeader } from 'h3'
import { readFileSync } from 'fs'
import { join } from 'path'
import { brotliDecompressSync } from 'zlib'

// Caches: compressed (.br) and decompressed versions
const brCache = new Map<string, Buffer>()
const rawCache = new Map<string, Buffer>()

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
  const pathname = event.node.req.url?.split('?')[0] || ''

  const entry = UNITY_FILES[pathname]
  if (!entry) return // Not a Unity file — let Nitro handle normally

  const acceptEncoding = (event.node.req.headers['accept-encoding'] || '') as string
  const clientSupportsBr = acceptEncoding.includes('br')

  if (clientSupportsBr) {
    // Serve Brotli-compressed version
    let data = brCache.get(pathname)
    if (!data) {
      try {
        const buildDir = join(process.cwd(), 'public', 'unity', 'impactman', 'Build')
        data = readFileSync(join(buildDir, entry.brFile))
        brCache.set(pathname, data)
      } catch {
        return
      }
    }

    setResponseHeader(event, 'Content-Encoding', 'br')
    setResponseHeader(event, 'Content-Type', entry.contentType)
    setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    return data
  }

  // Client doesn't support Brotli — decompress server-side
  let raw = rawCache.get(pathname)
  if (!raw) {
    let compressed = brCache.get(pathname)
    if (!compressed) {
      try {
        const buildDir = join(process.cwd(), 'public', 'unity', 'impactman', 'Build')
        compressed = readFileSync(join(buildDir, entry.brFile))
        brCache.set(pathname, compressed)
      } catch {
        return
      }
    }
    raw = brotliDecompressSync(compressed)
    rawCache.set(pathname, raw)
  }

  setResponseHeader(event, 'Content-Type', entry.contentType)
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  return raw
})
