'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/lib/auth/context'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireNoAuth?: boolean
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireNoAuth = false,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        router.push(redirectTo)
      } else if (requireNoAuth && user) {
        router.push('/dashboard')
      }
    }
  }, [user, loading, requireAuth, requireNoAuth, redirectTo, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return null
  }

  if (requireNoAuth && user) {
    return null
  }

  return <>{children}</>
}