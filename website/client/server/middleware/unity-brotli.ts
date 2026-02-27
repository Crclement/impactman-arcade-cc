import { defineEventHandler, setResponseHeader } from 'h3'
import { readFileSync, existsSync } from 'fs'
import { join, basename } from 'path'
import { brotliDecompressSync } from 'zlib'

// Caches: compressed (.br), uncompressed, and decompressed versions
const brCache = new Map<string, Buffer>()
const rawCache = new Map<string, Buffer>()

const UNITY_FILES: Record<string, { brFile: string; rawFile: string; contentType: string }> = {
  '/unity/impactman/Build/impactman.data': {
    brFile: 'impactman.data.br',
    rawFile: 'impactman.data',
    contentType: 'application/octet-stream',
  },
  '/unity/impactman/Build/impactman.framework.js': {
    brFile: 'impactman.framework.js.br',
    rawFile: 'impactman.framework.js',
    contentType: 'application/javascript',
  },
  '/unity/impactman/Build/impactman.wasm': {
    brFile: 'impactman.wasm.br',
    rawFile: 'impactman.wasm',
    contentType: 'application/wasm',
  },
}

export default defineEventHandler((event) => {
  const pathname = event.node.req.url?.split('?')[0] || ''

  const entry = UNITY_FILES[pathname]
  if (!entry) return // Not a Unity file — let Nitro handle normally

  const buildDir = join(process.cwd(), 'public', 'unity', 'impactman', 'Build')
  const brPath = join(buildDir, entry.brFile)
  const rawPath = join(buildDir, entry.rawFile)

  // Try Brotli-compressed files first
  let compressed = brCache.get(pathname)
  if (!compressed) {
    try {
      compressed = readFileSync(brPath)
      brCache.set(pathname, compressed)
    } catch {
      // No .br file — fall through to uncompressed below
    }
  }

  if (compressed) {
    const acceptEncoding = (
      event.node.req.headers['accept-encoding'] ||
      event.node.req.headers['x-forwarded-accept-encoding'] ||
      ''
    ) as string
    const clientSupportsBr = acceptEncoding.includes('br')
    const useBrotli = clientSupportsBr || !acceptEncoding

    if (useBrotli) {
      setResponseHeader(event, 'Content-Encoding', 'br')
      setResponseHeader(event, 'Content-Type', entry.contentType)
      setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
      return compressed
    }

    // Client doesn't support br — decompress and serve
    let decompressed = rawCache.get(pathname)
    if (!decompressed) {
      decompressed = brotliDecompressSync(compressed)
      rawCache.set(pathname, decompressed)
    }
    setResponseHeader(event, 'Content-Type', entry.contentType)
    setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    return decompressed
  }

  // No .br files — serve uncompressed files directly
  let raw = rawCache.get(pathname)
  if (!raw) {
    try {
      raw = readFileSync(rawPath)
      rawCache.set(pathname, raw)
    } catch {
      return // Neither .br nor raw file exists — let Nitro 404
    }
  }

  setResponseHeader(event, 'Content-Type', entry.contentType)
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  return raw
})
