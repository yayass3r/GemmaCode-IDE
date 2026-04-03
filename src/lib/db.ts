import { PrismaClient } from '@prisma/client'
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

// Enable WebSocket for Neon serverless driver in Node.js environments
if (typeof WebSocket === 'undefined') {
  // @ts-expect-error ws is a WebSocket implementation for Node.js
  globalThis.WebSocket = ws
}

// Configure Neon for serverless (only if neonConfig is available)
if (typeof neonConfig !== 'undefined' && neonConfig.webSocketConstructor !== undefined) {
  neonConfig.webSocketConstructor = ws
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient | null {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl || databaseUrl === 'file:/dev/null') {
    console.warn('[GemmaCode] No DATABASE_URL configured. Database features disabled. Core IDE works without DB.')
    return null
  }

  try {
    return new PrismaClient({
      log: ['error'],
    })
  } catch (error) {
    console.error('[GemmaCode] Database client initialization failed:', error)
    return null
  }
}

let _db: PrismaClient | null = globalForPrisma.prisma ?? createPrismaClient()

if (!globalForPrisma.prisma && _db) {
  globalForPrisma.prisma = _db
}

// Database client with graceful fallback when no DB is configured
export const db = _db ?? new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (prop === '$connect' || prop === '$disconnect' || prop === '$on') return async () => {}
    if (prop === '$queryRaw' || prop === '$executeRaw') return async () => []
    if (prop === '$transaction') return async (fn: Function) => {
      try { return await fn(_db ?? {} as any) } catch { return null }
    }
    if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined
    // Return proxy chain for model operations
    return new Proxy(() => {}, {
      get: () => () => Promise.resolve(null),
      apply: () => Promise.resolve(null),
    })
  },
})

export async function isDatabaseAvailable(): Promise<boolean> {
  if (!_db) return false
  try {
    await _db.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}
