'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Code2,
  User,
  Sparkles,
  Check,
  X,
} from 'lucide-react'
import { useIDEStore, type AuthUser } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/* ─── Password Strength Logic ─── */
type StrengthLevel = 'weak' | 'medium' | 'strong'

interface StrengthInfo {
  level: StrengthLevel
  label: string
  color: string
  bgColor: string
  width: string
}

function getPasswordStrength(password: string): StrengthInfo {
  let score = 0

  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 2) {
    return {
      level: 'weak',
      label: 'ضعيفة',
      color: 'text-red-400',
      bgColor: 'bg-red-500',
      width: 'w-1/3',
    }
  }
  if (score <= 3) {
    return {
      level: 'medium',
      label: 'متوسطة',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500',
      width: 'w-2/3',
    }
  }
  return {
    level: 'strong',
    label: 'قوية',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500',
    width: 'w-full',
  }
}

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getPasswordStrength(password)

  if (!password) return null

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1">
        <div className="h-1.5 flex-1 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              strength.level === 'weak' ? 'bg-red-500 w-full' :
              strength.level === 'medium' ? 'bg-yellow-500 w-full' :
              'bg-emerald-500 w-full'
            }`}
            style={{
              opacity: strength.level === 'weak' ? 1 :
                       strength.level === 'medium' ? 1 : 1,
            }}
          />
        </div>
        <div className={`h-1.5 flex-1 rounded-full bg-white/[0.06] overflow-hidden`}>
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              strength.level !== 'weak' ? strength.bgColor : ''
            }`}
            style={{ width: strength.level !== 'weak' ? '100%' : '0%' }}
          />
        </div>
        <div className="h-1.5 flex-1 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              strength.level === 'strong' ? strength.bgColor : ''
            }`}
            style={{ width: strength.level === 'strong' ? '100%' : '0%' }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${strength.color}`}>
          قوة كلمة المرور: {strength.label}
        </span>
      </div>
    </div>
  )
}

/* ─── Password Requirements ─── */
function PasswordRequirements({ password }: { password: string }) {
  const requirements = [
    { label: '6 أحرف على الأقل', met: password.length >= 6 },
    { label: 'حرف كبير وصغير', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'رقم واحد على الأقل', met: /\d/.test(password) },
    { label: 'رمز خاص', met: /[^a-zA-Z0-9]/.test(password) },
  ]

  if (!password) return null

  return (
    <div className="mt-2 space-y-1">
      {requirements.map((req) => (
        <div key={req.label} className="flex items-center gap-2">
          {req.met ? (
            <Check className="size-3 text-emerald-400 shrink-0" />
          ) : (
            <X className="size-3 text-gray-600 shrink-0" />
          )}
          <span className={`text-xs ${req.met ? 'text-gray-300' : 'text-gray-600'}`}>
            {req.label}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─── Register Form Component ─── */
export default function RegisterForm() {
  const { setUser, setCurrentView } = useIDEStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return true
    return password === confirmPassword
  }, [password, confirmPassword])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    if (name.trim().length < 2) {
      setError('الاسم يجب أن يكون حرفين على الأقل')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('يرجى إدخال بريد إلكتروني صحيح')
      return
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const message = data.error || 'حدث خطأ غير متوقع'
        const errorMap: Record<string, string> = {
          'Name, email, and password are required': 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة',
          'Name must be at least 2 characters long': 'الاسم يجب أن يكون حرفين على الأقل',
          'Please provide a valid email address': 'يرجى إدخال بريد إلكتروني صحيح',
          'Password must be at least 6 characters long': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
          'An account with this email already exists': 'يوجد حساب بالفعل بهذا البريد الإلكتروني',
          'An unexpected error occurred during registration': 'حدث خطأ غير متوقع أثناء التسجيل',
        }
        setError(errorMap[message] || message)
        setIsLoading(false)
        return
      }

      // Auto-login on successful registration
      const authUser: AuthUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        avatar: data.user.avatar || '',
        bio: '',
      }

      setUser(authUser, data.token)
    } catch {
      setError('تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت')
      setIsLoading(false)
    }
  }, [name, email, password, confirmPassword, setUser])

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#11111b] p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-emerald-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 mb-4 shadow-lg shadow-emerald-500/20">
            <Code2 className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            إنشاء حساب جديد
          </h1>
          <p className="text-sm text-gray-400">
            انضم إلى GemmaCode IDE وابدأ في التطوير
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-[#181825] border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/40">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Display */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <span className="text-red-400 text-sm leading-relaxed">{error}</span>
              </div>
            )}

            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="register-name" className="text-sm font-medium text-gray-300">
                الاسم الكامل
              </Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none" />
                <Input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك الكامل"
                  className="h-11 pr-10 pl-4 bg-[#11111b] border-white/[0.08] text-white placeholder:text-gray-600 rounded-lg focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors"
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="register-email" className="text-sm font-medium text-gray-300">
                البريد الإلكتروني
              </Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none" />
                <Input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  dir="ltr"
                  className="h-11 pr-10 pl-4 bg-[#11111b] border-white/[0.08] text-white placeholder:text-gray-600 rounded-lg focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="register-password" className="text-sm font-medium text-gray-300">
                كلمة المرور
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none" />
                <Input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل"
                  dir="ltr"
                  className="h-11 pr-10 pl-10 bg-[#11111b] border-white/[0.08] text-white placeholder:text-gray-600 rounded-lg focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <PasswordStrengthBar password={password} />
              <PasswordRequirements password={password} />
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <Label htmlFor="register-confirm" className="text-sm font-medium text-gray-300">
                تأكيد كلمة المرور
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none" />
                <Input
                  id="register-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور"
                  dir="ltr"
                  className={`h-11 pr-10 pl-10 bg-[#11111b] border-white/[0.08] text-white placeholder:text-gray-600 rounded-lg focus:ring-emerald-500/20 transition-colors ${
                    !passwordsMatch ? 'border-red-500/50 focus:border-red-500/50' : 'focus:border-emerald-500/50'
                  }`}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {!passwordsMatch && (
                <p className="text-xs text-red-400">كلمات المرور غير متطابقة</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-sm font-semibold rounded-lg bg-gradient-to-l from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 disabled:opacity-60 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  جارٍ إنشاء الحساب...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="size-4" />
                  إنشاء حساب
                </span>
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              لديك حساب بالفعل؟{' '}
              <button
                type="button"
                onClick={() => setCurrentView('login')}
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors underline underline-offset-2"
              >
                سجّل دخولك
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">
            GemmaCode IDE &mdash; بيئة تطوير متكاملة بالذكاء الاصطناعي
          </p>
        </div>
      </div>
    </div>
  )
}
