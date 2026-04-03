import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authMiddleware } from '@/lib/auth'

// ─── DELETE /api/deploy/[id] ─────────────────────────────────
// Delete a deployment record.

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = authMiddleware(request)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const { id } = await params

    // Verify ownership
    const deployment = await db.deployment.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!deployment) {
      return NextResponse.json(
        { error: 'سجل النشر غير موجود' },
        { status: 404 }
      )
    }

    if (deployment.userId !== user.userId && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'غير مصرح بحذف هذا السجل' },
        { status: 403 }
      )
    }

    await db.deployment.delete({ where: { id } })

    return NextResponse.json({ message: 'تم حذف سجل النشر بنجاح' })
  } catch (error) {
    console.error('[Deploy] Delete error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف سجل النشر' },
      { status: 500 }
    )
  }
}
