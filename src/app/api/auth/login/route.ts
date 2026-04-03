import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparePassword, generateToken } from '@/lib/auth'

// ─── POST /api/auth/login ────────────────────────────────────
// Authenticate a user and return a JWT token.

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

    // ── Find user ───────────────────────────────────────────
    const user = await db.user.findUnique({
      where: { email: trimmedEmail },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // ── Compare password ────────────────────────────────────
    const isPasswordValid = await comparePassword(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // ── Check if user is banned ─────────────────────────────
    if (user.isBanned) {
      return NextResponse.json(
        { error: 'This account has been suspended. Please contact support.' },
        { status: 403 }
      )
    }

    // ── Update session info ─────────────────────────────────
    await db.user.update({
      where: { id: user.id },
      data: {
        isOnline: true,
        lastSeen: new Date(),
      },
    })

    // ── Generate token ──────────────────────────────────────
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // ── Response ────────────────────────────────────────────
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
  } catch (error) {
    console.error('[Auth] Login error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during login' },
      { status: 500 }
    )
  }
}
