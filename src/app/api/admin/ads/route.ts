import { NextRequest, NextResponse } from 'next/server'
import { db, isDatabaseAvailable } from '@/lib/db'
import { authMiddleware } from '@/lib/auth'

// ─── Admin Guard ─────────────────────────────────────────────
function adminGuard(request: NextRequest) {
  const auth = authMiddleware(request)
  if (auth instanceof NextResponse) return auth
  if (auth.user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  return auth
}

// ─── Types ───────────────────────────────────────────────────
interface CreateAdBody {
  title: string
  type?: string
  code?: string
  position?: string
  isActive?: boolean
  priority?: number
}

// ─── GET: List all ads (admin only) ─────────────────────────
export async function GET(_request: NextRequest) {
  try {
    const auth = adminGuard(_request)
    if (auth instanceof NextResponse) return auth

    const dbAvailable = await isDatabaseAvailable()
    if (!dbAvailable) {
      return NextResponse.json({ ads: [], _dbOffline: true })
    }

    const ads = await db.ad.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ ads })
  } catch (error) {
    console.error('[Admin Ads GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ads' },
      { status: 500 }
    )
  }
}

// ─── POST: Create ad (admin only) ───────────────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = adminGuard(request)
    if (auth instanceof NextResponse) return auth

    const body: CreateAdBody = await request.json()
    const { title, type = 'custom', code = '', position = 'header', isActive = true, priority = 0 } = body

    // Validate
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const validTypes = ['adsense', 'admob', 'custom']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `Type must be one of: ${validTypes.join(', ')}` }, { status: 400 })
    }

    const validPositions = ['header', 'sidebar', 'footer', 'inline']
    if (!validPositions.includes(position)) {
      return NextResponse.json({ error: `Position must be one of: ${validPositions.join(', ')}` }, { status: 400 })
    }

    if (typeof priority !== 'number' || priority < 0) {
      return NextResponse.json({ error: 'Priority must be a non-negative number' }, { status: 400 })
    }

    const ad = await db.ad.create({
      data: {
        title: title.trim(),
        type,
        code,
        position,
        isActive: Boolean(isActive),
        priority: Math.round(priority),
      },
    })

    return NextResponse.json({ ad }, { status: 201 })
  } catch (error) {
    console.error('[Admin Ads POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create ad' },
      { status: 500 }
    )
  }
}
