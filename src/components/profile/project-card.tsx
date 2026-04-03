'use client'

import React, { useState } from 'react'
import {
  Star,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  Globe,
  GlobeLock,
  EyeOff,
  Calendar,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Project } from '@/lib/store'

interface ProjectCardProps {
  project: Project
  showAuthor?: boolean
  onDelete?: (id: string) => void
  onEdit?: (project: Project) => void
  onPublish?: (id: string, publish: boolean) => void
  onClick?: (project: Project) => void
}

const gradientColors = [
  'from-emerald-600/30 to-teal-600/30',
  'from-blue-600/30 to-cyan-600/30',
  'from-purple-600/30 to-pink-600/30',
  'from-orange-600/30 to-red-600/30',
  'from-emerald-600/30 to-blue-600/30',
  'from-pink-600/30 to-orange-600/30',
]

function getGradient(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return gradientColors[Math.abs(hash) % gradientColors.length]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
  return date.toLocaleDateString('ar-SA', options)
}

function parseTags(tagsStr: string): string[] {
  try {
    return JSON.parse(tagsStr)
  } catch {
    return []
  }
}

export default function ProjectCard({
  project,
  showAuthor = false,
  onDelete,
  onEdit,
  onPublish,
  onClick,
}: ProjectCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingPublish, setIsTogglingPublish] = useState(false)

  const gradient = getGradient(project.id)
  const tags = parseTags(project.tags)

  const statusBadge = project.isHidden ? (
    <Badge variant="destructive" className="text-[10px] h-5 gap-1">
      <EyeOff className="size-3" />
      مخفي
    </Badge>
  ) : project.isPublished ? (
    <Badge className="text-[10px] h-5 gap-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">
      <Globe className="size-3" />
      منشور
    </Badge>
  ) : (
    <Badge className="text-[10px] h-5 gap-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30">
      <GlobeLock className="size-3" />
      مسودة
    </Badge>
  )

  const handleDelete = async () => {
    setIsDeleting(true)
    onDelete?.(project.id)
    setIsDeleting(false)
    setShowDeleteDialog(false)
  }

  const handleTogglePublish = async () => {
    setIsTogglingPublish(true)
    onPublish?.(project.id, !project.isPublished)
    setIsTogglingPublish(false)
  }

  return (
    <>
      <Card
        className="group bg-[#181825] border-border hover:border-emerald-500/30 transition-all duration-300 overflow-hidden cursor-pointer hover:shadow-lg hover:shadow-emerald-500/5"
        onClick={() => onClick?.(project)}
      >
        {/* Cover area */}
        <div
          className={`h-32 bg-gradient-to-br ${gradient} relative overflow-hidden`}
        >
          {project.coverImage ? (
            <img
              src={project.coverImage}
              alt={project.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl font-bold text-white/20">
                {project.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Status overlay */}
          <div className="absolute top-2 right-2">{statusBadge}</div>

          {/* Featured badge */}
          {project.isFeatured && (
            <div className="absolute top-2 left-2">
              <Badge className="text-[10px] h-5 gap-1 bg-amber-500/20 text-amber-400 border-amber-500/30">
                ⭐ مميز
              </Badge>
            </div>
          )}

          {/* Actions menu */}
          {(onEdit || onDelete || onPublish) && (
            <div className="absolute top-2 left-2 sm:left-auto sm:right-2 sm:top-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {project.isFeatured && <div className="mb-1" />}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-sm"
                  >
                    <MoreVertical className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="bg-[#1e1e2e] border-border"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onClick && (
                    <DropdownMenuItem
                      className="text-xs gap-2 focus:bg-emerald-500/10 focus:text-emerald-400"
                      onClick={() => onClick(project)}
                    >
                      <Eye className="size-3.5" />
                      فتح المشروع
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem
                      className="text-xs gap-2 focus:bg-emerald-500/10 focus:text-emerald-400"
                      onClick={() => onEdit(project)}
                    >
                      <Pencil className="size-3.5" />
                      تعديل
                    </DropdownMenuItem>
                  )}
                  {onPublish && (
                    <DropdownMenuItem
                      className="text-xs gap-2 focus:bg-emerald-500/10 focus:text-emerald-400"
                      onClick={handleTogglePublish}
                      disabled={isTogglingPublish}
                    >
                      {project.isPublished ? (
                        <>
                          <GlobeLock className="size-3.5" />
                          إلغاء النشر
                        </>
                      ) : (
                        <>
                          <Globe className="size-3.5" />
                          نشر المشروع
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem
                        className="text-xs gap-2 focus:bg-red-500/10 focus:text-red-400 text-red-400/70"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="size-3.5" />
                        حذف
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#181825] to-transparent" />
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-emerald-400 transition-colors">
            {project.title}
          </h3>

          {/* Description */}
          {project.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-[9px] h-4 px-1.5 text-muted-foreground border-border"
                >
                  {tag}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-[9px] h-4 px-1.5 text-muted-foreground border-border"
                >
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Author */}
          {showAuthor && project.author && (
            <div className="flex items-center gap-2">
              <div className="size-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                {project.author.name.charAt(0)}
              </div>
              <span className="text-[11px] text-muted-foreground truncate">
                {project.author.name}
              </span>
            </div>
          )}

          {/* Stats & Date */}
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1 text-[11px]">
                <Star className="size-3" />
                {project.stars}
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <Eye className="size-3" />
                {project.views}
              </span>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="size-3" />
              {formatDate(project.createdAt)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#1e1e2e] border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              حذف المشروع
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              هل أنت متأكد من حذف مشروع &quot;{project.title}&quot؛؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#181825] border-border text-muted-foreground hover:text-foreground">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'جارٍ الحذف...' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
