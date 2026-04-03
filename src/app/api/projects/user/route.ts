import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authMiddleware } from '@/lib/auth'

// ─── GET: Get current user's projects (protected) ────────────
export async function GET(request: NextRequest) {
  try {
    const auth = authMiddleware(request)
    if (auth instanceof NextResponse) return auth
    const { user } = auth

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))
    const skip = (page - 1) * limit

    // Optional filter: only published, only unpublished, or all
    const publishedFilter = searchParams.get('published')
    const where: Record<string, unknown> = { authorId: user.userId }

    if (publishedFilter === 'true') {
      where.isPublished = true
    } else if (publishedFilter === 'false') {
      where.isPublished = false
    }

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.project.count({ where }),
    ])

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error('[User Projects GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch your projects' },
      { status: 500 }
    )
  }
}
