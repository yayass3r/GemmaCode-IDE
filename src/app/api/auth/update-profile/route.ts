import { NextRequest, NextResponse } from 'next/server'
import { db, isDatabaseAvailable } from '@/lib/db'
import { authMiddleware } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const authResult = authMiddleware(request)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const body = await request.json()
    const { name, avatar, bio } = body as { name?: string; avatar?: string; bio?: string }

    const updateData: Record<string, string> = {}
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json({ error: 'Name must be at least 2 characters long' }, { status: 400 })
      }
      updateData.name = name.trim()
    }
    if (avatar !== undefined) {
      if (typeof avatar !== 'string') {
        return NextResponse.json({ error: 'Avatar must be a valid string' }, { status: 400 })
      }
      updateData.avatar = avatar
    }
    if (bio !== undefined) {
      if (typeof bio !== 'string') {
        return NextResponse.json({ error: 'Bio must be a valid string' }, { status: 400 })
      }
      if (bio.length > 500) {
        return NextResponse.json({ error: 'Bio must not exceed 500 characters' }, { status: 400 })
      }
      updateData.bio = bio
    }
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 })
    }

    const dbAvailable = await isDatabaseAvailable()
    if (!dbAvailable) {
      // Return updated data from JWT without persisting
      const currentName = user.email.split('@')[0]
      return NextResponse.json({
        user: {
          id: user.userId,
          name: updateData.name || currentName,
          email: user.email,
          role: user.role,
          avatar: updateData.avatar || '',
          bio: updateData.bio || '',
        },
        _dbOffline: true,
      })
    }

    const updatedUser = await db.user.update({
      where: { id: user.userId },
      data: updateData,
      select: { id: true, name: true, email: true, avatar: true, bio: true, role: true, isOnline: true, lastSeen: true, createdAt: true },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('[Auth] Update profile error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred while updating profile' }, { status: 500 })
  }
}
