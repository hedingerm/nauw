'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { Button } from '@/src/components/ui/button'
import { createClient } from '@/src/lib/supabase/client'

function VerifyEmailContent() {
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Check if there's an error in the URL params (Supabase adds this on failure)
        const errorDescription = searchParams.get('error_description')
        if (errorDescription) {
          setError(errorDescription)
          setVerifying(false)
          return
        }

        // Check if we have the necessary auth params from Supabase
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')
        
        if (token_hash && type === 'email') {
          // Supabase has already verified the email when redirecting here
          // Just check if we have a valid session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('Session error:', sessionError)
            setError('Fehler bei der Verifizierung. Bitte versuchen Sie es erneut.')
            setVerifying(false)
            return
          }

          if (session) {
            setSuccess(true)
            setVerifying(false)
            
            // Check if user has completed onboarding
            const { data: business } = await supabase
              .from('Business')
              .select('id')
              .single()
            
            // Redirect after a short delay
            setTimeout(() => {
              if (business) {
                router.push('/dashboard')
              } else {
                router.push('/onboarding')
              }
            }, 2000)
          } else {
            // No session but also no error - email was verified but user needs to log in
            setSuccess(true)
            setVerifying(false)
          }
        } else {
          // No verification params - user may have navigated here directly
          setError('Kein Verifizierungstoken gefunden. Bitte verwenden Sie den Link aus Ihrer E-Mail.')
          setVerifying(false)
        }
      } catch (err) {
        console.error('Verification error:', err)
        setError('Ein unerwarteter Fehler ist aufgetreten')
        setVerifying(false)
      }
    }

    handleEmailVerification()
  }, [router, searchParams, supabase])

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
          ) : success ? (
            <>
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
              <h2 className="mt-6 text-3xl font-bold">E-Mail verifiziert!</h2>
              <p className="mt-2 text-muted-foreground">
                Ihre E-Mail wurde erfolgreich verifiziert. Sie werden in Kürze weitergeleitet...
              </p>
              <div className="mt-6">
                <Button asChild className="w-full">
                  <Link href="/login">Zum Login</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <XCircleIcon className="mx-auto h-12 w-12 text-yellow-500" />
              <h2 className="mt-6 text-3xl font-bold">Verifizierung ausstehend</h2>
              <p className="mt-2 text-muted-foreground">
                Bitte verwenden Sie den Link in Ihrer E-Mail zur Verifizierung.
              </p>
              <div className="mt-6">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Zum Login</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Laden...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}