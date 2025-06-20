'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { Button } from '@/src/components/ui/button'
import { createClient } from '@/src/lib/supabase/client'

export default function VerifyEmailPage() {
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get the token from the URL
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setError('Ungültiger oder abgelaufener Verifizierungslink')
          setVerifying(false)
          return
        }

        if (session) {
          // Email is verified, redirect to dashboard
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        }
        
        setVerifying(false)
      } catch (err) {
        setError('Ein Fehler ist aufgetreten')
        setVerifying(false)
      }
    }

    verifyEmail()
  }, [router, supabase])

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">E-Mail wird verifiziert...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          {error ? (
            <>
              <XCircleIcon className="mx-auto h-12 w-12 text-red-500" />
              <h2 className="mt-6 text-3xl font-bold">Verifizierung fehlgeschlagen</h2>
              <p className="mt-2 text-muted-foreground">{error}</p>
              <div className="mt-6 space-y-2">
                <Button asChild className="w-full">
                  <Link href="/register">Erneut registrieren</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Zum Login</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
              <h2 className="mt-6 text-3xl font-bold">E-Mail verifiziert!</h2>
              <p className="mt-2 text-muted-foreground">
                Ihre E-Mail wurde erfolgreich verifiziert. Sie werden in Kürze weitergeleitet...
              </p>
              <div className="mt-6">
                <Button asChild className="w-full">
                  <Link href="/dashboard">Zum Dashboard</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}