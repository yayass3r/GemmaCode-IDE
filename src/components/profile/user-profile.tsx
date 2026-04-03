'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  ArrowRight,
  Settings,
  FolderKanban,
  Pencil,
  Save,
  Loader2,
  Plus,
  Star,
  Eye,
  Shield,
  LogOut,
  ImageIcon,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { useIDEStore, type Project, type UserProfile } from '@/lib/store'
import { useIsMobile } from '@/hooks/use-mobile'
import ProjectCard from './project-card'

// ─── Avatar Component ───────────────────────────────────────
function UserAvatar({
  user,
  size = 'lg',
}: {
  user: UserProfile
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeClasses = {
    sm: 'size-8 text-sm',
    md: 'size-12 text-lg',
    lg: 'size-24 text-3xl',
  }

  if (user.avatar) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-[#11111b]`}>
        <img
          src={user.avatar}
          alt={user.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
            ;(e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">${user.name.charAt(0)}</div>`
          }}
        />
      </div>
    )
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-[#11111b]`}
    >
      {user.name.charAt(0)}
    </div>
  )
}

// ─── Stats Card ─────────────────────────────────────────────
function StatsCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-white/[0.02] border border-border">
      <div className={`${color}`}>
        <Icon className="size-4" />
      </div>
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}

// ─── Main UserProfile Component ─────────────────────────────
export default function UserProfile() {
  const { user, token, setUser, setCurrentView, logout } = useIDEStore()
  const isMobile = useIsMobile()

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('projects')
  const [projectFilter, setProjectFilter] = useState<'all' | 'published' | 'draft'>('all')

  // Settings form
  const [editName, setEditName] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [editBio, setEditBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // New project dialog
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [creating, setCreating] = useState(false)

  // ── Fetch user's projects ──
  const fetchProjects = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      let url = '/api/projects/user'
      if (projectFilter !== 'all') {
        url += `?published=${projectFilter === 'published' ? 'true' : 'false'}`
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoading(false)
    }
  }, [token, projectFilter])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // ── Initialize settings form ──
  useEffect(() => {
    if (user) {
      setEditName(user.name)
      setEditAvatar(user.avatar)
      setEditBio(user.bio)
    }
  }, [user])

  // ── Save profile settings ──
  const handleSaveSettings = async () => {
    if (!token) return
    setSaving(true)
    setSaveMessage(null)
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          avatar: editAvatar,
          bio: editBio,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (user && token) {
          setUser(
            { ...user, name: data.user.name, avatar: data.user.avatar, bio: data.user.bio },
            token
          )
        }
        setSaveMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح' })
      } else {
        const data = await res.json()
        setSaveMessage({ type: 'error', text: data.error || 'حدث خطأ أثناء الحفظ' })
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'حدث خطأ في الاتصال' })
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMessage(null), 3000)
    }
  }

  // ── Delete project ──
  const handleDeleteProject = async (id: string) => {
    if (!token) return
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete project:', err)
    }
  }

  // ── Toggle publish ──
  const handleTogglePublish = async (id: string, publish: boolean) => {
    if (!token) return
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublished: publish }),
      })
      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isPublished: publish } : p))
        )
      }
    } catch (err) {
      console.error('Failed to toggle publish:', err)
    }
  }

  // ── Create new project ──
  const handleCreateProject = async () => {
    if (!token || !newProjectTitle.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newProjectTitle.trim(),
          description: newProjectDesc.trim(),
          isPublished: false,
        }),
      })
      if (res.ok) {
        setShowNewProjectDialog(false)
        setNewProjectTitle('')
        setNewProjectDesc('')
        fetchProjects()
      }
    } catch (err) {
      console.error('Failed to create project:', err)
    } finally {
      setCreating(false)
    }
  }

  // ── Open project in IDE ──
  const handleOpenProject = (project: Project) => {
    setCurrentView('ide')
  }

  // ── Stats computation ──
  const totalProjects = projects.length
  const publishedProjects = projects.filter((p) => p.isPublished).length
  const totalStars = projects.reduce((acc, p) => acc + p.stars, 0)
  const totalViews = projects.reduce((acc, p) => acc + p.views, 0)

  // ── Format member since date ──
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  if (!user) {
    return (
      <div className="min-h-screen bg-[#11111b] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="size-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">جارٍ تحميل الملف الشخصي...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#11111b]">
      {/* ─── Top Navigation Bar ─── */}
      <nav className="sticky top-0 z-50 bg-[#181825]/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Right side: back to IDE */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setCurrentView('ide')}
            >
              <ArrowRight className="size-4" />
              <span className="hidden sm:inline">العودة للمحرر</span>
            </Button>
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">G</span>
              </div>
              <span className="text-sm font-bold">
                <span className="text-emerald-400">Gemma</span>
                <span className="text-foreground">Code</span>
              </span>
            </div>
          </div>

          {/* Left side: user menu */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setCurrentView('explore')}
            >
              استكشف
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-red-400"
              onClick={logout}
              title="تسجيل الخروج"
            >
              <LogOut className="size-4" />
            </Button>
            <div className="size-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[10px] font-bold text-white">
              {user.name.charAt(0)}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ─── Profile Header ─── */}
        <Card className="bg-[#181825] border-border overflow-hidden">
          {/* Banner gradient */}
          <div className="h-28 sm:h-36 bg-gradient-to-l from-emerald-600/20 via-teal-600/10 to-transparent relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
          </div>

          <CardContent className="relative pt-0">
            {/* Avatar overlapping banner */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
              <div className="relative">
                <UserAvatar user={user} size="lg" />
                {/* Online indicator */}
                <div className="absolute bottom-1 right-1 size-4 bg-emerald-500 rounded-full border-2 border-[#181825]" />
              </div>

              <div className="flex-1 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    {user.name}
                  </h1>
                  {user.role === 'admin' ? (
                    <Badge className="w-fit gap-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      <Shield className="size-3" />
                      مشرف
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="w-fit gap-1 text-xs bg-white/5 text-muted-foreground">
                      مستخدم
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
                {user.bio && (
                  <p className="text-sm text-gray-300 mt-2 leading-relaxed max-w-xl">
                    {user.bio}
                  </p>
                )}
              </div>

              {/* Edit profile button */}
              <div className="pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs border-border text-muted-foreground hover:text-foreground hover:border-emerald-500/30"
                  onClick={() => setActiveTab('settings')}
                >
                  <Pencil className="size-3.5" />
                  تعديل الملف الشخصي
                </Button>
              </div>
            </div>

            {/* Member since */}
            {memberSince && (
              <div className="flex items-center gap-1.5 mt-4 text-muted-foreground">
                <Calendar className="size-3.5" />
                <span className="text-xs">عضو منذ {memberSince}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Tabs Section ─── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#181825] border border-border w-full sm:w-auto h-auto p-1">
            <TabsTrigger
              value="projects"
              className="gap-2 text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 flex-1 sm:flex-initial px-4 py-2"
            >
              <FolderKanban className="size-3.5" />
              مشاريعي
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="gap-2 text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 flex-1 sm:flex-initial px-4 py-2"
            >
              <Settings className="size-3.5" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          {/* ─── Projects Tab ─── */}
          <TabsContent value="projects" className="mt-4 space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatsCard
                label="إجمالي المشاريع"
                value={totalProjects}
                icon={FolderKanban}
                color="text-emerald-400"
              />
              <StatsCard
                label="منشورة"
                value={publishedProjects}
                icon={Eye}
                color="text-blue-400"
              />
              <StatsCard
                label="إجمالي النجوم"
                value={totalStars}
                icon={Star}
                color="text-amber-400"
              />
              <StatsCard
                label="إجمالي المشاهدات"
                value={totalViews}
                icon={Eye}
                color="text-purple-400"
              />
            </div>

            {/* Filter & Actions bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {(['all', 'published', 'draft'] as const).map((filter) => (
                  <Button
                    key={filter}
                    variant={projectFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    className={`text-xs h-8 ${
                      projectFilter === filter
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setProjectFilter(filter)}
                  >
                    {filter === 'all' ? 'الكل' : filter === 'published' ? 'منشورة' : 'مسودات'}
                  </Button>
                ))}
              </div>
              <Button
                size="sm"
                className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setShowNewProjectDialog(true)}
              >
                <Plus className="size-3.5" />
                إنشاء مشروع جديد
              </Button>
            </div>

            {/* Projects Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 text-emerald-400 animate-spin" />
              </div>
            ) : projects.length === 0 ? (
              <Card className="bg-[#181825] border-border">
                <CardContent className="py-12 text-center">
                  <FolderKanban className="size-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <h3 className="text-sm font-medium text-foreground mb-1">لا توجد مشاريع</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    ابدأ بإنشاء مشروعك الأول!
                  </p>
                  <Button
                    size="sm"
                    className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setShowNewProjectDialog(true)}
                  >
                    <Plus className="size-3.5" />
                    إنشاء مشروع جديد
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={(p) => handleOpenProject(p)}
                    onDelete={handleDeleteProject}
                    onPublish={handleTogglePublish}
                    onClick={handleOpenProject}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── Settings Tab ─── */}
          <TabsContent value="settings" className="mt-4">
            <Card className="bg-[#181825] border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="size-4 text-emerald-400" />
                  إعدادات الملف الشخصي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Name */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">الاسم</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="أدخل اسمك"
                    className="bg-[#11111b] border-border text-foreground text-sm"
                    dir="rtl"
                  />
                </div>

                {/* Avatar URL */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <ImageIcon className="size-3" />
                    رابط الصورة الشخصية
                  </Label>
                  <Input
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="bg-[#11111b] border-border text-foreground text-sm font-mono"
                    dir="ltr"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    أدخل رابط صورة من الإنترنت (اختياري)
                  </p>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    النبذة التعريفية
                  </Label>
                  <Textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="أخبرنا عن نفسك..."
                    className="bg-[#11111b] border-border text-foreground text-sm min-h-[100px] resize-y"
                    dir="rtl"
                    maxLength={500}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {editBio.length}/500 حرف
                  </p>
                </div>

                <Separator className="bg-border" />

                {/* Save message */}
                {saveMessage && (
                  <div
                    className={`text-xs px-3 py-2 rounded-lg ${
                      saveMessage.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {saveMessage.text}
                  </div>
                )}

                {/* Save button */}
                <Button
                  onClick={handleSaveSettings}
                  disabled={saving || !editName.trim()}
                  className="gap-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  حفظ التغييرات
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── New Project Dialog ─── */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="bg-[#1e1e2e] border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Plus className="size-4 text-emerald-400" />
              إنشاء مشروع جديد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">عنوان المشروع</Label>
              <Input
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                placeholder="أدخل عنوان المشروع"
                className="bg-[#11111b] border-border text-foreground text-sm"
                dir="rtl"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">الوصف</Label>
              <Textarea
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                placeholder="وصف مختصر للمشروع (اختياري)"
                className="bg-[#11111b] border-border text-foreground text-sm min-h-[80px] resize-y"
                dir="rtl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowNewProjectDialog(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={creating || !newProjectTitle.trim()}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {creating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              إنشاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
