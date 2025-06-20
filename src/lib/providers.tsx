'use client'

import { AuthProvider } from './auth/context'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/src/components/error-boundary'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        {children}
        <Toaster position="bottom-right" richColors />
      </AuthProvider>
    </ErrorBoundary>
  )
}