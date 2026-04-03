import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authMiddleware } from '@/lib/auth'

// ─── GET /api/auth/me ────────────────────────────────────────
// Return the currently authenticated user's profile.

export async function GET(request: NextRequest) {
  try {
    // ── Authenticate ────────────────────────────────────────
    const authResult = authMiddleware(request)

    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { user } = authResult

    // ── Fetch user from DB ──────────────────────────────────
    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
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

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user: dbUser })
  } catch (error) {
    console.error('[Auth] Get current user error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
