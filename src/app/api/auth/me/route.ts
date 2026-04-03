import { NextRequest, NextResponse } from 'next/server'
import { db, isDatabaseAvailable } from '@/lib/db'
import { authMiddleware, type JwtPayload } from '@/lib/auth'

// ─── GET /api/auth/me ────────────────────────────────────────
// Return the currently authenticated user's profile.

export async function GET(request: NextRequest) {
  try {
    // ── Authenticate via JWT ───────────────────────────────
    const authResult = authMiddleware(request)

    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user: jwtUser } = authResult

    // ── Try database lookup ────────────────────────────────
    const dbAvailable = await isDatabaseAvailable()

    if (dbAvailable) {
      const dbUser = await db.user.findUnique({
        where: { id: jwtUser.userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          bio: true,
          role: true,
          isOnline: true,
          lastSeen: true,
          createdAt: true,
        },
      })

      if (dbUser) {
        return NextResponse.json({ user: dbUser })
      }
    }

    // ── Fallback: Return JWT data directly ─────────────────
    // Works when DB is unavailable (fallback auth users)
    return NextResponse.json({
      user: {
        id: jwtUser.userId,
        name: jwtUser.email.split('@')[0],
        email: jwtUser.email,
        role: jwtUser.role,
        avatar: '',
        bio: '',
        isOnline: true,
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      _fallback: true,
    })
  } catch (error) {
    console.error('[Auth] Get current user error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
