'use client'

import React from 'react'
import { useIDEStore } from '@/lib/store'
import LoginForm from '@/components/auth/login-form'
import RegisterForm from '@/components/auth/register-form'

/**
 * AuthGuard — protects views that require authentication.
 *
 * - If user is logged in (from store), renders children.
 * - If not logged in, shows the login or register form based on currentView.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, currentView } = useIDEStore()

  // Not authenticated — show auth forms
  if (!user) {
    return (
      <>
        {currentView === 'register' ? <RegisterForm /> : <LoginForm />}
      </>
    )
  }

  // Authenticated — render protected content
  return <>{children}</>
}
