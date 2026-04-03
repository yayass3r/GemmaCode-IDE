import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

// ─── Configuration ───────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || ''
const JWT_EXPIRY = '7d'

// In production, JWT_SECRET must be set
if (process.env.NODE_ENV === 'production' && !JWT_SECRET) {
  console.error('[SECURITY] JWT_SECRET is not set in production. Authentication will fail.')
}

// ─── Types ───────────────────────────────────────────────────
export interface JwtPayload {
  userId: string
  email: string
  role: string
}

// ─── Password Utilities (async for serverless compatibility) ──

/**
 * Hash a plain-text password using bcrypt (async).
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

/**
 * Compare a plain-text password against a bcrypt hash (async).
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ─── JWT Utilities ───────────────────────────────────────────

/**
 * Generate a signed JWT token with 7-day expiry.
 */
export function generateToken(payload: {
  userId: string
  email: string
  role: string
}): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured')
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

/**
 * Verify a JWT token and return the decoded payload.
 * Returns null if the token is invalid or expired.
 */
export function verifyToken(token: string): JwtPayload | null {
  if (!JWT_SECRET) return null
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    return decoded
  } catch {
    return null
  }
}

// ─── Middleware ──────────────────────────────────────────────

/**
 * Authentication middleware for protected API routes.
 * Extracts the Bearer token from the Authorization header,
 * verifies it, and returns the user payload.
 *
 * @returns The decoded user payload on success.
 * @returns A 401 NextResponse on failure (invalid/missing token).
 */
export function authMiddleware(
  request: NextRequest
): { user: JwtPayload } | NextResponse {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid authorization header' },
      { status: 401 }
    )
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    return NextResponse.json(
      { error: 'Missing authentication token' },
      { status: 401 }
    )
  }

  const payload = verifyToken(token)

  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }

  return { user: payload }
}
