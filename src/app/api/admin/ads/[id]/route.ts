import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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
interface UpdateAdBody {
  title?: string
  type?: string
  code?: string
  position?: string
  isActive?: boolean
  priority?: number
}

// ─── PUT: Update ad (admin only) ─────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = adminGuard(request)
    if (auth instanceof NextResponse) return auth

    const { id } = await params

    // Check ad exists
    const existing = await db.ad.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    const body: UpdateAdBody = await request.json()

    const data: Record<string, unknown> = {}
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
      }
      data.title = body.title.trim()
    }
    if (body.type !== undefined) {
      const validTypes = ['adsense', 'admob', 'custom']
      if (!validTypes.includes(body.type)) {
        return NextResponse.json({ error: `Type must be one of: ${validTypes.join(', ')}` }, { status: 400 })
      }
      data.type = body.type
    }
    if (body.code !== undefined) {
      data.code = body.code
    }
    if (body.position !== undefined) {
      const validPositions = ['header', 'sidebar', 'footer', 'inline']
      if (!validPositions.includes(body.position)) {
        return NextResponse.json({ error: `Position must be one of: ${validPositions.join(', ')}` }, { status: 400 })
      }
      data.position = body.position
    }
    if (body.isActive !== undefined) {
      data.isActive = Boolean(body.isActive)
    }
    if (body.priority !== undefined) {
      if (typeof body.priority !== 'number' || body.priority < 0) {
        return NextResponse.json({ error: 'Priority must be a non-negative number' }, { status: 400 })
      }
      data.priority = Math.round(body.priority)
    }

    const ad = await db.ad.update({
      where: { id },
      data,
    })

    return NextResponse.json({ ad })
  } catch (error) {
    console.error('[Admin Ad PUT] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update ad' },
      { status: 500 }
    )
  }
}

// ─── DELETE: Delete ad (admin only) ─────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = adminGuard(request)
    if (auth instanceof NextResponse) return auth

    const { id } = await params

    const existing = await db.ad.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    await db.ad.delete({ where: { id } })

    return NextResponse.json({ message: 'Ad deleted successfully' })
  } catch (error) {
    console.error('[Admin Ad DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete ad' },
      { status: 500 }
    )
  }
}
