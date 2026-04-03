import { NextRequest, NextResponse } from 'next/server'
import { db, isDatabaseAvailable } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'

// ─── POST /api/auth/register ─────────────────────────────────
// Register a new user account.
// Falls back to JWT-only registration when database is unavailable.

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    // ── Validation ──────────────────────────────────────────
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters long' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()
    const trimmedName = name.trim()

    // ── Check if database is available ──────────────────────
    const dbAvailable = await isDatabaseAvailable()

    if (dbAvailable) {
      // ── Database-backed registration ─────────────────────
      const existingUser = await db.user.findUnique({
        where: { email: trimmedEmail },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        )
      }

      const hashedPassword = await hashPassword(password)

      const user = await db.user.create({
        data: {
          name: trimmedName,
          email: trimmedEmail,
          password: hashedPassword,
          role: 'user',
        },
      })

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      })

      return NextResponse.json(
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
        },
        { status: 201 }
      )
    }

    // ── Fallback: JWT-only registration (no DB) ─────────────
    console.log('[Auth] Database unavailable, using fallback registration')

    const userId = `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const token = generateToken({
      userId,
      email: trimmedEmail,
      role: 'user',
    })

    return NextResponse.json(
      {
        user: {
          id: userId,
          name: trimmedName,
          email: trimmedEmail,
          role: 'user',
        },
        token,
        _fallback: true,
        _warning: 'Database is unavailable. Account is session-only and will not persist.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Auth] Registration error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration' },
      { status: 500 }
    )
  }
}
