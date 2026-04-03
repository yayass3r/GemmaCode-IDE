'use client'

import React, { useMemo, useState, useCallback, useRef } from 'react'
import { RefreshCw, Loader2, Maximize2, Minimize2 } from 'lucide-react'
import { useIDEStore } from '@/lib/store'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'

export default function LivePreview() {
  const { files, previewKey } = useIDEStore()
  const isMobile = useIsMobile()
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const combinedHtml = useMemo(() => {
    const html = files['index.html'] || ''
    const css = files['style.css'] || ''
    const js = files['script.js'] || ''

    // If the HTML already has full structure, inject CSS and JS
    if (html.includes('</head>') || html.includes('<body')) {
      let modified = html

      // Inject CSS before </head>
      if (css && modified.includes('</head>')) {
        const styleTag = `<style>\n${css}\n</style>`
        modified = modified.replace('</head>', `${styleTag}\n</head>`)
      }

      // Inject JS before </body>
      if (js && modified.includes('</body>')) {
        const scriptTag = `<script>\n${js}\n</script>`
        modified = modified.replace('</body>', `${scriptTag}\n</body>`)
      }

      return modified
    }

    // Otherwise wrap in a basic HTML structure
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${css}</style>
</head>
<body>
  ${html}
  <script>${js}</script>
</body>
</html>`
  }, [files, previewKey])

  const handleLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  const handleRefresh = () => {
    setIsLoading(true)
    if (iframeRef.current) {
      iframeRef.current.srcdoc = combinedHtml
    }
    setTimeout(() => {
      setIsLoading(false)
    }, 3000)
  }

  return (
    <div
      className={`h-full flex flex-col bg-[#11111b] ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      {/* Browser chrome */}
      <div className={`flex items-center gap-2 bg-[#181825] border-b border-border ${isMobile ? 'px-2.5 py-2' : 'px-3 py-2'}`}>
        {/* Traffic lights */}
        <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-1.5'}`}>
          <div className={`${isMobile ? 'size-2.5' : 'size-3'} rounded-full bg-red-500/80`} />
          <div className={`${isMobile ? 'size-2.5' : 'size-3'} rounded-full bg-yellow-500/80`} />
          <div className={`${isMobile ? 'size-2.5' : 'size-3'} rounded-full bg-green-500/80`} />
        </div>

        {/* URL bar */}
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 flex items-center bg-[#11111b] border border-border rounded-md px-3 py-1.5 text-xs text-muted-foreground">
            <span className="text-emerald-500 mr-1">🔒</span>
            <span className="font-mono">localhost:3000</span>
          </div>
        </div>

        {/* Actions */}
        <Button
          variant="ghost"
          size="icon"
          className={isMobile ? 'size-7' : 'size-7'}
          onClick={handleRefresh}
          title="تحديث"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'خروج من ملء الشاشة' : 'ملء الشاشة'}
        >
          {isFullscreen ? (
            <Minimize2 className="size-3.5" />
          ) : (
            <Maximize2 className="size-3.5" />
          )}
        </Button>
      </div>

      {/* Preview area */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#11111b]/80 z-10">
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <Loader2 className="size-4 animate-spin" />
              <span>جارٍ التحميل...</span>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          srcDoc={combinedHtml}
          onLoad={handleLoad}
          className="w-full h-full border-0 bg-white"
          sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
          title="Live Preview"
        />
      </div>
    </div>
  )
}
