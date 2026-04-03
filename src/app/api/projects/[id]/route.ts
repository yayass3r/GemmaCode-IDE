import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authMiddleware } from '@/lib/auth'

// ─── Types ───────────────────────────────────────────────────
interface UpdateProjectBody {
  title?: string
  description?: string
  files?: string
  tags?: string[]
  coverImage?: string
  isPublished?: boolean
  isFeatured?: boolean
  isHidden?: boolean
}

// ─── GET: Get project by ID (increment views) ────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const project = await db.project.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Increment views count
    await db.project.update({
      where: { id },
      data: { views: { increment: 1 } },
    })

    return NextResponse.json({
      project: { ...project, views: project.views + 1 },
    })
  } catch (error) {
    console.error('[Project GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// ─── PUT: Update project (owner or admin only) ───────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = authMiddleware(request)
    if (auth instanceof NextResponse) return auth
    const { user } = auth

    const { id } = await params

    // Find the project
    const project = await db.project.findUnique({ where: { id } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Authorization: only owner or admin can update
    if (project.authorId !== user.userId && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: you can only update your own projects' }, { status: 403 })
    }

    const body: UpdateProjectBody = await request.json()

    // Build the update data object
    const data: Record<string, unknown> = {}
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
      }
      if (body.title.trim().length > 200) {
        return NextResponse.json({ error: 'Title must be 200 characters or less' }, { status: 400 })
      }
      data.title = body.title.trim()
    }
    if (body.description !== undefined) {
      if (typeof body.description === 'string' && body.description.length > 5000) {
        return NextResponse.json({ error: 'Description must be 5000 characters or less' }, { status: 400 })
      }
      data.description = body.description.trim()
    }
    if (body.files !== undefined) {
      data.files = typeof body.files === 'string' ? body.files : JSON.stringify(body.files)
    }
    if (body.tags !== undefined) {
      data.tags = Array.isArray(body.tags) ? JSON.stringify(body.tags) : '[]'
    }
    if (body.coverImage !== undefined) {
      data.coverImage = body.coverImage
    }
    if (body.isPublished !== undefined) {
      data.isPublished = Boolean(body.isPublished)
    }
    // Featured/Hidden can only be set by admin
    if (user.role === 'admin') {
      if (body.isFeatured !== undefined) data.isFeatured = Boolean(body.isFeatured)
      if (body.isHidden !== undefined) data.isHidden = Boolean(body.isHidden)
    }

    const updated = await db.project.update({
      where: { id },
      data,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    })

    return NextResponse.json({ project: updated })
  } catch (error) {
    console.error('[Project PUT] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// ─── DELETE: Delete project (owner or admin only) ────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = authMiddleware(request)
    if (auth instanceof NextResponse) return auth
    const { user } = auth

    const { id } = await params

    // Find the project
    const project = await db.project.findUnique({ where: { id } })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Authorization: only owner or admin can delete
    if (project.authorId !== user.userId && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: you can only delete your own projects' }, { status: 403 })
    }

    await db.project.delete({ where: { id } })

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('[Project DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
