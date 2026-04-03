'use client'

import React, { useEffect } from 'react'
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
import LoginForm from '@/components/auth/login-form'
import RegisterForm from '@/components/auth/register-form'
import UserProfile from '@/components/profile/user-profile'
import ExploreProjects from '@/components/explore/explore-projects'
import AdminDashboard from '@/components/admin/admin-dashboard'
import DeployPanel from '@/components/deploy/deploy-panel'
import { useIDEStore, type MobileView, type UserProfile as UserProfileType } from '@/lib/store'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Code2,
  FileCode,
  Terminal as TerminalIcon,
  MessageSquare,
  Eye,
  Sparkles,
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

/* ─── Desktop Layout (resizable panels) ─── */
function DesktopLayout() {
  const { showFileExplorer, showTerminal, showPreview, showAIChat } =
    useIDEStore()

  return (
    <PanelGroup direction="horizontal" autoSaveId="ide-main-layout">
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

/* ─── Mobile Layout (single panel) ─── */
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

/* ─── Top Navigation Bar (when not in IDE view) ─── */
function TopNavBar() {
  const { user, currentView, setCurrentView, logout } = useIDEStore()
  const isMobile = useIsMobile()

  return (
    <header className="h-14 bg-[#181825]/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
          <Sparkles className="size-4 text-white" />
        </div>
        <span className="font-bold text-sm bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
          GemmaCode
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex items-center gap-1">
        {user && (
          <>
            <button
              onClick={() => setCurrentView('ide')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                currentView === 'ide' ? 'bg-emerald-500/20 text-emerald-400' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              {isMobile ? 'المحرر' : 'محرر الأكواد'}
            </button>
            <button
              onClick={() => setCurrentView('explore')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                currentView === 'explore' ? 'bg-emerald-500/20 text-emerald-400' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              استكشف
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                currentView === 'profile' ? 'bg-emerald-500/20 text-emerald-400' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              الملف الشخصي
            </button>
            {user.role === 'admin' && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentView === 'admin' ? 'bg-emerald-500/20 text-emerald-400' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                لوحة التحكم
              </button>
            )}
          </>
        )}
      </nav>

      {/* User Menu */}
      <div className="flex items-center gap-2">
        {user ? (
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-[11px] font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={logout}
              className="px-2 py-1 rounded-md text-[10px] text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              خروج
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCurrentView('login')}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            تسجيل الدخول
          </button>
        )}
      </div>
    </header>
  )
}

/* ─── IDE View (with toolbar) ─── */
function IDEView() {
  const isMobile = useIsMobile()
  const { user, setCurrentView, logout } = useIDEStore()

  return (
    <>
      <IDEToolbar />
      <div className="h-[calc(100dvh-40px)] md:h-[calc(100dvh-48px)]">
        {isMobile ? <MobileLayout /> : <DesktopLayout />}
      </div>
    </>
  )
}

/* ─── Main Page ─── */
export default function Home() {
  const { currentView, user, setUser } = useIDEStore()

  // Hydrate auth from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('gemmacode_token')
      const userStr = localStorage.getItem('gemmacode_user')
      if (token && userStr) {
        try {
          const parsedUser = JSON.parse(userStr) as UserProfileType
          setUser(parsedUser, token)
        } catch {
          localStorage.removeItem('gemmacode_token')
          localStorage.removeItem('gemmacode_user')
        }
      }
    }
  }, [setUser])

  // For IDE view, use the full-screen IDE layout
  // For other views, use the nav bar + content layout
  const isIDEView = currentView === 'ide'

  return (
    <div className="dark h-dvh w-dvw overflow-hidden bg-[#11111b] text-foreground">
      {isIDEView && <IDEView />}
      <DeployPanel />

      {!isIDEView && (
        <div className="flex flex-col h-dvh">
          <TopNavBar />
          <main className="flex-1 overflow-auto">
            {currentView === 'login' && <LoginForm />}
            {currentView === 'register' && <RegisterForm />}
            {currentView === 'profile' && <UserProfile />}
            {currentView === 'explore' && <ExploreProjects />}
            {currentView === 'admin' && <AdminDashboard />}
          </main>
        </div>
      )}
    </div>
  )
}
