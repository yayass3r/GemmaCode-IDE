import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authMiddleware } from '@/lib/auth'

// ─── Types ───────────────────────────────────────────────────
interface CreateProjectBody {
  title: string
  description?: string
  files?: string
  tags?: string[]
  coverImage?: string
  isPublished?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Parse pagination params with safe defaults.
 */
function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

// ─── GET: List published projects (public) ───────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = parsePagination(searchParams)
    const search = searchParams.get('search')?.trim() || ''

    const where: Record<string, unknown> = { isPublished: true, isHidden: false }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
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
    console.error('[Projects GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// ─── POST: Create new project (protected) ────────────────────
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = authMiddleware(request)
    if (auth instanceof NextResponse) return auth
    const { user } = auth

    // Check if user is banned
    const dbUser = await db.user.findUnique({ where: { id: user.userId } })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (dbUser.isBanned) {
      return NextResponse.json({ error: 'Your account has been suspended' }, { status: 403 })
    }

    const body: CreateProjectBody = await request.json()
    const { title, description = '', files = '[]', tags = [], coverImage = '', isPublished = false } = body

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (title.trim().length > 200) {
      return NextResponse.json({ error: 'Title must be 200 characters or less' }, { status: 400 })
    }
    if (typeof description === 'string' && description.length > 5000) {
      return NextResponse.json({ error: 'Description must be 5000 characters or less' }, { status: 400 })
    }

    // Ensure files is stored as JSON string
    const filesJson = typeof files === 'string' ? files : JSON.stringify(files)
    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : '[]'

    const project = await db.project.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        files: filesJson,
        tags: tagsJson,
        coverImage,
        isPublished,
        authorId: user.userId,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('[Projects POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
