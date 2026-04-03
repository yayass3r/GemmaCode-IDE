import { NextRequest, NextResponse } from 'next/server'
import { db, isDatabaseAvailable } from '@/lib/db'
import { comparePassword, generateToken } from '@/lib/auth'

// ─── POST /api/auth/login ────────────────────────────────────
// Authenticate a user and return a JWT token.
// Falls back to file-based auth when database is unavailable.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // ── Validation ──────────────────────────────────────────
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()

    // ── Check if database is available ──────────────────────
    const dbAvailable = await isDatabaseAvailable()

    if (dbAvailable) {
      // ── Database-backed auth ─────────────────────────────
      const user = await db.user.findUnique({
        where: { email: trimmedEmail },
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      const isPasswordValid = await comparePassword(password, user.password)

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      if (user.isBanned) {
        return NextResponse.json(
          { error: 'This account has been suspended. Please contact support.' },
          { status: 403 }
        )
      }

      // Update session info
      await db.user.update({
        where: { id: user.id },
        data: { isOnline: true, lastSeen: new Date() },
      })

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      })

      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          bio: user.bio,
        },
        token,
      })
    }

    // ── Fallback: File-based auth (when DB is unavailable) ──
    console.log('[Auth] Database unavailable, using fallback auth')

    // Pre-seeded admin credentials (fallback only)
    const FALLBACK_USERS: Record<string, { password: string; name: string; role: string }> = {
      'admin@gemmacode.com': {
        password: 'Admin@2024',
        name: 'GemmaCode Admin',
        role: 'admin',
      },
    }

    const fallbackUser = FALLBACK_USERS[trimmedEmail]

    if (!fallbackUser) {
      return NextResponse.json(
        { error: 'Invalid email or password. Database is currently unavailable — only admin login works.' },
        { status: 401 }
      )
    }

    if (password !== fallbackUser.password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const token = generateToken({
      userId: `fallback-${trimmedEmail}`,
      email: trimmedEmail,
      role: fallbackUser.role,
    })

    return NextResponse.json({
      user: {
        id: `fallback-${trimmedEmail}`,
        name: fallbackUser.name,
        email: trimmedEmail,
        role: fallbackUser.role,
        avatar: '',
        bio: '',
      },
      token,
      _fallback: true,
    })
  } catch (error) {
    console.error('[Auth] Login error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during login' },
      { status: 500 }
    )
  }
}
