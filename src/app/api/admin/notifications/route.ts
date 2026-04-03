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
interface CreateNotificationBody {
  title: string
  message: string
  type?: string
  userId?: string | null
}

// ─── GET: List all notifications (admin only) ───────────────
export async function GET(_request: NextRequest) {
  try {
    const auth = adminGuard(_request)
    if (auth instanceof NextResponse) return auth

    const notifications = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Attach user info for targeted notifications (userId is not a foreign key relation)
    const userIds = [...new Set(notifications.map((n) => n.userId).filter(Boolean))] as string[]
    let userMap: Record<string, { id: string; name: string; email: string }> = {}
    if (userIds.length > 0) {
      const users = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      })
      userMap = Object.fromEntries(users.map((u) => [u.id, u]))
    }

    const notificationsWithUser = notifications.map((n) => ({
      ...n,
      user: n.userId ? userMap[n.userId] || null : null,
    }))

    return NextResponse.json({ notifications: notificationsWithUser })
  } catch (error) {
    console.error('[Admin Notifications GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// ─── POST: Create notification (admin only) ─────────────────
export async function POST(request: NextRequest) {
  try {
    const auth = adminGuard(request)
    if (auth instanceof NextResponse) return auth

    const body: CreateNotificationBody = await request.json()
    const { title, message, type = 'info', userId = null } = body

    // Validate
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const validTypes = ['info', 'warning', 'success', 'error']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: `Type must be one of: ${validTypes.join(', ')}` }, { status: 400 })
    }

    // If userId is provided, verify user exists
    if (userId) {
      const user = await db.user.findUnique({ where: { id: userId } })
      if (!user) {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
      }
    }

    const notification = await db.notification.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        type,
        userId,
      },
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error('[Admin Notifications POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

// ─── DELETE: Delete notification (admin only) ───────────────
export async function DELETE(request: NextRequest) {
  try {
    const auth = adminGuard(request)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Notification id is required' }, { status: 400 })
    }

    const existing = await db.notification.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    await db.notification.delete({ where: { id } })

    return NextResponse.json({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('[Admin Notifications DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    )
  }
}
