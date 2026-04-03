import { PrismaClient } from '@prisma/client'

/**
 * Prisma Database Client (Lazy Singleton)
 * 
 * This module provides an optional database client for GemmaCode.
 * The database is NOT required for core IDE functionality - all files
 * are stored in-memory via Zustand store.
 * 
 * Database features are available for optional persistence:
 * - Project saving/loading
 * - User authentication (future)
 * - Collaboration features (future)
 * 
 * For serverless deployment (Vercel/Netlify), use Prisma Accelerate
 * or a cloud database (PostgreSQL via Supabase/Neon/PlanetScale).
 * 
 * The client is lazily initialized to avoid build-time errors when
 * no database is configured.
 */

let _db: PrismaClient | null = null

function getPrismaClient(): PrismaClient {
  if (!_db) {
    try {
      _db = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query'] : [],
      })
    } catch (error) {
      console.warn('[GemmaCode] Database client initialization failed. Core IDE features will work without database persistence.')
      // Return a dummy-like client that won't crash the app
      _db = new PrismaClient({ datasourceUrl: 'file:/tmp/gemmacode-placeholder.db' })
    }
  }
  return _db
}

// Lazy-initialized database client
// Import only when database features are needed
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return Reflect.get(getPrismaClient(), prop)
  },
})

// Helper to check if database is available
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await getPrismaClient().$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}
