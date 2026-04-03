'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  ArrowRight,
  Code2,
  Compass,
  Loader2,
  SlidersHorizontal,
  TrendingUp,
  Star,
  Clock,
  Eye,
  LogIn,
  User,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useIDEStore, type Project } from '@/lib/store'
import ProjectCard from '../profile/project-card'

type SortOption = 'newest' | 'popular' | 'starred'

export default function ExploreProjects() {
  const { user, token, setCurrentView } = useIDEStore()

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  // ── Fetch projects ──
  const fetchProjects = useCallback(
    async (pageNum: number, append = false) => {
      try {
        if (append) {
          setLoadingMore(true)
        } else {
          setLoading(true)
        }

        const params = new URLSearchParams({
          page: String(pageNum),
          limit: '12',
        })
        if (searchQuery.trim()) {
          params.set('search', searchQuery.trim())
        }

        const res = await fetch(`/api/projects?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          const fetchedProjects = data.projects || []
          const pagination = data.pagination || {}

          if (append) {
            setProjects((prev) => [...prev, ...fetchedProjects])
          } else {
            setProjects(fetchedProjects)
          }

          setPage(pagination.page || 1)
          setTotalPages(pagination.totalPages || 1)
          setTotal(pagination.total || 0)
          setHasMore(pagination.hasNext || false)
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [searchQuery]
  )

  // Initial fetch
  useEffect(() => {
    fetchProjects(1)
  }, [fetchProjects])

  // Client-side sort
  const sortedProjects = [...projects].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.views - a.views
      case 'starred':
        return b.stars - a.stars
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchProjects(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // ── Load more ──
  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchProjects(page + 1, true)
    }
  }

  // ── Open project ──
  const handleOpenProject = (project: Project) => {
    if (user && token) {
      setCurrentView('ide')
    }
  }

  // ── Back to IDE ──
  const handleBack = () => {
    if (user && token) {
      setCurrentView('ide')
    } else {
      setCurrentView('login')
    }
  }

  return (
    <div className="min-h-screen bg-[#11111b]">
      {/* ─── Top Navigation Bar ─── */}
      <nav className="sticky top-0 z-50 bg-[#181825]/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Right side: back + logo */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleBack}
            >
              <ArrowRight className="size-4" />
              <span className="hidden sm:inline">الرئيسية</span>
            </Button>
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Code2 className="size-3.5 text-white" />
              </div>
              <span className="text-sm font-bold">
                <span className="text-emerald-400">Gemma</span>
                <span className="text-foreground">Code</span>
              </span>
            </div>
          </div>

          {/* Left side: user info */}
          <div className="flex items-center gap-2">
            {user && token ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setCurrentView('profile')}
                >
                  <User className="size-3.5" />
                  <span className="hidden sm:inline">{user.name}</span>
                </Button>
                <div className="size-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[10px] font-bold text-white">
                  {user.name.charAt(0)}
                </div>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setCurrentView('login')}
              >
                <LogIn className="size-3.5" />
                <span className="hidden sm:inline">تسجيل الدخول</span>
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ─── Header ─── */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/20">
              <Compass className="size-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                استكشف المشاريع
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                اكتشف مشاريع رائعة أنشأها المستخدمون
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن مشاريع..."
                className="bg-[#181825] border-border text-foreground text-sm pr-9 h-10"
                dir="rtl"
              />
            </div>
            <Select
              value={sortBy}
              onValueChange={(val) => setSortBy(val as SortOption)}
            >
              <SelectTrigger className="bg-[#181825] border-border text-foreground text-xs h-10 w-full sm:w-[180px]">
                <SlidersHorizontal className="size-3.5 text-muted-foreground ml-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1e2e] border-border">
                <SelectItem value="newest" className="text-xs text-foreground focus:bg-emerald-500/10 focus:text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3" />
                    الأحدث
                  </span>
                </SelectItem>
                <SelectItem value="popular" className="text-xs text-foreground focus:bg-emerald-500/10 focus:text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="size-3" />
                    الأكثر مشاهدة
                  </span>
                </SelectItem>
                <SelectItem value="starred" className="text-xs text-foreground focus:bg-emerald-500/10 focus:text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <Star className="size-3" />
                    الأكثر نجمة
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          {!loading && (
            <p className="text-xs text-muted-foreground">
              {searchQuery.trim()
                ? `نتائج البحث عن "${searchQuery.trim()}" — ${total} مشروع`
                : `${total} مشروع متاح`}
            </p>
          )}
        </div>

        {/* ─── Projects Grid ─── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <Loader2 className="size-8 text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground">جارٍ تحميل المشاريع...</p>
            </div>
          </div>
        ) : sortedProjects.length === 0 ? (
          <Card className="bg-[#181825] border-border">
            <CardContent className="py-16 text-center">
              <Compass className="size-12 text-muted-foreground mx-auto mb-4 opacity-30" />
              <h3 className="text-base font-medium text-foreground mb-2">
                {searchQuery.trim() ? 'لا توجد نتائج' : 'لا توجد مشاريع بعد'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {searchQuery.trim()
                  ? 'جرب البحث بكلمات مختلفة أو تحقق من الإملاء'
                  : 'كن أول من ينشر مشروعًا على المنصة!'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  showAuthor
                  onClick={handleOpenProject}
                />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="gap-2 text-xs border-border text-muted-foreground hover:text-foreground hover:border-emerald-500/30 px-8"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      جارٍ التحميل...
                    </>
                  ) : (
                    'تحميل المزيد'
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {/* ─── Footer Stats ─── */}
        {!loading && sortedProjects.length > 0 && (
          <div className="flex items-center justify-center gap-4 pt-6 border-t border-border/50">
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Eye className="size-3" />
              {total} مشروع
            </span>
            {totalPages > 1 && (
              <span className="text-[10px] text-muted-foreground">
                صفحة {page} من {totalPages}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
