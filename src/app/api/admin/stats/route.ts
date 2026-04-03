import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authMiddleware } from '@/lib/auth'

// ─── GET: Platform statistics (admin only) ──────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = authMiddleware(request)
    if (auth instanceof NextResponse) return auth

    if (auth.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Run all queries in parallel for performance
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [
      totalUsers,
      totalProjects,
      publishedProjects,
      totalAds,
      activeAds,
      bannedUsers,
      recentUsers,
    ] = await Promise.all([
      db.user.count(),
      db.project.count(),
      db.project.count({ where: { isPublished: true } }),
      db.ad.count(),
      db.ad.count({ where: { isActive: true } }),
      db.user.count({ where: { isBanned: true } }),
      db.user.count({
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
      }),
    ])

    return NextResponse.json({
      totalUsers,
      totalProjects,
      publishedProjects,
      totalAds,
      activeAds,
      bannedUsers,
      recentUsers,
    })
  } catch (error) {
    console.error('[Admin Stats GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform statistics' },
      { status: 500 }
    )
  }
}
