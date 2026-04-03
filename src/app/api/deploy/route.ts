import { NextRequest, NextResponse } from 'next/server'
import { db, isDatabaseAvailable } from '@/lib/db'
import { authMiddleware } from '@/lib/auth'
import { deployProject, countDeployableFiles } from '@/lib/deploy-providers'

export async function POST(request: NextRequest) {
  try {
    const authResult = authMiddleware(request)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const body = await request.json()
    const { files, provider, siteName, title } = body as {
      files: Record<string, string>
      provider: string
      siteName?: string
      title?: string
    }

    if (!files || typeof files !== 'object' || Object.keys(files).length === 0) {
      return NextResponse.json({ error: 'لا توجد ملفات للنشر.' }, { status: 400 })
    }

    const validProviders = ['netlify', 'vercel', 'surge', 'cloudflare', 'tiiny']
    if (!provider || !validProviders.includes(provider)) {
      return NextResponse.json({ error: `مزود النشر غير صالح: ${validProviders.join(', ')}` }, { status: 400 })
    }

    const hasIndexHtml = Object.keys(files).some(p => p.toLowerCase() === 'index.html')
    if (!hasIndexHtml) {
      return NextResponse.json({ error: 'يجب أن يحتوي المشروع على ملف index.html.' }, { status: 400 })
    }

    let deployResult
    try {
      deployResult = await deployProject(files, provider, siteName)
    } catch (deployError) {
      console.error('[Deploy] Provider error:', deployError)
      return NextResponse.json(
        { error: `خطأ في مزود النشر: ${deployError instanceof Error ? deployError.message : 'خطأ غير معروف'}` },
        { status: 500 }
      )
    }

    // Try to save to database (non-blocking)
    const dbAvailable = await isDatabaseAvailable()
    if (dbAvailable) {
      try {
        await db.deployment.create({
          data: {
            userId: user.userId,
            title: title || siteName || `مشروع ${provider}`,
            provider: deployResult.provider,
            url: deployResult.url,
            status: deployResult.success ? 'live' : 'failed',
            siteId: deployResult.siteId,
            filesCount: countDeployableFiles(files),
          },
        })
      } catch {
        // Save failed, but deployment succeeded — continue
      }
    }

    return NextResponse.json({
      deployment: {
        title: title || siteName || `مشروع ${provider}`,
        provider: deployResult.provider,
        url: deployResult.url,
        status: deployResult.success ? 'live' : 'failed',
        filesCount: countDeployableFiles(files),
      },
      success: deployResult.success,
      error: deployResult.error,
    })
  } catch (error) {
    console.error('[Deploy] Error:', error)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع أثناء النشر' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = authMiddleware(request)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const dbAvailable = await isDatabaseAvailable()
    if (!dbAvailable) {
      return NextResponse.json({ deployments: [], _dbOffline: true })
    }

    const deployments = await db.deployment.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, title: true, provider: true, url: true, status: true, filesCount: true, createdAt: true, updatedAt: true },
    })

    return NextResponse.json({ deployments })
  } catch (error) {
    console.error('[Deploy] List error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب سجل النشر' }, { status: 500 })
  }
}
