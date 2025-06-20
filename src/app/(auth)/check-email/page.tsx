'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EnvelopeIcon } from '@heroicons/react/24/outline'
import { Button } from '@/src/components/ui/button'
import { createClient } from '@/src/lib/supabase/client'
import { useToast } from '@/src/hooks/use-toast'

export default function CheckEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const resendEmail = async () => {
    setIsResending(true)
    try {
      // Get the user's email from localStorage (set during registration)
      const email = localStorage.getItem('pendingVerificationEmail')
      if (!email) {
        toast({
          title: 'Fehler',
          description: 'E-Mail-Adresse nicht gefunden. Bitte registrieren Sie sich erneut.',
          variant: 'destructive',
        })
        return
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) {
        toast({
          title: 'Fehler',
          description: error.message,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'E-Mail gesendet',
          description: 'Eine neue Bestätigungs-E-Mail wurde gesendet.',
        })
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten',
        variant: 'destructive',
      })
    } finally {
      setIsResending(false)
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <EnvelopeIcon className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-3xl font-bold">Überprüfen Sie Ihre E-Mail</h2>
          <p className="mt-2 text-muted-foreground">
            Wir haben Ihnen eine E-Mail mit einem Bestätigungslink gesendet.
            Bitte klicken Sie auf den Link, um Ihre E-Mail-Adresse zu verifizieren.
          </p>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Hinweis:</strong> Die E-Mail kann einige Minuten dauern. 
            Überprüfen Sie auch Ihren Spam-Ordner.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            E-Mail nicht erhalten?
          </p>
          <Button 
            onClick={resendEmail} 
            variant="outline" 
            className="w-full"
            disabled={isResending}
          >
            {isResending ? 'Wird gesendet...' : 'E-Mail erneut senden'}
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/register">Erneut registrieren</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">Zum Login</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}