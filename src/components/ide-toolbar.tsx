'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Code2,
  Play,
  PanelLeftClose,
  PanelLeftOpen,
  Terminal,
  MessageSquare,
  Eye,
  EyeOff,
  Moon,
  Pencil,
  Check,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Shield,
  Compass,
  ChevronDown,
} from 'lucide-react'
import { useIDEStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'

function ToolbarButton({
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ElementType
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 gap-1.5 text-xs px-2 ${
            isActive
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={onClick}
        >
          <Icon className="size-3.5" />
          <span className="hidden lg:inline">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  )
}

/* ─── User Dropdown Menu ─── */
function UserMenu() {
  const { user, setCurrentView, logout } = useIDEStore()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const initials = user.name?.charAt(0)?.toUpperCase() || 'U'
  const isAdmin = user.role === 'admin'

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors group"
      >
        <div className="size-6 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white ring-1 ring-white/10">
          {initials}
        </div>
        <span className="hidden md:block text-xs text-foreground font-medium max-w-[80px] truncate">
          {user.name}
        </span>
        <ChevronDown className={`size-3 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-52 bg-[#1e1e2e] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 py-1.5 z-50 overflow-hidden">
          {/* User Info Header */}
          <div className="px-3 py-2.5 border-b border-white/[0.06] mb-1">
            <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5" dir="ltr">{user.email}</p>
          </div>

          {/* Menu Items */}
          <button
            onClick={() => { setCurrentView('profile'); setIsOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
          >
            <User className="size-3.5" />
            <span>الملف الشخصي</span>
          </button>

          <button
            onClick={() => { setCurrentView('explore'); setIsOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
          >
            <Compass className="size-3.5" />
            <span>استكشف المشاريع</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => { setCurrentView('admin'); setIsOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors"
            >
              <Shield className="size-3.5" />
              <span>لوحة التحكم</span>
            </button>
          )}

          <div className="border-t border-white/[0.06] mt-1 pt-1">
            <button
              onClick={() => { logout(); setIsOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="size-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Auth Buttons (Login / Register) ─── */
function AuthButtons() {
  const { user, setCurrentView } = useIDEStore()

  if (user) return <UserMenu />

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 text-xs px-2.5 text-muted-foreground hover:text-foreground"
        onClick={() => setCurrentView('login')}
      >
        <LogIn className="size-3.5" />
        <span className="hidden md:inline">تسجيل الدخول</span>
      </Button>
      <Button
        size="sm"
        className="h-7 gap-1.5 text-xs px-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20"
        onClick={() => setCurrentView('register')}
      >
        <UserPlus className="size-3.5" />
        <span className="hidden md:inline">إنشاء حساب</span>
      </Button>
    </div>
  )
}

export default function IDEToolbar() {
  const isMobile = useIsMobile()
  const {
    showFileExplorer,
    showTerminal,
    showAIChat,
    showPreview,
    toggleFileExplorer,
    toggleTerminal,
    toggleAIChat,
    togglePreview,
    refreshPreview,
    user,
    setCurrentView,
    logout,
  } = useIDEStore()

  const [projectName, setProjectName] = useState('مشروعي')
  const [isEditingName, setIsEditingName] = useState(false)

  const handleNameSubmit = () => {
    setIsEditingName(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNameSubmit()
    if (e.key === 'Escape') {
      setProjectName('مشروعي')
      setIsEditingName(false)
    }
  }

  // ─── Mobile: ultra-compact toolbar ───
  if (isMobile) {
    return (
      <div className="flex items-center justify-between h-10 px-2 bg-[#181825] border-b border-border">
        {/* Logo */}
        <div className="flex items-center gap-1.5">
          <div className="size-6 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <Code2 className="size-3.5 text-white" />
          </div>
          <span className="text-xs font-bold tracking-tight">
            <span className="text-emerald-400">Gemma</span>
            <span className="text-foreground">Code</span>
          </span>
        </div>

        {/* Center: Auth or User */}
        <div className="flex items-center gap-1">
          {user ? (
            <button
              onClick={() => {
                if (user.role === 'admin') setCurrentView('admin')
                else setCurrentView('profile')
              }}
              className="flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-white/5 transition-colors"
            >
              <div className="size-5 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-[9px] font-bold text-white">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-muted-foreground"
                onClick={() => setCurrentView('login')}
              >
                دخول
              </Button>
              <Button
                size="sm"
                className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setCurrentView('register')}
              >
                حساب جديد
              </Button>
            </div>
          )}
        </div>

        {/* Run button */}
        <Button
          size="sm"
          className="h-7 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm px-3"
          onClick={() => {
            refreshPreview()
            if (!showPreview) togglePreview()
          }}
        >
          <Play className="size-3" />
        </Button>
      </div>
    )
  }

  // ─── Desktop: full toolbar ───
  return (
    <div className="flex items-center justify-between h-12 px-3 bg-[#181825] border-b border-border">
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Code2 className="size-4 text-white" />
          </div>
          <span className="text-sm font-bold text-foreground tracking-tight hidden sm:inline">
            <span className="text-emerald-400">Gemma</span>
            <span className="text-foreground">Code</span>
          </span>
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-border" />

        {/* Project name */}
        <div className="flex items-center gap-1.5">
          {isEditingName ? (
            <div className="flex items-center gap-1">
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={handleNameKeyDown}
                className="h-7 w-32 text-xs px-2 font-mono"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={handleNameSubmit}
              >
                <Check className="size-3" />
              </Button>
            </div>
          ) : (
            <button
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1 rounded hover:bg-accent/50"
              onClick={() => setIsEditingName(true)}
            >
              <span>{projectName}</span>
              <Pencil className="size-3 opacity-0 group-hover:opacity-100" />
            </button>
          )}
        </div>
      </div>

      {/* Center section - Panel toggles */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          icon={showFileExplorer ? PanelLeftClose : PanelLeftOpen}
          label="الملفات"
          isActive={showFileExplorer}
          onClick={toggleFileExplorer}
        />
        <ToolbarButton
          icon={Terminal}
          label="الطرفية"
          isActive={showTerminal}
          onClick={toggleTerminal}
        />
        <ToolbarButton
          icon={showPreview ? Eye : EyeOff}
          label="المعاينة"
          isActive={showPreview}
          onClick={togglePreview}
        />
        <ToolbarButton
          icon={MessageSquare}
          label="مساعد AI"
          isActive={showAIChat}
          onClick={toggleAIChat}
        />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Auth buttons or User menu */}
        <AuthButtons />

        {/* Separator */}
        <div className="w-px h-5 bg-border" />

        {/* Run button */}
        <Button
          size="sm"
          className="h-7 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
          onClick={() => {
            refreshPreview()
            if (!showPreview) togglePreview()
          }}
        >
          <Play className="size-3.5" />
          <span className="hidden sm:inline">تشغيل</span>
        </Button>

        {/* Theme indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7">
              <Moon className="size-3.5 text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>الوضع الداكن</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
