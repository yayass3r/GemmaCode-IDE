import { NextRequest, NextResponse } from 'next/server'
import { db, isDatabaseAvailable } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

// ─── POST /api/setup ────────────────────────────────────────
// Initialize database tables and seed admin account.
// This endpoint is idempotent — safe to call multiple times.

export async function POST(request: NextRequest) {
  try {
    const dbAvailable = await isDatabaseAvailable()

    if (!dbAvailable) {
      return NextResponse.json(
        { error: 'Database not available. Check DATABASE_URL.' },
        { status: 503 }
      )
    }

    const results: { step: string; status: string; detail?: string }[] = []

    // ── Step 1: Create tables using raw SQL ────────────────
    try {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "avatar" TEXT NOT NULL DEFAULT '',
          "bio" TEXT NOT NULL DEFAULT '',
          "role" TEXT NOT NULL DEFAULT 'user',
          "isBanned" BOOLEAN NOT NULL DEFAULT false,
          "isOnline" BOOLEAN NOT NULL DEFAULT false,
          "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `)
      await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`)

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Project" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "title" TEXT NOT NULL,
          "description" TEXT NOT NULL DEFAULT '',
          "files" TEXT NOT NULL,
          "coverImage" TEXT NOT NULL DEFAULT '',
          "isPublished" BOOLEAN NOT NULL DEFAULT false,
          "isFeatured" BOOLEAN NOT NULL DEFAULT false,
          "isHidden" BOOLEAN NOT NULL DEFAULT false,
          "stars" INTEGER NOT NULL DEFAULT 0,
          "views" INTEGER NOT NULL DEFAULT 0,
          "forks" INTEGER NOT NULL DEFAULT 0,
          "tags" TEXT NOT NULL DEFAULT '[]',
          "authorId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Project_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `)

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Ad" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "title" TEXT NOT NULL,
          "type" TEXT NOT NULL DEFAULT 'custom',
          "code" TEXT NOT NULL DEFAULT '',
          "position" TEXT NOT NULL DEFAULT 'header',
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "priority" INTEGER NOT NULL DEFAULT 0,
          "Impressions" INTEGER NOT NULL DEFAULT 0,
          "clicks" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `)

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "UserSetting" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "key" TEXT NOT NULL,
          "value" TEXT NOT NULL DEFAULT '',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "UserSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `)
      await db.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "UserSetting_userId_key_key" ON "UserSetting"("userId", "key");`)

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Deployment" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "provider" TEXT NOT NULL,
          "url" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'deploying',
          "siteId" TEXT,
          "filesCount" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Deployment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `)

      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Notification" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "title" TEXT NOT NULL,
          "message" TEXT NOT NULL,
          "type" TEXT NOT NULL DEFAULT 'info',
          "userId" TEXT,
          "isRead" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `)

      results.push({ step: 'create_tables', status: 'success', detail: 'All 6 tables created/verified' })
    } catch (tableError) {
      const msg = tableError instanceof Error ? tableError.message : 'Unknown error'
      results.push({ step: 'create_tables', status: 'error', detail: msg })
      console.error('[Setup] Table creation error:', tableError)
    }

    // ── Step 2: Seed admin account ─────────────────────────
    try {
      const existingAdmin = await db.user.findUnique({
        where: { email: 'admin@gemmacode.com' },
      })

      if (existingAdmin) {
        results.push({ step: 'seed_admin', status: 'skipped', detail: 'Admin account already exists' })
      } else {
        const hashedPassword = await hashPassword('Admin@2024')
        await db.user.create({
          data: {
            name: 'GemmaCode Admin',
            email: 'admin@gemmacode.com',
            password: hashedPassword,
            role: 'admin',
            avatar: '',
            bio: 'System Admin — GemmaCode IDE',
          },
        })
        results.push({ step: 'seed_admin', status: 'success', detail: 'Admin created: admin@gemmacode.com' })
      }
    } catch (adminError) {
      const msg = adminError instanceof Error ? adminError.message : 'Unknown error'
      results.push({ step: 'seed_admin', status: 'error', detail: msg })
      console.error('[Setup] Admin seed error:', adminError)
    }

    // ── Step 3: Verify ─────────────────────────────────────
    let userCount = 0
    try {
      userCount = await db.user.count()
      results.push({ step: 'verify', status: 'success', detail: `${userCount} user(s) in database` })
    } catch {
      results.push({ step: 'verify', status: 'error', detail: 'Could not count users' })
    }

    const allSuccess = results.every(r => r.status === 'success' || r.status === 'skipped')

    return NextResponse.json({
      success: allSuccess,
      results,
      userCount,
    })
  } catch (error) {
    console.error('[Setup] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Setup failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to /api/setup to initialize the database',
  })
}
