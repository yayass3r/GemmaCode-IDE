'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Mail, Lock, Eye, EyeOff, Loader2, Code2, Sparkles } from 'lucide-react'
import { useIDEStore, type AuthUser } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginForm() {
  const { setUser, user, setCurrentView } = useIDEStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // If already logged in, redirect to IDE
  useEffect(() => {
    if (user) {
      setCurrentView('ide')
    }
  }, [user, setCurrentView])

  // Also check localStorage on mount (covers SSR hydration)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('gemmacode_user')
      const storedToken = localStorage.getItem('gemmacode_token')
      if (storedUser && storedToken) {
        const parsed: AuthUser = JSON.parse(storedUser)
        setUser(parsed, storedToken)
      }
    } catch {
      // Ignore parse errors
    }
  }, [setUser])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const message = data.error || 'حدث خطأ غير متوقع'
        // Translate common error messages to Arabic
        const errorMap: Record<string, string> = {
          'Email and password are required': 'البريد الإلكتروني وكلمة المرور مطلوبان',
          'Invalid email or password': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
          'This account has been suspended. Please contact support.': 'تم تعليق هذا الحساب. يرجى التواصل مع الدعم',
          'An unexpected error occurred during login': 'حدث خطأ غير متوقع أثناء تسجيل الدخول',
        }
        setError(errorMap[message] || message)
        setIsLoading(false)
        return
      }

      // Success — save user and token
      const authUser: AuthUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        avatar: data.user.avatar || '',
        bio: data.user.bio || '',
      }

      setUser(authUser, data.token)
    } catch {
      setError('تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت')
      setIsLoading(false)
    }
  }, [email, password, setUser])

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#11111b] p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/3 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 mb-4 shadow-lg shadow-emerald-500/20">
            <Code2 className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            GemmaCode
            <span className="text-emerald-400"> IDE</span>
          </h1>
          <p className="text-sm text-gray-400">
            سجّل دخولك للوصول إلى بيئة التطوير
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#181825] border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-black/40">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Display */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <span className="text-red-400 text-sm leading-relaxed">{error}</span>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-sm font-medium text-gray-300">
                البريد الإلكتروني
              </Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none" />
                <Input
                  id="login-email"
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
              <Label htmlFor="login-password" className="text-sm font-medium text-gray-300">
                كلمة المرور
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="h-11 pr-10 pl-10 bg-[#11111b] border-white/[0.08] text-white placeholder:text-gray-600 rounded-lg focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-colors"
                  disabled={isLoading}
                  autoComplete="current-password"
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
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-sm font-semibold rounded-lg bg-gradient-to-l from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  جارٍ تسجيل الدخول...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="size-4" />
                  تسجيل الدخول
                </span>
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              ليس لديك حساب؟{' '}
              <button
                type="button"
                onClick={() => setCurrentView('register')}
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors underline underline-offset-2"
              >
                سجّل الآن
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
