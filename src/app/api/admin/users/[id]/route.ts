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

// ─── GET: User details with project stats (admin only) ──────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = adminGuard(_request)
    if (auth instanceof NextResponse) return auth

    const { id } = await params

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        role: true,
        isBanned: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { projects: true },
        },
        projects: {
          select: {
            id: true,
            title: true,
            isPublished: true,
            isFeatured: true,
            views: true,
            stars: true,
            forks: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate project stats
    const projects = user.projects
    const projectStats = {
      total: user._count.projects,
      published: projects.filter((p) => p.isPublished).length,
      featured: projects.filter((p) => p.isFeatured).length,
      totalViews: projects.reduce((sum, p) => sum + p.views, 0),
      totalStars: projects.reduce((sum, p) => sum + p.stars, 0),
      totalForks: projects.reduce((sum, p) => sum + p.forks, 0),
    }

    return NextResponse.json({
      user: {
        ...user,
        projectStats,
      },
    })
  } catch (error) {
    console.error('[Admin User GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}

// ─── DELETE: Delete user and all their projects (admin only) ─
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = adminGuard(request)
    if (auth instanceof NextResponse) return auth

    const { id } = await params

    // Prevent admin from deleting themselves
    if (id === auth.user.userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id },
      select: { id: true, name: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete user (cascade will delete projects, settings, etc.)
    await db.user.delete({ where: { id } })

    return NextResponse.json({
      message: `User "${user.name}" and all associated data deleted successfully`,
    })
  } catch (error) {
    console.error('[Admin User DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
