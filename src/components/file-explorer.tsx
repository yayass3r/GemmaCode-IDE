'use client'

import React, { useState, useCallback } from 'react'
import {
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileText,
  FileJson,
  Image as ImageIcon,
  Plus,
  Trash2,
  Pencil,
} from 'lucide-react'
import { useIDEStore } from '@/lib/store'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

function getFileIcon(filename: string, isOpen?: boolean) {
  const ext = filename.split('.').pop()?.toLowerCase()

  if (ext === 'html' || ext === 'htm') return <FileCode className="size-4 text-orange-400" />
  if (ext === 'css' || ext === 'scss' || ext === 'sass') return <FileCode className="size-4 text-blue-400" />
  if (ext === 'js' || ext === 'jsx' || ext === 'ts' || ext === 'tsx') return <FileCode className="size-4 text-yellow-400" />
  if (ext === 'json') return <FileJson className="size-4 text-green-400" />
  if (ext === 'md' || ext === 'txt') return <FileText className="size-4 text-gray-400" />
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'svg' || ext === 'webp') return <ImageIcon className="size-4 text-purple-400" />
  if (ext === 'py') return <FileCode className="size-4 text-green-300" />
  return <File className="size-4 text-muted-foreground" />
}

function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    html: 'html', htm: 'html',
    css: 'css', scss: 'scss', sass: 'scss',
    js: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    json: 'json',
    md: 'markdown',
    py: 'python',
    txt: 'plaintext',
  }
  return map[ext || ''] || 'plaintext'
}

export { getLanguage }

interface FileItemProps {
  name: string
  path: string
  depth?: number
}

function FileItem({ name, path, depth = 0 }: FileItemProps) {
  const { activeFile, openTab, deleteFile, renameFile } = useIDEStore()
  const isActive = activeFile === path
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(name)

  const handleClick = () => {
    openTab(path)
  }

  const handleRename = () => {
    if (newName && newName !== name) {
      renameFile(path, newName)
    }
    setIsRenaming(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRename()
    if (e.key === 'Escape') {
      setNewName(name)
      setIsRenaming(false)
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm transition-colors group ${
            isActive
              ? 'bg-accent text-accent-foreground border-r-2 border-emerald-500'
              : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
          }`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={handleClick}
        >
          {isRenaming ? (
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              className="h-6 text-xs px-1 py-0 font-mono"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              {getFileIcon(name)}
              <span className="truncate font-mono text-xs">{name}</span>
            </>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => openTab(path)}>
          <FileCode className="size-4" />
          <span>فتح الملف</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setIsRenaming(true)}>
          <Pencil className="size-4" />
          <span>إعادة تسمية</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => deleteFile(path)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="size-4" />
          <span>حذف</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export default function FileExplorer() {
  const { files, createFile, setActiveFile } = useIDEStore()
  const isMobile = useIsMobile()
  const [isCreating, setIsCreating] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [expanded, setExpanded] = useState(true)

  const filePaths = Object.keys(files).sort()

  const handleCreate = useCallback(() => {
    if (newFileName.trim()) {
      createFile(newFileName.trim())
      setNewFileName('')
      setIsCreating(false)
    }
  }, [newFileName, createFile])

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate()
    if (e.key === 'Escape') {
      setNewFileName('')
      setIsCreating(false)
    }
  }

  return (
    <div className={`h-full flex flex-col bg-[#181825] ${!isMobile ? 'border-r border-border' : ''}`}>
      {/* Header */}
      <div className={`flex items-center justify-between border-b border-border ${isMobile ? 'px-4 py-3' : 'px-3 py-2'}`}>
        <div className="flex items-center gap-2">
          {expanded ? (
            <FolderOpen className={`${isMobile ? 'size-5' : 'size-4'} text-emerald-400`} />
          ) : (
            <Folder className={`${isMobile ? 'size-5' : 'size-4'} text-emerald-400`} />
          )}
          <span className={`${isMobile ? 'text-sm' : 'text-xs'} font-semibold text-foreground tracking-wide uppercase`}>
            الملفات
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={isMobile ? 'size-8' : 'size-6'}
          onClick={() => setIsCreating(true)}
        >
          <Plus className={isMobile ? 'size-4' : 'size-3.5'} />
        </Button>
      </div>

      {/* New file input */}
      {isCreating && (
        <div className={`${isMobile ? 'px-4 py-2' : 'px-2 py-1.5'} border-b border-border`}>
          <Input
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onBlur={handleCreate}
            onKeyDown={handleCreateKeyDown}
            placeholder="اسم الملف الجديد..."
            className={`${isMobile ? 'h-9 text-sm' : 'h-7 text-xs'} font-mono`}
            autoFocus
          />
        </div>
      )}

      {/* File list */}
      <div
        className="flex-1 overflow-y-auto custom-scrollbar"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#333 transparent',
        }}
      >
        <div
          className={`flex items-center gap-2 ${isMobile ? 'px-4 py-2.5' : 'px-3 py-1.5'} cursor-pointer ${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground hover:bg-accent/30 transition-colors active:bg-accent/50`}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <FolderOpen className={`${isMobile ? 'size-4' : 'size-3.5'} text-emerald-400`} />
          ) : (
            <Folder className={`${isMobile ? 'size-4' : 'size-3.5'} text-emerald-400`} />
          )}
          <span className="font-semibold">مشروعي</span>
          <span className={`${isMobile ? 'text-xs' : 'text-[10px]'} text-muted-foreground ml-auto`}>
            {filePaths.length}
          </span>
        </div>

        {expanded &&
          filePaths.map((path) => (
            <FileItem key={path} name={path} path={path} depth={1} />
          ))}
      </div>

      {/* Status bar */}
      <div className={`${isMobile ? 'px-4 py-2' : 'px-3 py-1.5'} border-t border-border ${isMobile ? 'text-xs' : 'text-[10px]'} text-muted-foreground`}>
        {filePaths.length} ملفات
      </div>
    </div>
  )
}
