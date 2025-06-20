'use client'

import { AuthProvider } from './auth/context'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/src/components/error-boundary'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {children}
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </ErrorBoundary>
  )
}