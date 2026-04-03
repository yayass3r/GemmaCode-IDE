'use client'

import React, { useState } from 'react'
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
          <span>تشغيل</span>
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
