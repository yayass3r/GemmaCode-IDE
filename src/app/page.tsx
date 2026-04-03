'use client'

import React from 'react'
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels'
import IDEToolbar from '@/components/ide-toolbar'
import FileExplorer from '@/components/file-explorer'
import CodeEditor from '@/components/code-editor'
import LivePreview from '@/components/live-preview'
import Terminal from '@/components/terminal'
import AIChat from '@/components/ai-chat'
import { useIDEStore, type MobileView } from '@/lib/store'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Code2,
  FileCode,
  Terminal as TerminalIcon,
  MessageSquare,
  Eye,
} from 'lucide-react'

function ResizeHandle({
  direction = 'horizontal',
}: {
  direction?: 'horizontal' | 'vertical'
}) {
  return (
    <PanelResizeHandle
      className={`relative group flex items-center justify-center ${
        direction === 'horizontal'
          ? 'w-[3px] bg-[#181825] hover:bg-emerald-500/50 active:bg-emerald-500 transition-colors'
          : 'h-[3px] bg-[#181825] hover:bg-emerald-500/50 active:bg-emerald-500 transition-colors'
      }`}
    >
      <div
        className={`absolute rounded-full bg-emerald-500/0 group-hover:bg-emerald-500/40 group-active:bg-emerald-500/80 transition-all z-10 ${
          direction === 'horizontal'
            ? 'w-[3px] h-8 top-1/2 -translate-y-1/2'
            : 'h-[3px] w-8 left-1/2 -translate-x-1/2'
        }`}
      />
    </PanelResizeHandle>
  )
}

/* ─── Mobile Bottom Tab Bar ─── */
function MobileTabBar() {
  const { mobileActiveView, setMobileView } =
    useIDEStore()

  const tabs: { id: MobileView; icon: React.ElementType; label: string }[] = [
    { id: 'files', icon: FileCode, label: 'الملفات' },
    { id: 'editor', icon: Code2, label: 'المحرر' },
    { id: 'preview', icon: Eye, label: 'المعاينة' },
    { id: 'terminal', icon: TerminalIcon, label: 'الطرفية' },
    { id: 'aichat', icon: MessageSquare, label: 'AI' },
  ]

  return (
    <nav className="flex items-center justify-around bg-[#181825] border-t border-border px-1 pb-[env(safe-area-inset-bottom)]">
      {tabs.map(({ id, icon: Icon, label }) => {
        const isActive = mobileActiveView === id
        return (
          <button
            key={id}
            onClick={() => setMobileView(id)}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 min-w-[56px] rounded-md transition-colors ${
              isActive
                ? 'text-emerald-400'
                : 'text-muted-foreground active:text-foreground'
            }`}
          >
            <Icon className="size-[18px]" />
            <span className="text-[10px] leading-tight font-medium">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}

/* ─── Desktop Layout (existing resizable panels) ─── */
function DesktopLayout() {
  const { showFileExplorer, showTerminal, showPreview, showAIChat } =
    useIDEStore()

  return (
    <PanelGroup direction="horizontal" autoSaveId="ide-main-layout">
      {/* File Explorer Panel */}
      {showFileExplorer && (
        <>
          <Panel
            defaultSize={18}
            minSize={12}
            maxSize={30}
            order={1}
            className="overflow-hidden"
          >
            <FileExplorer />
          </Panel>
          <ResizeHandle direction="horizontal" />
        </>
      )}

      {/* Center Panel Group (Editor + Terminal) */}
      <Panel order={2} minSize={30}>
        <PanelGroup direction="vertical" autoSaveId="ide-center-layout">
          <Panel defaultSize={showTerminal ? 70 : 100} minSize={30}>
            <CodeEditor />
          </Panel>

          {showTerminal && (
            <>
              <ResizeHandle direction="vertical" />
              <Panel defaultSize={30} minSize={15} maxSize={60}>
                <Terminal />
              </Panel>
            </>
          )}
        </PanelGroup>
      </Panel>

      {/* Right Panel (Preview + AI Chat) */}
      {showPreview && (
        <>
          <ResizeHandle direction="horizontal" />
          <Panel
            defaultSize={40}
            minSize={20}
            maxSize={70}
            order={3}
            className="overflow-hidden"
          >
            <PanelGroup direction="vertical" autoSaveId="ide-right-layout">
              <Panel defaultSize={showAIChat ? 55 : 100} minSize={25}>
                <LivePreview />
              </Panel>

              {showAIChat && (
                <>
                  <ResizeHandle direction="vertical" />
                  <Panel defaultSize={45} minSize={25} maxSize={70}>
                    <AIChat />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </Panel>
        </>
      )}

      {/* AI Chat as standalone (when preview is off) */}
      {!showPreview && showAIChat && (
        <>
          <ResizeHandle direction="horizontal" />
          <Panel
            defaultSize={35}
            minSize={25}
            maxSize={50}
            order={3}
            className="overflow-hidden"
          >
            <AIChat />
          </Panel>
        </>
      )}
    </PanelGroup>
  )
}

/* ─── Mobile Layout (single panel, tab bar navigation) ─── */
function MobileLayout() {
  const { mobileActiveView } = useIDEStore()

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        {mobileActiveView === 'files' && <FileExplorer />}
        {mobileActiveView === 'editor' && <CodeEditor />}
        {mobileActiveView === 'preview' && <LivePreview />}
        {mobileActiveView === 'terminal' && <Terminal />}
        {mobileActiveView === 'aichat' && <AIChat />}
      </div>
      <MobileTabBar />
    </div>
  )
}

/* ─── Main Page ─── */
export default function Home() {
  const isMobile = useIsMobile()

  return (
    <div className="dark h-dvh w-dvw overflow-hidden bg-[#11111b] text-foreground">
      {/* Toolbar */}
      <IDEToolbar />

      {/* Main layout: height = full screen minus toolbar (h-10 on mobile, h-12 on desktop) */}
      <div className="h-[calc(100dvh-40px)] md:h-[calc(100dvh-48px)]">
        {isMobile ? <MobileLayout /> : <DesktopLayout />}
      </div>
    </div>
  )
}
