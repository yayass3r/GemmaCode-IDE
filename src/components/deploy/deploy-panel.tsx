'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Rocket,
  Globe,
  ExternalLink,
  Copy,
  Check,
  X,
  Trash2,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileCode,
  ArrowRight,
  ChevronDown,
  RefreshCw,
  History,
  Zap,
  Shield,
} from 'lucide-react'
import { useIDEStore } from '@/lib/store'
import { DEPLOY_PROVIDERS, type DeployProvider } from '@/lib/deploy-providers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ─── Types ──────────────────────────────────────────────────
interface DeploymentRecord {
  id: string
  title: string
  provider: string
  url: string
  status: string
  filesCount: number
  createdAt: string
  updatedAt: string
}

// ─── Provider Card ──────────────────────────────────────────
function ProviderCard({
  provider,
  isSelected,
  onClick,
}: {
  provider: DeployProvider
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 text-right ${
        isSelected
          ? 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20'
          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12]'
      }`}
    >
      {/* Selection indicator */}
      <div className={`absolute top-3 left-3 size-4 rounded-full border-2 flex items-center justify-center transition-colors ${
        isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-white/20'
      }`}>
        {isSelected && <Check className="size-2.5 text-white" />}
      </div>

      <div className={`size-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${
        isSelected ? 'bg-emerald-500/20' : 'bg-white/[0.05]'
      }`}>
        {provider.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{provider.nameAr}</span>
          {provider.isFree && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
              مجاني
            </span>
          )}
          {!provider.requiresToken && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 font-medium">
              بدون تسجيل
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          {provider.description}
        </p>
      </div>
    </button>
  )
}

// ─── Deploy Success ─────────────────────────────────────────
function DeploySuccess({
  url,
  provider,
  onCopy,
  copied,
  onNewDeploy,
}: {
  url: string
  provider: string
  onCopy: () => void
  copied: boolean
  onNewDeploy: () => void
}) {
  const providerInfo = DEPLOY_PROVIDERS.find((p) => p.id === provider)
  const [countdown, setCountdown] = useState(0)

  return (
    <div className="flex flex-col items-center text-center py-6 px-4">
      {/* Success animation */}
      <div className="relative mb-5">
        <div className="size-20 rounded-full bg-emerald-500/15 flex items-center justify-center animate-in zoom-in duration-300">
          <CheckCircle2 className="size-10 text-emerald-400" />
        </div>
        <div className="absolute -inset-2 rounded-full border-2 border-emerald-500/20 animate-ping" />
      </div>

      <h3 className="text-lg font-bold text-foreground mb-1">تم النشر بنجاح! 🎉</h3>
      <p className="text-xs text-muted-foreground mb-5">
        تم نشر مشروعك على {providerInfo?.nameAr || provider}
      </p>

      {/* URL Display */}
      <div className="w-full bg-[#11111b] border border-white/[0.08] rounded-xl p-3 mb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Globe className="size-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-foreground font-mono truncate" dir="ltr">
              {url}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 h-7 px-2 text-xs"
            onClick={onCopy}
          >
            {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
          </Button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 w-full">
        <Button
          className="flex-1 h-9 gap-2 text-xs bg-emerald-600 hover:bg-emerald-700"
          onClick={() => window.open(url, '_blank')}
        >
          <ExternalLink className="size-3.5" />
          فتح الموقع
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-9 gap-2 text-xs border-white/[0.08]"
          onClick={onNewDeploy}
        >
          <RefreshCw className="size-3.5" />
          نشر جديد
        </Button>
      </div>
    </div>
  )
}

// ─── Deployment History Item ────────────────────────────────
function HistoryItem({
  deployment,
  onDelete,
}: {
  deployment: DeploymentRecord
  onDelete: (id: string) => void
}) {
  const provider = DEPLOY_PROVIDERS.find((p) => p.id === deployment.provider)
  const isLive = deployment.status === 'live'
  const isFailed = deployment.status === 'failed'

  const date = new Date(deployment.createdAt)
  const timeStr = date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors group">
      {/* Provider icon */}
      <div className="size-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-sm shrink-0">
        {provider?.icon || '🌐'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground truncate">{deployment.title}</span>
          <span className={`size-1.5 rounded-full shrink-0 ${
            isLive ? 'bg-emerald-400' : isFailed ? 'bg-red-400' : 'bg-yellow-400'
          }`} />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground">{timeStr}</span>
          <span className="text-[10px] text-muted-foreground">•</span>
          <span className="text-[10px] text-muted-foreground">{deployment.filesCount} ملف</span>
        </div>
      </div>

      {/* URL + actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {isLive && deployment.url && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => window.open(deployment.url, '_blank')}
          >
            <ExternalLink className="size-3 text-muted-foreground hover:text-emerald-400" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-7 hover:text-red-400"
          onClick={() => onDelete(deployment.id)}
        >
          <Trash2 className="size-3 text-muted-foreground hover:text-red-400" />
        </Button>
      </div>
    </div>
  )
}

// ─── Main Deploy Panel ──────────────────────────────────────
export default function DeployPanel() {
  const { files, user, token, showDeployPanel, toggleDeployPanel, setCurrentView } = useIDEStore()
  const [step, setStep] = useState<'select' | 'config' | 'deploying' | 'success' | 'history'>('select')
  const [selectedProvider, setSelectedProvider] = useState<string>('netlify')
  const [siteName, setSiteName] = useState('')
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployResult, setDeployResult] = useState<{ url: string; provider: string } | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<DeploymentRecord[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Count deployable files
  const deployableFileCount = Object.keys(files).filter(
    (path) => !path.toLowerCase().endsWith('.md')
  ).length

  const hasIndexHtml = Object.keys(files).some(
    (path) => path.toLowerCase() === 'index.html'
  )

  // Load deployment history
  const loadHistory = useCallback(async () => {
    if (!token) return
    setIsLoadingHistory(true)
    try {
      const res = await fetch('/api/deploy', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setHistory(data.deployments || [])
      }
    } catch {
      // Silent fail
    }
    setIsLoadingHistory(false)
  }, [token])

  useEffect(() => {
    if (step === 'history' && user) {
      loadHistory()
    }
  }, [step, user, loadHistory])

  // Handle deploy
  const handleDeploy = async () => {
    if (!user || !token) {
      setCurrentView('login')
      return
    }

    if (!hasIndexHtml) {
      setError('يجب أن يحتوي المشروع على ملف index.html')
      return
    }

    setIsDeploying(true)
    setError('')
    setStep('deploying')

    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          files,
          provider: selectedProvider,
          siteName: siteName.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'حدث خطأ أثناء النشر')
        setStep('config')
        setIsDeploying(false)
        return
      }

      if (data.success) {
        setDeployResult({ url: data.deployment.url, provider: data.deployment.provider })
        setStep('success')
      } else {
        setError(data.error || 'فشل النشر')
        setStep('config')
      }
    } catch {
      setError('تعذر الاتصال بالخادم')
      setStep('config')
    }

    setIsDeploying(false)
  }

  // Handle copy URL
  const handleCopy = async () => {
    if (!deployResult?.url) return
    try {
      await navigator.clipboard.writeText(deployResult.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = deployResult.url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Handle delete deployment
  const handleDeleteDeployment = async (id: string) => {
    if (!token) return
    try {
      const res = await fetch(`/api/deploy/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setHistory((prev) => prev.filter((d) => d.id !== id))
      }
    } catch {
      // Silent fail
    }
  }

  // Handle new deploy
  const handleNewDeploy = () => {
    setStep('select')
    setDeployResult(null)
    setError('')
    setSiteName('')
  }

  // Close panel
  const handleClose = () => {
    if (toggleDeployPanel) toggleDeployPanel()
  }

  if (!showDeployPanel) return null

  // ─── Not logged in state ─────────────────────────────────
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
        <div className="relative w-full max-w-sm mx-4 bg-[#1e1e2e] border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
          <button onClick={handleClose} className="absolute top-4 left-4 text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
          <div className="text-center">
            <div className="size-14 rounded-xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <Shield className="size-7 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">تسجيل الدخول مطلوب</h3>
            <p className="text-xs text-muted-foreground mb-5">
              يجب تسجيل الدخول لنشر مشروعك على الاستضافات المجانية
            </p>
            <Button
              className="w-full h-10 gap-2 text-sm bg-emerald-600 hover:bg-emerald-700"
              onClick={() => { handleClose(); setCurrentView('login') }}
            >
              <Rocket className="size-4" />
              تسجيل الدخول
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Main panel ──────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg mx-4 bg-[#1e1e2e] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Rocket className="size-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">نشر المشروع</h2>
              <p className="text-[10px] text-muted-foreground">
                {deployableFileCount} ملف جاهز للنشر
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 gap-1.5 text-[11px] px-2 ${
                step === 'history' ? 'bg-white/10 text-foreground' : 'text-muted-foreground'
              }`}
              onClick={() => step !== 'history' ? setStep('history') : handleNewDeploy()}
            >
              <History className="size-3" />
              السجل
            </Button>
            <button onClick={handleClose} className="size-7 flex items-center justify-center rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[65vh] overflow-y-auto p-5">
          {/* ─── Step 1: Select Provider ─── */}
          {step === 'select' && (
            <div className="space-y-4">
              {/* Files summary */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <FileCode className="size-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs text-foreground font-medium">ملفات المشروع جاهزة</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {deployableFileCount} ملف سيتم نشره {hasIndexHtml ? '(يتضمن index.html)' : '⚠️ لا يوجد index.html!'}
                  </p>
                </div>
              </div>

              {/* Warning: no index.html */}
              {!hasIndexHtml && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <AlertCircle className="size-4 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-300">يجب إنشاء ملف index.html في المشروع قبل النشر</p>
                </div>
              )}

              {/* Provider selection */}
              <div>
                <Label className="text-xs font-medium text-gray-300 mb-3 block">اختر منصة الاستضافة</Label>
                <div className="space-y-2">
                  {DEPLOY_PROVIDERS.map((provider) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      isSelected={selectedProvider === provider.id}
                      onClick={() => setSelectedProvider(provider.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Continue button */}
              <Button
                className="w-full h-10 gap-2 text-sm bg-gradient-to-l from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20"
                onClick={() => setStep('config')}
                disabled={!hasIndexHtml}
              >
                <span>متابعة</span>
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}

          {/* ─── Step 2: Configure ─── */}
          {step === 'config' && (
            <div className="space-y-5">
              {/* Selected provider info */}
              {(() => {
                const provider = DEPLOY_PROVIDERS.find((p) => p.id === selectedProvider)
                return provider && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="size-10 rounded-lg bg-white/[0.05] flex items-center justify-center text-lg">
                      {provider.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{provider.nameAr}</p>
                      <p className="text-[10px] text-muted-foreground">{provider.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mr-auto h-7 text-[10px] text-muted-foreground"
                      onClick={() => setStep('select')}
                    >
                      تغيير
                    </Button>
                  </div>
                )
              })()}

              {/* Site name */}
              <div className="space-y-2">
                <Label htmlFor="site-name" className="text-xs font-medium text-gray-300">
                  اسم الموقع (اختياري)
                </Label>
                <div className="relative">
                  <Globe className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                  <Input
                    id="site-name"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value.replace(/[^a-zA-Z0-9\-_]/g, '-'))}
                    placeholder="my-awesome-project"
                    dir="ltr"
                    className="h-10 pr-10 pl-4 bg-[#11111b] border-white/[0.08] text-white placeholder:text-gray-600 text-sm font-mono"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  سيتم إنشاء رابط تلقائي إذا لم تقم بتحديد اسم
                </p>
              </div>

              {/* Deploy summary */}
              <div className="p-3 rounded-xl bg-[#11111b] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">الملفات</span>
                  <span className="text-foreground font-medium">{deployableFileCount} ملف</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">المنصة</span>
                  <span className="text-foreground font-medium">
                    {DEPLOY_PROVIDERS.find((p) => p.id === selectedProvider)?.nameAr}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">التكلفة</span>
                  <span className="text-emerald-400 font-medium">مجاني</span>
                </div>
              </div>

              {/* Error display */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-red-300">{error}</span>
                </div>
              )}

              {/* Deploy button */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-10 text-sm border-white/[0.08]"
                  onClick={() => { setError(''); setStep('select') }}
                >
                  رجوع
                </Button>
                <Button
                  className="flex-1 h-10 gap-2 text-sm bg-gradient-to-l from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-500/20"
                  onClick={handleDeploy}
                  disabled={isDeploying || !hasIndexHtml}
                >
                  {isDeploying ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      جارٍ النشر...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Rocket className="size-4" />
                      نشر الآن
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ─── Step 3: Deploying (loading) ─── */}
          {step === 'deploying' && (
            <div className="flex flex-col items-center py-12">
              <div className="relative mb-6">
                <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Loader2 className="size-8 text-emerald-400 animate-spin" />
                </div>
                <div className="absolute -inset-4 rounded-full border-2 border-dashed border-emerald-500/20 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">جارٍ نشر مشروعك...</h3>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                يتم رفع الملفات إلى {DEPLOY_PROVIDERS.find((p) => p.id === selectedProvider)?.nameAr} وتجهيز الموقع. قد يستغرق هذا بضع ثوانٍ.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {/* ─── Step 4: Success ─── */}
          {step === 'success' && deployResult && (
            <DeploySuccess
              url={deployResult.url}
              provider={deployResult.provider}
              onCopy={handleCopy}
              copied={copied}
              onNewDeploy={handleNewDeploy}
            />
          )}

          {/* ─── History ─── */}
          {step === 'history' && (
            <div className="space-y-3">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="size-5 text-emerald-400 animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-10">
                  <History className="size-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">لا توجد عمليات نشر سابقة</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">قم بنشر مشروعك الأول!</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      {history.length} عملية نشر
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] text-muted-foreground gap-1"
                      onClick={loadHistory}
                    >
                      <RefreshCw className="size-3" />
                      تحديث
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {history.map((dep) => (
                      <HistoryItem
                        key={dep.id}
                        deployment={dep}
                        onDelete={handleDeleteDeployment}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'select' && (
          <div className="px-5 py-3 border-t border-white/[0.06] bg-[#181825]/50">
            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Zap className="size-3" />
                نشر فوري
              </span>
              <span className="flex items-center gap-1">
                <Shield className="size-3" />
                آمن ومشفر
              </span>
              <span className="flex items-center gap-1">
                <Globe className="size-3" />
                SSL مجاني
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
