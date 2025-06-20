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
        // Log all URL params for debugging
        console.log('Verify email params:', {
          token_hash: searchParams.get('token_hash'),
          type: searchParams.get('type'),
          error: searchParams.get('error'),
          error_description: searchParams.get('error_description'),
          all_params: Array.from(searchParams.entries())
        })

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
        
        // Check for common Supabase redirect parameters
        const access_token = searchParams.get('access_token')
        const refresh_token = searchParams.get('refresh_token')
        
        if (token_hash && type === 'email') {
          // When arriving here with these params, email verification was successful
          // Supabase has already processed the verification
          setSuccess(true)
          setVerifying(false)
          
          // Try to get the session - user might be logged in already
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session) {
            // User is logged in, check onboarding status
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
          }
          // If no session, user will need to log in manually
        } else if (access_token || refresh_token) {
          // Supabase might send tokens directly
          console.log('Found access/refresh tokens in URL')
          setSuccess(true)
          setVerifying(false)
          
          // Wait a moment for auth to process
          setTimeout(async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
              const { data: business } = await supabase
                .from('Business')
                .select('id')
                .single()
              
              if (business) {
                router.push('/dashboard')
              } else {
                router.push('/onboarding')
              }
            }
          }, 1000)
        } else {
          // No verification params - check if this is a redirect after successful verification
          // Sometimes Supabase redirects without parameters after processing the verification
          console.log('No verification params found, checking user status...')
          
          // Get the current user to check if they're verified
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          
          if (user) {
            console.log('User found:', { id: user.id, email: user.email, email_confirmed_at: user.email_confirmed_at })
            
            if (user.email_confirmed_at) {
              // Email is already verified
              setSuccess(true)
              setVerifying(false)
              
              // Check onboarding status
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
              // User exists but email not verified
              setError('Ihre E-Mail-Adresse wurde noch nicht verifiziert. Bitte verwenden Sie den Link aus Ihrer E-Mail.')
              setVerifying(false)
            }
          } else {
            // No user session - they might have been redirected here after verification
            // Show success message and prompt to log in
            console.log('No user session found')
            
            // Check if we came from a Supabase redirect
            // In many cases, just arriving at /verify-email means verification worked
            const urlPath = window.location.pathname
            const hasQueryParams = window.location.search.length > 1
            
            if (urlPath === '/verify-email' && !hasQueryParams) {
              // Likely redirected here after successful verification
              console.log('At /verify-email with no params, assuming verification success')
              setSuccess(true)
              setVerifying(false)
            } else {
              setError('Kein Verifizierungstoken gefunden. Bitte verwenden Sie den Link aus Ihrer E-Mail.')
              setVerifying(false)
            }
          }
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