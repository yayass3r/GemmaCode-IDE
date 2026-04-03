import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient | null {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl || databaseUrl === 'file:/dev/null') {
    console.warn('[GemmaCode] No DATABASE_URL configured. Database features disabled.')
    return null
  }

  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
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
    return new Proxy(() => {}, {
      get: () => () => Promise.resolve(null),
      apply: () => Promise.resolve(null),
    })
  },
})

// Check if database is actually reachable (not just configured)
let _dbAvailable: boolean | null = null

export async function isDatabaseAvailable(): Promise<boolean> {
  // Cache the result for 30 seconds
  if (_dbAvailable !== null) return _dbAvailable

  if (!_db) {
    _dbAvailable = false
    return false
  }

  try {
    await _db.$queryRaw`SELECT 1`
    _dbAvailable = true
    // Reset cache after 30 seconds
    setTimeout(() => { _dbAvailable = null }, 30_000)
    return true
  } catch {
    _dbAvailable = false
    // Retry after 30 seconds
    setTimeout(() => { _dbAvailable = null }, 30_000)
    return false
  }
}

// Reset availability cache (call after failed operations)
export function resetDbAvailability(): void {
  _dbAvailable = null
}
