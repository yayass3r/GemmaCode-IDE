'use client'

import React, { useCallback, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { X, Circle } from 'lucide-react'
import { useIDEStore } from '@/lib/store'
import { useIsMobile } from '@/hooks/use-mobile'
import { getLanguage } from './file-explorer'

const Editor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  { ssr: false }
)

function getFileIconColor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    html: 'text-orange-400', htm: 'text-orange-400',
    css: 'text-blue-400', scss: 'text-blue-400',
    js: 'text-yellow-400', jsx: 'text-yellow-400',
    ts: 'text-blue-500', tsx: 'text-blue-500',
    json: 'text-green-400',
    md: 'text-gray-400',
    py: 'text-green-300',
  }
  return map[ext || ''] || 'text-muted-foreground'
}

function getFileDotColor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    html: 'bg-orange-400', htm: 'bg-orange-400',
    css: 'bg-blue-400', scss: 'bg-blue-400',
    js: 'bg-yellow-400', jsx: 'bg-yellow-400',
    ts: 'bg-blue-500', tsx: 'bg-blue-500',
    json: 'bg-green-400',
    md: 'bg-gray-400',
    py: 'bg-green-300',
  }
  return map[ext || ''] || 'bg-muted-foreground'
}

interface TabProps {
  path: string
  isActive: boolean
  onClick: () => void
  onClose: (e: React.MouseEvent) => void
}

function Tab({ path, isActive, onClick, onClose }: TabProps) {
  const isMobile = useIsMobile()
  const filename = path.split('/').pop() || path

  return (
    <div
      className={`group flex items-center gap-1.5 ${isMobile ? 'px-3 py-2.5' : 'px-3 py-2'} ${isMobile ? 'text-sm' : 'text-xs'} cursor-pointer border-r border-border transition-colors select-none min-w-0 ${
        isActive
          ? 'bg-[#1e1e2e] text-foreground'
          : 'bg-[#181825] text-muted-foreground hover:bg-[#1e1e2e]/50 hover:text-foreground'
      }`}
      onClick={onClick}
    >
      <Circle className={`${isMobile ? 'size-2.5' : 'size-2'} shrink-0 ${getFileDotColor(filename)}`} />
      <span className="truncate font-mono">{filename}</span>
      <button
        className={`shrink-0 ${isMobile ? 'size-6' : 'size-4'} flex items-center justify-center rounded-sm hover:bg-destructive/20 hover:text-destructive transition-colors ${
          isActive ? 'opacity-70' : isMobile ? 'opacity-50' : 'opacity-0 group-hover:opacity-70'
        }`}
        onClick={(e) => {
          e.stopPropagation()
          onClose(e)
        }}
      >
        <X className={isMobile ? 'size-3.5' : 'size-3'} />
      </button>
    </div>
  )
}

export default function CodeEditor() {
  const { files, activeFile, openTabs, setActiveFile, closeTab, updateFileContent } =
    useIDEStore()
  const isMobile = useIsMobile()
  const editorRef = useRef<unknown>(null)

  const handleEditorDidMount = useCallback((editor: unknown) => {
    editorRef.current = editor
  }, [])

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (activeFile && value !== undefined) {
        updateFileContent(activeFile, value)
      }
    },
    [activeFile, updateFileContent]
  )

  const language = useMemo(() => {
    if (!activeFile) return 'plaintext'
    return getLanguage(activeFile)
  }, [activeFile])

  const content = activeFile ? files[activeFile] || '' : ''

  if (!activeFile) {
    return (
      <div className="h-full flex flex-col bg-[#1e1e2e]">
        {/* Tab bar placeholder */}
        <div className="flex items-center bg-[#181825] border-b border-border min-h-[36px]" />
        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center px-4">
            <div className={`${isMobile ? 'text-5xl' : 'text-4xl'} mb-3`}>📝</div>
            <p className={`${isMobile ? 'text-base' : 'text-sm'}`}>اختر ملفًا من مستكشف الملفات</p>
            <p className={`${isMobile ? 'text-xs' : 'text-xs'} mt-1 text-muted-foreground/70`}>
              أو أنشئ ملفًا جديدًا
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e2e]">
      {/* Tab bar */}
      <div
        className={`flex items-center bg-[#181825] border-b border-border overflow-x-auto custom-scrollbar ${isMobile ? 'min-h-[44px]' : 'min-h-[36px]'}`}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#333 transparent',
        }}
      >
        {openTabs.map((tab) => (
          <Tab
            key={tab}
            path={tab}
            isActive={activeFile === tab}
            onClick={() => setActiveFile(tab)}
            onClose={() => closeTab(tab)}
          />
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1" dir="ltr">
        <Editor
          height="100%"
          language={language}
          value={content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            fontSize: isMobile ? 16 : 14,
            fontFamily: "'Geist Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            bracketPairColorization: { enabled: true },
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            tabSize: 2,
            insertSpaces: true,
          }}
          loading={
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              جارٍ تحميل المحرر...
            </div>
          }
        />
      </div>

      {/* Status bar */}
      <div className={`flex items-center justify-between border-t border-border ${isMobile ? 'px-4 py-1.5 text-[11px]' : 'px-3 py-1 text-[10px]'} text-muted-foreground`}>
        <div className="flex items-center gap-3">
          <span>{language.toUpperCase()}</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-3">
          <span>مسافات: 2</span>
          <span>{activeFile.split('/').pop()}</span>
        </div>
      </div>
    </div>
  )
}
