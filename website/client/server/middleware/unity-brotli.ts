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

  // Check Accept-Encoding — may come directly or via CDN forwarded headers
  const acceptEncoding = (
    event.node.req.headers['accept-encoding'] ||
    event.node.req.headers['x-forwarded-accept-encoding'] ||
    ''
  ) as string
  const clientSupportsBr = acceptEncoding.includes('br')

  // Default to Brotli: all modern browsers support it (Chrome 50+, 2016).
  // Only decompress if client explicitly sends Accept-Encoding WITHOUT br.
  // When Railway's CDN strips the header entirely, we default to Brotli
  // since any browser capable of running Unity WebGL supports br.
  const useBrotli = clientSupportsBr || !acceptEncoding

  // Load compressed file (shared by both paths)
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

  if (useBrotli) {
    setResponseHeader(event, 'Content-Encoding', 'br')
    setResponseHeader(event, 'Content-Type', entry.contentType)
    setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    return compressed
  }

  // Rare fallback: client explicitly doesn't support br
  let raw = rawCache.get(pathname)
  if (!raw) {
    raw = brotliDecompressSync(compressed)
    rawCache.set(pathname, raw)
  }

  setResponseHeader(event, 'Content-Type', entry.contentType)
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  return raw
})
