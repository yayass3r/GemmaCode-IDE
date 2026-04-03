import { NextRequest, NextResponse } from 'next/server'
import { db, isDatabaseAvailable } from '@/lib/db'
import { authMiddleware } from '@/lib/auth'

// ─── Admin Guard ─────────────────────────────────────────────

/**
 * Verify the authenticated user is an admin.
 * Returns user payload on success, or a 403 NextResponse.
 */
function adminGuard(request: NextRequest) {
  const auth = authMiddleware(request)
  if (auth instanceof NextResponse) return auth
  if (auth.user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  return auth
}

// ─── Types ───────────────────────────────────────────────────
interface UpdateUserBody {
  userId: string
  role?: string
  isBanned?: boolean
}

// ─── GET: List all users (admin only) ────────────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = adminGuard(request)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))
    const skip = (page - 1) * limit
    const search = searchParams.get('search')?.trim() || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }

    const dbAvailable = await isDatabaseAvailable()
    if (!dbAvailable) {
      return NextResponse.json({
        users: [],
        pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        _dbOffline: true,
      })
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, avatar: true, bio: true,
          role: true, isBanned: true, isOnline: true, lastSeen: true, createdAt: true,
          _count: { select: { projects: true } },
        },
        orderBy: { createdAt: 'desc' }, skip, take: limit,
      }),
      db.user.count({ where }),
    ])

    const usersWithStats = users.map((u) => ({ ...u, projectCount: u._count.projects }))

    return NextResponse.json({
      users: usersWithStats,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    })
  } catch (error) {
    console.error('[Admin Users GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// ─── PUT: Update user role/ban status (admin only) ───────────
export async function PUT(request: NextRequest) {
  try {
    const auth = adminGuard(request)
    if (auth instanceof NextResponse) return auth

    const body: UpdateUserBody = await request.json()
    const { userId, role, isBanned } = body

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Prevent admin from demoting themselves
    if (userId === auth.user.userId && role && role !== 'admin') {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
    }

    // Find target user
    const targetUser = await db.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (role !== undefined) {
      if (!['user', 'admin'].includes(role)) {
        return NextResponse.json({ error: 'Role must be "user" or "admin"' }, { status: 400 })
      }
      data.role = role
    }
    if (isBanned !== undefined) {
      data.isBanned = Boolean(isBanned)
    }

    const updated = await db.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isBanned: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('[Admin Users PUT] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
