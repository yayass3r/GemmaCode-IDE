'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Megaphone,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Shield,
  ShieldOff,
  Trash2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  ToggleLeft,
  ToggleRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  UserCheck,
  X,
  Menu,
  Check,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle2,
  Send,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react'
import { useIDEStore } from '@/lib/store'
import { useIsMobile } from '@/hooks/use-mobile'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type AdminPage = 'dashboard' | 'users' | 'projects' | 'ads' | 'notifications'

interface NavItem {
  id: AdminPage
  label: string
  icon: React.ReactNode
}

interface StatsData {
  totalUsers: number
  totalProjects: number
  publishedProjects: number
  totalAds: number
  activeAds: number
  bannedUsers: number
  recentUsers: number
}

interface AdminUser {
  id: string
  name: string
  email: string
  avatar: string
  bio: string
  role: string
  isBanned: boolean
  isOnline: boolean
  lastSeen: string
  createdAt: string
  projectCount: number
}

interface AdminProject {
  id: string
  title: string
  description: string
  isPublished: boolean
  isFeatured: boolean
  isHidden: boolean
  stars: number
  views: number
  forks: number
  tags: string
  authorId: string
  author: { id: string; name: string; avatar: string } | null
  createdAt: string
  updatedAt: string
}

interface AdminAd {
  id: string
  title: string
  type: string
  code: string
  position: string
  isActive: boolean
  priority: number
  Impressions: number
  clicks: number
  createdAt: string
  updatedAt: string
}

interface AdminNotification {
  id: string
  title: string
  message: string
  type: string
  userId: string | null
  isRead: boolean
  createdAt: string
  user: { id: string; name: string; email: string } | null
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// ═══════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard className="size-4" /> },
  { id: 'users', label: 'إدارة المستخدمين', icon: <Users className="size-4" /> },
  { id: 'projects', label: 'إدارة المشاريع', icon: <FolderKanban className="size-4" /> },
  { id: 'ads', label: 'إدارة الإعلانات', icon: <Megaphone className="size-4" /> },
  { id: 'notifications', label: 'الإشعارات', icon: <Bell className="size-4" /> },
]

function Sidebar({
  activePage,
  onPageChange,
  collapsed,
  onToggleCollapse,
  userName,
  onCloseMobile,
}: {
  activePage: AdminPage
  onPageChange: (page: AdminPage) => void
  collapsed: boolean
  onToggleCollapse: () => void
  userName: string
  onCloseMobile?: () => void
}) {
  const { logout, setCurrentView } = useIDEStore()

  const handleLogout = () => {
    logout()
    setCurrentView('login')
  }

  return (
    <div
      className={`h-full flex flex-col bg-[#181825] border-l border-white/5 transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[260px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-white/5 shrink-0">
        <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shrink-0">
          <LayoutDashboard className="size-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-foreground truncate">GemmaCode</h1>
            <p className="text-[10px] text-emerald-400 font-medium">لوحة الإدارة</p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
        {navItems.map((item) => {
          const isActive = activePage === item.id
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    onPageChange(item.id)
                    onCloseMobile?.()
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <span className={`shrink-0 ${isActive ? 'text-emerald-400' : ''}`}>{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="left" className="text-xs">{item.label}</TooltipContent>}
            </Tooltip>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 py-1 hidden md:block">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-full text-muted-foreground hover:text-foreground justify-center"
        >
          {collapsed ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
        </Button>
      </div>

      {/* User info + Logout */}
      <div className="border-t border-white/5 px-3 py-3 shrink-0">
        <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
          <div className="size-8 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-700/30 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-emerald-400">{getInitials(userName || 'م')}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{userName || 'مدير'}</p>
              <p className="text-[10px] text-muted-foreground">مدير النظام</p>
            </div>
          )}
          {!collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-red-400" onClick={handleLogout}>
                  <LogOut className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">تسجيل الخروج</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MOBILE HEADER
// ═══════════════════════════════════════════════════════════════

function MobileHeader({ onMenuToggle, title }: { onMenuToggle: () => void; title: string }) {
  const { logout, setCurrentView } = useIDEStore()

  return (
    <div className="flex items-center justify-between h-12 px-3 bg-[#181825] border-b border-white/5 md:hidden">
      <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={onMenuToggle}>
        <Menu className="size-4" />
      </Button>
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-red-400"
        onClick={() => {
          logout()
          setCurrentView('login')
        }}
      >
        <LogOut className="size-3.5" />
      </Button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// STATS SKELETON
// ═══════════════════════════════════════════════════════════════

function StatsCardSkeleton() {
  return (
    <Card className="bg-[#181825] border-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="size-10 rounded-lg bg-white/5" />
        <Skeleton className="h-5 w-16 rounded-full bg-white/5" />
      </div>
      <Skeleton className="h-7 w-20 mb-1 bg-white/5" />
      <Skeleton className="h-4 w-24 bg-white/5" />
    </Card>
  )
}

function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1 bg-white/5" />
          ))}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PAGE 1: DASHBOARD STATS
// ═══════════════════════════════════════════════════════════════

function DashboardStatsPage({ token }: { token: string }) {
  const { toast } = useToast()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([])
  const [recentProjects, setRecentProjects] = useState<AdminProject[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, usersRes, projectsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: authHeaders(token) }),
        fetch('/api/admin/users?limit=5', { headers: authHeaders(token) }),
        fetch('/api/projects?limit=5', { headers: authHeaders(token) }),
      ])

      if (!statsRes.ok) throw new Error('Failed to fetch stats')
      const statsData = await statsRes.json()
      setStats(statsData)

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setRecentUsers(usersData.users || [])
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setRecentProjects(projectsData.projects || [])
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل في تحميل البيانات', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [token, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const statCards = stats
    ? [
        {
          label: 'إجمالي المستخدمين',
          value: stats.totalUsers,
          change: stats.recentUsers,
          icon: <Users className="size-5" />,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
        },
        {
          label: 'إجمالي المشاريع',
          value: stats.totalProjects,
          change: stats.publishedProjects,
          changeLabel: 'منشورة',
          icon: <FolderKanban className="size-5" />,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
        },
        {
          label: 'المشاريع المنشورة',
          value: stats.publishedProjects,
          change: stats.totalProjects > 0 ? Math.round((stats.publishedProjects / stats.totalProjects) * 100) : 0,
          changeLabel: '%',
          icon: <Eye className="size-5" />,
          color: 'text-violet-400',
          bg: 'bg-violet-500/10',
          border: 'border-violet-500/20',
        },
        {
          label: 'الإعلانات النشطة',
          value: stats.activeAds,
          change: stats.totalAds,
          changeLabel: 'إجمالي',
          icon: <Megaphone className="size-5" />,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
        },
      ]
    : []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">لوحة التحكم</h2>
          <p className="text-xs text-muted-foreground mt-0.5">نظرة عامة على المنصة والإحصائيات</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-1.5 text-xs border-border">
          <RefreshCw className={`size-3 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      {loading && !stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Card key={card.label} className="bg-[#181825] border-white/5 p-4 hover:border-emerald-500/20 transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <div className={`size-10 rounded-lg ${card.bg} flex items-center justify-center ${card.color} ${card.border} border`}>
                  {card.icon}
                </div>
                <Badge variant="outline" className="text-[10px] gap-1 border-white/10 text-muted-foreground">
                  {card.changeLabel ? (
                    <>
                      {card.change} {card.changeLabel}
                    </>
                  ) : (
                    <>
                      {card.change > 0 ? <TrendingUp className="size-2.5 text-emerald-400" /> : <TrendingDown className="size-2.5 text-red-400" />}
                      <span className={card.change > 0 ? 'text-emerald-400' : 'text-red-400'}>{card.change} جديد</span>
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value.toLocaleString('ar-EG')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Extra info row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-[#181825] border-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <ShieldOff className="size-4 text-red-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{stats.bannedUsers}</p>
                <p className="text-[11px] text-muted-foreground">حسابات محظورة</p>
              </div>
            </div>
          </Card>
          <Card className="bg-[#181825] border-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <UserCheck className="size-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{stats.recentUsers}</p>
                <p className="text-[11px] text-muted-foreground">مستخدم جديد (7 أيام)</p>
              </div>
            </div>
          </Card>
          <Card className="bg-[#181825] border-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <TrendingUp className="size-4 text-amber-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  {stats.totalUsers > 0 ? Math.round((stats.publishedProjects / stats.totalProjects) * 100) : 0}%
                </p>
                <p className="text-[11px] text-muted-foreground">معدل النشر</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Recent Users Table */}
      <Card className="bg-[#181825] border-white/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">آخر المستخدمين</h3>
          <Badge variant="outline" className="text-[10px] border-white/10">{recentUsers.length} مستخدم</Badge>
        </div>
        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={3} cols={4} />
          </div>
        ) : recentUsers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs">لا يوجد مستخدمين بعد</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[11px] text-muted-foreground font-medium">الاسم</TableHead>
                  <TableHead className="text-[11px] text-muted-foreground font-medium">البريد</TableHead>
                  <TableHead className="text-[11px] text-muted-foreground font-medium">الدور</TableHead>
                  <TableHead className="text-[11px] text-muted-foreground font-medium">الحالة</TableHead>
                  <TableHead className="text-[11px] text-muted-foreground font-medium">الانضمام</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((u) => (
                  <TableRow key={u.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-emerald-400">{getInitials(u.name)}</span>
                        </div>
                        <span className="text-xs text-foreground font-medium">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${u.role === 'admin' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-muted-foreground border-white/10'}`}>
                        {u.role === 'admin' ? 'مدير' : 'مستخدم'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full ${u.isOnline ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                        <span className="text-xs text-muted-foreground">{u.isBanned ? 'محظور' : u.isOnline ? 'متصل' : 'غير متصل'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Recent Projects Table */}
      <Card className="bg-[#181825] border-white/5 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">آخر المشاريع</h3>
          <Badge variant="outline" className="text-[10px] border-white/10">{recentProjects.length} مشروع</Badge>
        </div>
        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={3} cols={4} />
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs">لا يوجد مشاريع بعد</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[11px] text-muted-foreground font-medium">العنوان</TableHead>
                  <TableHead className="text-[11px] text-muted-foreground font-medium">المؤلف</TableHead>
                  <TableHead className="text-[11px] text-muted-foreground font-medium">الحالة</TableHead>
                  <TableHead className="text-[11px] text-muted-foreground font-medium">المشاهدات</TableHead>
                  <TableHead className="text-[11px] text-muted-foreground font-medium">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentProjects.map((p) => (
                  <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="text-xs text-foreground font-medium max-w-[200px] truncate">{p.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.author?.name || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {p.isPublished && <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30">منشور</Badge>}
                        {p.isFeatured && <Badge className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/30">مميز</Badge>}
                        {!p.isPublished && <Badge className="text-[10px] bg-yellow-500/15 text-yellow-400 border-yellow-500/30">مسودة</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.views}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PAGE 2: USERS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function UsersManagementPage({ token }: { token: string }) {
  const { toast } = useToast()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Dialogs
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [newRole, setNewRole] = useState('user')

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [deleteUserName, setDeleteUserName] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/users?${params}`, { headers: authHeaders(token) })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setUsers(data.users || [])
      setPagination(data.pagination || null)
    } catch {
      toast({ title: 'خطأ', description: 'فشل في تحميل المستخدمين', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [token, search, page, toast])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Actions
  const handleRoleChange = async () => {
    if (!selectedUser) return
    setActionLoading(selectedUser.id)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ userId: selectedUser.id, role: newRole }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      toast({ title: 'تم بنجاح', description: `تم تغيير دور ${selectedUser.name} إلى ${newRole === 'admin' ? 'مدير' : 'مستخدم'}` })
      setRoleDialogOpen(false)
      fetchUsers()
    } catch (e: unknown) {
      toast({ title: 'خطأ', description: e instanceof Error ? e.message : 'فشل في تغيير الدور', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleBan = async (user: AdminUser) => {
    setActionLoading(user.id)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ userId: user.id, isBanned: !user.isBanned }),
      })
      if (!res.ok) throw new Error()
      toast({
        title: 'تم بنجاح',
        description: user.isBanned ? `تم إلغاء حظر ${user.name}` : `تم حظر ${user.name}`,
      })
      fetchUsers()
    } catch {
      toast({ title: 'خطأ', description: 'فشل في تحديث الحالة', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteUserId) return
    setActionLoading(deleteUserId)
    try {
      const res = await fetch(`/api/admin/users/${deleteUserId}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      toast({ title: 'تم بنجاح', description: `تم حذف المستخدم "${deleteUserName}"` })
      setDeleteDialogOpen(false)
      fetchUsers()
    } catch (e: unknown) {
      toast({ title: 'خطأ', description: e instanceof Error ? e.message : 'فشل في حذف المستخدم', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const openRoleDialog = (user: AdminUser) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setRoleDialogOpen(true)
  }

  const openDeleteDialog = (user: AdminUser) => {
    setDeleteUserId(user.id)
    setDeleteUserName(user.name)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">إدارة المستخدمين</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pagination?.total ? `${pagination.total} مستخدم مسجل` : 'إدارة حسابات المستخدمين'}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو البريد..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="bg-[#11111b] border-white/10 text-xs h-9 pr-9 focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card className="bg-[#181825] border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[11px] text-muted-foreground font-medium">الاسم</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium">البريد</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium">الدور</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium">الحالة</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium">الانضمام</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium">المشاريع</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5 hover:bg-transparent">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20 bg-white/5" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs">
                    لا يوجد مستخدمين
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-emerald-400">{getInitials(user.name)}</span>
                        </div>
                        <span className="text-xs text-foreground font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${user.role === 'admin' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-muted-foreground border-white/10'}`}>
                        {user.role === 'admin' ? 'مدير' : 'مستخدم'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full ${user.isBanned ? 'bg-red-400' : user.isOnline ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                        <span className={`text-xs ${user.isBanned ? 'text-red-400' : 'text-muted-foreground'}`}>
                          {user.isBanned ? 'محظور' : user.isOnline ? 'متصل' : 'غير متصل'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{user.projectCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" disabled={actionLoading === user.id}>
                              {actionLoading === user.id ? <Loader2 className="size-3.5 animate-spin" /> : <MoreHorizontal className="size-3.5" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1e1e2e] border-white/10 w-40">
                            <DropdownMenuItem onClick={() => openRoleDialog(user)} className="text-xs gap-2 text-foreground focus:bg-white/5 cursor-pointer">
                              <Shield className="size-3.5 text-amber-400" />
                              تغيير الدور
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleBan(user)} className="text-xs gap-2 focus:bg-white/5 cursor-pointer">
                              {user.isBanned ? (
                                <>
                                  <ShieldOff className="size-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">إلغاء الحظر</span>
                                </>
                              ) : (
                                <>
                                  <ShieldOff className="size-3.5 text-red-400" />
                                  <span className="text-red-400">حظر</span>
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem onClick={() => openDeleteDialog(user)} className="text-xs gap-2 focus:bg-white/5 cursor-pointer">
                              <Trash2 className="size-3.5 text-red-400" />
                              <span className="text-red-400">حذف</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <p className="text-[11px] text-muted-foreground">
              صفحة {pagination.page} من {pagination.totalPages}
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="h-7 text-[11px] border-border"
              >
                السابق
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNext}
                className="h-7 text-[11px] border-border"
              >
                التالي
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="bg-[#1e1e2e] border-white/10 sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">تغيير دور المستخدم</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              تغيير دور {selectedUser?.name} من {selectedUser?.role === 'admin' ? 'مدير' : 'مستخدم'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="bg-[#11111b] border-white/10 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1e2e] border-white/10">
                <SelectItem value="user" className="text-xs">مستخدم</SelectItem>
                <SelectItem value="admin" className="text-xs">مدير</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setRoleDialogOpen(false)} className="text-xs border-border">
              إلغاء
            </Button>
            <Button size="sm" onClick={handleRoleChange} disabled={actionLoading !== null} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              {actionLoading ? <Loader2 className="size-3 animate-spin" /> : 'تأكيد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1e1e2e] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold">حذف المستخدم</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              هل أنت متأكد من حذف المستخدم &quot;{deleteUserName}&quot؛؟ سيتم حذف جميع بياناته ومشاريعه نهائيًا.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-xs border-border">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading !== null}
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
            >
              {actionLoading ? <Loader2 className="size-3 animate-spin" /> : 'حذف نهائي'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PAGE 3: PROJECTS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function ProjectsManagementPage({ token }: { token: string }) {
  const { toast } = useToast()
  const [projects, setProjects] = useState<AdminProject[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null)
  const [deleteProjectTitle, setDeleteProjectTitle] = useState('')

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      // Use admin users endpoint for all projects or public endpoint for published
      // We'll use the projects endpoint and fetch all
      const res = await fetch(`/api/projects?${params}&limit=100`, { headers: authHeaders(token) })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      let filtered = data.projects || []

      // Apply client-side filters since public endpoint only returns published
      if (filter !== 'all') {
        filtered = filtered.filter((p: AdminProject) => {
          if (filter === 'published') return p.isPublished
          if (filter === 'featured') return p.isFeatured
          return true
        })
      }

      setProjects(filtered)
      setPagination(data.pagination || null)
    } catch {
      toast({ title: 'خطأ', description: 'فشل في تحميل المشاريع', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [token, search, page, filter, toast])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const updateProject = async (id: string, data: Record<string, unknown>) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'تم بنجاح', description: 'تم تحديث المشروع' })
      fetchProjects()
    } catch {
      toast({ title: 'خطأ', description: 'فشل في تحديث المشروع', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteProjectId) return
    setActionLoading(deleteProjectId)
    try {
      const res = await fetch(`/api/projects/${deleteProjectId}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'تم بنجاح', description: 'تم حذف المشروع' })
      setDeleteDialogOpen(false)
      fetchProjects()
    } catch {
      toast({ title: 'خطأ', description: 'فشل في حذف المشروع', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (project: AdminProject) => {
    if (project.isHidden) return <Badge className="text-[10px] bg-gray-500/15 text-gray-400 border-gray-500/30">مخفي</Badge>
    if (project.isFeatured) return <Badge className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/30">مميز</Badge>
    if (project.isPublished) return <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/30">منشور</Badge>
    return <Badge className="text-[10px] bg-yellow-500/15 text-yellow-400 border-yellow-500/30">مسودة</Badge>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">إدارة المشاريع</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pagination?.total ? `${pagination.total} مشروع` : 'إدارة مشاريع المنصة'}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="bg-[#11111b] border-white/10 text-xs h-9 pr-9 focus:border-emerald-500/50"
            />
          </div>
          <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1) }}>
            <SelectTrigger className="bg-[#11111b] border-white/10 text-xs h-9 w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1e1e2e] border-white/10">
              <SelectItem value="all" className="text-xs">الكل</SelectItem>
              <SelectItem value="published" className="text-xs">منشور</SelectItem>
              <SelectItem value="featured" className="text-xs">مميز</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Table */}
      <Card className="bg-[#181825] border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[11px] text-muted-foreground font-medium">العنوان</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium">المؤلف</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium">الحالة</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium">المشاهدات</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium">النجوم</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium">التاريخ</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5 hover:bg-transparent">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20 bg-white/5" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs">
                    لا يوجد مشاريع
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="text-xs text-foreground font-medium max-w-[200px] truncate">{project.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{project.author?.name || '—'}</TableCell>
                    <TableCell>{getStatusBadge(project)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{project.views}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="size-3 text-amber-400" />
                        {project.stars}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(project.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" disabled={actionLoading === project.id}>
                              {actionLoading === project.id ? <Loader2 className="size-3.5 animate-spin" /> : <MoreHorizontal className="size-3.5" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1e1e2e] border-white/10 w-44">
                            <DropdownMenuItem
                              onClick={() => updateProject(project.id, { isPublished: !project.isPublished })}
                              className="text-xs gap-2 focus:bg-white/5 cursor-pointer"
                            >
                              {project.isPublished ? <EyeOff className="size-3.5 text-yellow-400" /> : <Eye className="size-3.5 text-emerald-400" />}
                              {project.isPublished ? 'إلغاء النشر' : 'نشر'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateProject(project.id, { isFeatured: !project.isFeatured })}
                              className="text-xs gap-2 focus:bg-white/5 cursor-pointer"
                            >
                              {project.isFeatured ? <StarOff className="size-3.5 text-gray-400" /> : <Star className="size-3.5 text-amber-400" />}
                              {project.isFeatured ? 'إلغاء التمييز' : 'تمييز'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateProject(project.id, { isHidden: !project.isHidden })}
                              className="text-xs gap-2 focus:bg-white/5 cursor-pointer"
                            >
                              {project.isHidden ? <Eye className="size-3.5 text-emerald-400" /> : <EyeOff className="size-3.5 text-gray-400" />}
                              {project.isHidden ? 'إظهار' : 'إخفاء'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem
                              onClick={() => {
                                setDeleteProjectId(project.id)
                                setDeleteProjectTitle(project.title)
                                setDeleteDialogOpen(true)
                              }}
                              className="text-xs gap-2 focus:bg-white/5 cursor-pointer"
                            >
                              <Trash2 className="size-3.5 text-red-400" />
                              <span className="text-red-400">حذف</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
            <p className="text-[11px] text-muted-foreground">
              صفحة {pagination.page} من {pagination.totalPages}
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="h-7 text-[11px] border-border"
              >
                السابق
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNext}
                className="h-7 text-[11px] border-border"
              >
                التالي
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1e1e2e] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold">حذف المشروع</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              هل أنت متأكد من حذف المشروع &quot;{deleteProjectTitle}&quot؛؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-xs border-border">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading !== null}
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
            >
              {actionLoading ? <Loader2 className="size-3 animate-spin" /> : 'حذف نهائي'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PAGE 4: ADS MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function AdsManagementPage({ token }: { token: string }) {
  const { toast } = useToast()
  const [ads, setAds] = useState<AdminAd[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Create/Edit Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAd, setEditingAd] = useState<AdminAd | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formType, setFormType] = useState('custom')
  const [formPosition, setFormPosition] = useState('header')
  const [formCode, setFormCode] = useState('')
  const [formPriority, setFormPriority] = useState(0)
  const [formActive, setFormActive] = useState(true)
  const [formLoading, setFormLoading] = useState(false)

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteAdId, setDeleteAdId] = useState<string | null>(null)
  const [deleteAdTitle, setDeleteAdTitle] = useState('')

  const fetchAds = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ads', { headers: authHeaders(token) })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAds(data.ads || [])
    } catch {
      toast({ title: 'خطأ', description: 'فشل في تحميل الإعلانات', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [token, toast])

  useEffect(() => {
    fetchAds()
  }, [fetchAds])

  const openCreateDialog = () => {
    setEditingAd(null)
    setFormTitle('')
    setFormType('custom')
    setFormPosition('header')
    setFormCode('')
    setFormPriority(0)
    setFormActive(true)
    setDialogOpen(true)
  }

  const openEditDialog = (ad: AdminAd) => {
    setEditingAd(ad)
    setFormTitle(ad.title)
    setFormType(ad.type)
    setFormPosition(ad.position)
    setFormCode(ad.code)
    setFormPriority(ad.priority)
    setFormActive(ad.isActive)
    setDialogOpen(true)
  }

  const handleSubmitForm = async () => {
    if (!formTitle.trim()) {
      toast({ title: 'تنبيه', description: 'عنوان الإعلان مطلوب', variant: 'destructive' })
      return
    }
    setFormLoading(true)
    try {
      const body = {
        title: formTitle.trim(),
        type: formType,
        position: formPosition,
        code: formCode,
        priority: formPriority,
        isActive: formActive,
      }

      if (editingAd) {
        const res = await fetch(`/api/admin/ads/${editingAd.id}`, {
          method: 'PUT',
          headers: authHeaders(token),
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error()
        toast({ title: 'تم بنجاح', description: 'تم تحديث الإعلان' })
      } else {
        const res = await fetch('/api/admin/ads', {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error()
        toast({ title: 'تم بنجاح', description: 'تم إنشاء الإعلان' })
      }
      setDialogOpen(false)
      fetchAds()
    } catch {
      toast({ title: 'خطأ', description: 'فشل في حفظ الإعلان', variant: 'destructive' })
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleActive = async (ad: AdminAd) => {
    setActionLoading(ad.id)
    try {
      const res = await fetch(`/api/admin/ads/${ad.id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({ isActive: !ad.isActive }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'تم بنجاح', description: ad.isActive ? 'تم تعطيل الإعلان' : 'تم تفعيل الإعلان' })
      fetchAds()
    } catch {
      toast({ title: 'خطأ', description: 'فشل في تحديث الإعلان', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteAdId) return
    setActionLoading(deleteAdId)
    try {
      const res = await fetch(`/api/admin/ads/${deleteAdId}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'تم بنجاح', description: 'تم حذف الإعلان' })
      setDeleteDialogOpen(false)
      fetchAds()
    } catch {
      toast({ title: 'خطأ', description: 'فشل في حذف الإعلان', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const getTypeBadge = (type: string) => {
    const map: Record<string, string> = {
      adsense: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      admob: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      custom: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    }
    const labels: Record<string, string> = { adsense: 'AdSense', admob: 'AdMob', custom: 'مخصص' }
    return <Badge className={`text-[10px] ${map[type] || map.custom}`}>{labels[type] || type}</Badge>
  }

  const getPositionBadge = (position: string) => {
    const labels: Record<string, string> = { header: 'الهيدر', sidebar: 'الشريط الجانبي', footer: 'الفوتر', inline: 'داخلي' }
    return <Badge className="text-[10px] bg-white/5 text-muted-foreground border-white/10">{labels[position] || position}</Badge>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">إدارة الإعلانات</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{ads.length} إعلان مسجل</p>
        </div>
        <Button size="sm" onClick={openCreateDialog} className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="size-3.5" />
          إضافة إعلان جديد
        </Button>
      </div>

      {/* Ads Table */}
      <Card className="bg-[#181825] border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[11px] text-muted-foreground font-medium">العنوان</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium">النوع</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium">الموقع</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium">الحالة</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium">الأولوية</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium">التاريخ</TableHead>
                <TableHead className="text-[11px] text-muted-foreground font-medium text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5 hover:bg-transparent">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20 bg-white/5" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : ads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs">
                    لا يوجد إعلانات بعد
                  </TableCell>
                </TableRow>
              ) : (
                ads.map((ad) => (
                  <TableRow key={ad.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="text-xs text-foreground font-medium">{ad.title}</TableCell>
                    <TableCell>{getTypeBadge(ad.type)}</TableCell>
                    <TableCell>{getPositionBadge(ad.position)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full ${ad.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span className={`text-xs ${ad.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {ad.isActive ? 'نشط' : 'معطل'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{ad.priority}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(ad.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" disabled={actionLoading === ad.id}>
                              {actionLoading === ad.id ? <Loader2 className="size-3.5 animate-spin" /> : <MoreHorizontal className="size-3.5" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1e1e2e] border-white/10 w-40">
                            <DropdownMenuItem onClick={() => openEditDialog(ad)} className="text-xs gap-2 focus:bg-white/5 cursor-pointer">
                              <Pencil className="size-3.5 text-amber-400" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(ad)} className="text-xs gap-2 focus:bg-white/5 cursor-pointer">
                              {ad.isActive ? (
                                <>
                                  <ToggleLeft className="size-3.5 text-red-400" />
                                  <span className="text-red-400">تعطيل</span>
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="size-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">تفعيل</span>
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem
                              onClick={() => {
                                setDeleteAdId(ad.id)
                                setDeleteAdTitle(ad.title)
                                setDeleteDialogOpen(true)
                              }}
                              className="text-xs gap-2 focus:bg-white/5 cursor-pointer"
                            >
                              <Trash2 className="size-3.5 text-red-400" />
                              <span className="text-red-400">حذف</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1e1e2e] border-white/10 sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {editingAd ? 'تعديل الإعلان' : 'إنشاء إعلان جديد'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {editingAd ? `تعديل "${editingAd.title}"` : 'أدخل بيانات الإعلان الجديد'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">العنوان</label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="عنوان الإعلان"
                className="bg-[#11111b] border-white/10 text-xs focus:border-emerald-500/50"
              />
            </div>

            {/* Type & Position */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">النوع</label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger className="bg-[#11111b] border-white/10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1e2e] border-white/10">
                    <SelectItem value="adsense" className="text-xs">Google AdSense</SelectItem>
                    <SelectItem value="admob" className="text-xs">Google AdMob</SelectItem>
                    <SelectItem value="custom" className="text-xs">مخصص</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">الموقع</label>
                <Select value={formPosition} onValueChange={setFormPosition}>
                  <SelectTrigger className="bg-[#11111b] border-white/10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1e2e] border-white/10">
                    <SelectItem value="header" className="text-xs">الهيدر</SelectItem>
                    <SelectItem value="sidebar" className="text-xs">الشريط الجانبي</SelectItem>
                    <SelectItem value="footer" className="text-xs">الفوتر</SelectItem>
                    <SelectItem value="inline" className="text-xs">داخلي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">كود الإعلان</label>
              <Textarea
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="<script>...</script>"
                rows={4}
                className="bg-[#11111b] border-white/10 text-xs font-mono focus:border-emerald-500/50 resize-none"
                dir="ltr"
              />
            </div>

            {/* Priority & Active */}
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">الأولوية</label>
                <Input
                  type="number"
                  value={formPriority}
                  onChange={(e) => setFormPriority(parseInt(e.target.value) || 0)}
                  min={0}
                  className="bg-[#11111b] border-white/10 text-xs w-24 focus:border-emerald-500/50"
                  dir="ltr"
                />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <label className="text-xs font-medium text-foreground">نشط</label>
                <Switch checked={formActive} onCheckedChange={setFormActive} />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-xs border-border">
              إلغاء
            </Button>
            <Button size="sm" onClick={handleSubmitForm} disabled={formLoading} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              {formLoading ? <Loader2 className="size-3 animate-spin" /> : editingAd ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1e1e2e] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold">حذف الإعلان</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              هل أنت متأكد من حذف الإعلان &quot;{deleteAdTitle}&quot؛؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-xs border-border">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading !== null}
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
            >
              {actionLoading ? <Loader2 className="size-3 animate-spin" /> : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PAGE 5: NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

function NotificationsManagementPage({ token }: { token: string }) {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Send Dialog
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifType, setNotifType] = useState('info')
  const [notifTarget, setNotifTarget] = useState<'broadcast' | 'specific'>('broadcast')
  const [notifUserId, setNotifUserId] = useState('')
  const [sendLoading, setSendLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/notifications', { headers: authHeaders(token) })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setNotifications(data.notifications || [])
    } catch {
      toast({ title: 'خطأ', description: 'فشل في تحميل الإشعارات', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [token, toast])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleSend = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      toast({ title: 'تنبيه', description: 'العنوان والرسالة مطلوبان', variant: 'destructive' })
      return
    }
    setSendLoading(true)
    try {
      const body: Record<string, unknown> = {
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        type: notifType,
        userId: notifTarget === 'specific' ? notifUserId : null,
      }

      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      toast({ title: 'تم بنجاح', description: 'تم إرسال الإشعار' })
      setSendDialogOpen(false)
      setNotifTitle('')
      setNotifMessage('')
      setNotifType('info')
      setNotifTarget('broadcast')
      setNotifUserId('')
      fetchNotifications()
    } catch (e: unknown) {
      toast({ title: 'خطأ', description: e instanceof Error ? e.message : 'فشل في إرسال الإشعار', variant: 'destructive' })
    } finally {
      setSendLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/notifications?id=${id}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'تم بنجاح', description: 'تم حذف الإشعار' })
      fetchNotifications()
    } catch {
      toast({ title: 'خطأ', description: 'فشل في حذف الإشعار', variant: 'destructive' })
    } finally {
      setActionLoading(null)
    }
  }

  const getTypeBadge = (type: string) => {
    const map: Record<string, { cls: string; icon: React.ReactNode }> = {
      info: { cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: <Info className="size-3" /> },
      warning: { cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: <AlertTriangle className="size-3" /> },
      success: { cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: <CheckCircle2 className="size-3" /> },
      error: { cls: 'bg-red-500/15 text-red-400 border-red-500/30', icon: <AlertCircle className="size-3" /> },
    }
    const config = map[type] || map.info
    return (
      <Badge className={`text-[10px] gap-1 ${config.cls}`}>
        {config.icon}
        {type === 'info' ? 'معلومة' : type === 'warning' ? 'تحذير' : type === 'success' ? 'نجاح' : 'خطأ'}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">الإشعارات</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{notifications.length} إشعار</p>
        </div>
        <Button size="sm" onClick={() => setSendDialogOpen(true)} className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
          <Send className="size-3.5" />
          إرسال إشعار جديد
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-[#181825] border-white/5 p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-40 bg-white/5" />
                  <Skeleton className="h-3 w-60 bg-white/5" />
                </div>
                <Skeleton className="h-8 w-8 bg-white/5" />
              </div>
            </Card>
          ))
        ) : notifications.length === 0 ? (
          <Card className="bg-[#181825] border-white/5 p-12 text-center">
            <Bell className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">لا يوجد إشعارات بعد</p>
          </Card>
        ) : (
          notifications.map((notif) => (
            <Card key={notif.id} className="bg-[#181825] border-white/5 p-4 hover:border-emerald-500/10 transition-colors">
              <div className="flex items-start gap-3">
                {/* Type icon */}
                <div className={`shrink-0 mt-0.5 size-8 rounded-lg flex items-center justify-center ${
                  notif.type === 'info' ? 'bg-blue-500/10 text-blue-400' :
                  notif.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
                  notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                  'bg-red-500/10 text-red-400'
                }`}>
                  {notif.type === 'info' ? <Info className="size-4" /> :
                   notif.type === 'warning' ? <AlertTriangle className="size-4" /> :
                   notif.type === 'success' ? <CheckCircle2 className="size-4" /> :
                   <AlertCircle className="size-4" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-foreground truncate">{notif.title}</h4>
                    {getTypeBadge(notif.type)}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">{notif.message}</p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {notif.userId ? (
                        <>
                          <Users className="size-2.5" />
                          {notif.user?.name || 'مستخدم محدد'}
                        </>
                      ) : (
                        <>
                          <Megaphone className="size-2.5" />
                          إذاعة عامة
                        </>
                      )}
                    </span>
                    <span>{formatDateTime(notif.createdAt)}</span>
                  </div>
                </div>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-red-400 shrink-0"
                  onClick={() => handleDelete(notif.id)}
                  disabled={actionLoading === notif.id}
                >
                  {actionLoading === notif.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Send Notification Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="bg-[#1e1e2e] border-white/10 sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">إرسال إشعار جديد</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              أرسل إشعارًا للمستخدمين
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">العنوان</label>
              <Input
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="عنوان الإشعار"
                className="bg-[#11111b] border-white/10 text-xs focus:border-emerald-500/50"
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">الرسالة</label>
              <Textarea
                value={notifMessage}
                onChange={(e) => setNotifMessage(e.target.value)}
                placeholder="محتوى الإشعار..."
                rows={3}
                className="bg-[#11111b] border-white/10 text-xs focus:border-emerald-500/50 resize-none"
              />
            </div>

            {/* Type & Target */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">النوع</label>
                <Select value={notifType} onValueChange={setNotifType}>
                  <SelectTrigger className="bg-[#11111b] border-white/10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1e2e] border-white/10">
                    <SelectItem value="info" className="text-xs">معلومة</SelectItem>
                    <SelectItem value="warning" className="text-xs">تحذير</SelectItem>
                    <SelectItem value="success" className="text-xs">نجاح</SelectItem>
                    <SelectItem value="error" className="text-xs">خطأ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">الاستهداف</label>
                <Select value={notifTarget} onValueChange={(v: string) => setNotifTarget(v as 'broadcast' | 'specific')}>
                  <SelectTrigger className="bg-[#11111b] border-white/10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1e2e] border-white/10">
                    <SelectItem value="broadcast" className="text-xs">جميع المستخدمين</SelectItem>
                    <SelectItem value="specific" className="text-xs">مستخدم محدد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* User ID input for specific target */}
            {notifTarget === 'specific' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">معرف المستخدم</label>
                <Input
                  value={notifUserId}
                  onChange={(e) => setNotifUserId(e.target.value)}
                  placeholder="أدخل ID المستخدم..."
                  className="bg-[#11111b] border-white/10 text-xs focus:border-emerald-500/50"
                  dir="ltr"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setSendDialogOpen(false)} className="text-xs border-border">
              إلغاء
            </Button>
            <Button size="sm" onClick={handleSend} disabled={sendLoading} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              {sendLoading ? <Loader2 className="size-3 animate-spin" /> : <><Send className="size-3 mr-1" /> إرسال</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN ADMIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function AdminDashboard() {
  const { user, token, setCurrentView } = useIDEStore()
  const isMobile = useIsMobile()
  const [activePage, setActivePage] = useState<AdminPage>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Admin check — redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      setCurrentView('ide')
    }
  }, [user, setCurrentView])

  // Don't render if not admin or no token
  if (!user || user.role !== 'admin' || !token) {
    return (
      <div className="h-dvh w-dvw bg-[#11111b] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-8 text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">جارٍ التحقق...</p>
        </div>
      </div>
    )
  }

  const pageTitles: Record<AdminPage, string> = {
    dashboard: 'لوحة التحكم',
    users: 'إدارة المستخدمين',
    projects: 'إدارة المشاريع',
    ads: 'إدارة الإعلانات',
    notifications: 'الإشعارات',
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardStatsPage token={token} />
      case 'users':
        return <UsersManagementPage token={token} />
      case 'projects':
        return <ProjectsManagementPage token={token} />
      case 'ads':
        return <AdsManagementPage token={token} />
      case 'notifications':
        return <NotificationsManagementPage token={token} />
      default:
        return <DashboardStatsPage token={token} />
    }
  }

  return (
    <div className="h-dvh w-dvw bg-[#11111b] flex overflow-hidden" dir="rtl">
      {/* Mobile Sidebar Overlay */}
      {isMobile && mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      {isMobile && mobileSidebarOpen && (
        <div className="fixed top-0 right-0 z-50 h-full">
          <Sidebar
            activePage={activePage}
            onPageChange={(p) => { setActivePage(p); setMobileSidebarOpen(false) }}
            collapsed={false}
            onToggleCollapse={() => {}}
            userName={user.name}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar
          activePage={activePage}
          onPageChange={setActivePage}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          userName={user.name}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        {isMobile && (
          <MobileHeader
            onMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            title={pageTitles[activePage]}
          />
        )}

        {/* Scrollable Content */}
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}
        >
          {/* Desktop breadcrumb-like header */}
          {!isMobile && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 flex items-center justify-center">
                  <LayoutDashboard className="size-4 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-foreground">{pageTitles[activePage]}</h1>
                  <p className="text-[11px] text-muted-foreground">مرحبًا، {user.name}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('ide')}
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <ArrowUpDown className="size-3" />
                العودة للمحرر
              </Button>
            </div>
          )}

          {renderPage()}
        </main>
      </div>
    </div>
  )
}
