'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { createClient } from '@/src/lib/supabase/client'
import { toast } from 'sonner'

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Die Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
})

type ResetPasswordData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidLink, setIsValidLink] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    // Handle the auth code exchange and check session
    const handleAuthExchange = async () => {
      try {
        // First, exchange the code from the URL for a session
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        
        if (error) {
          console.error('Error exchanging code:', error)
          setIsValidLink(false)
          return
        }
        
        // Then check if we have a valid session
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setIsValidLink(false)
        }
      } catch (error) {
        console.error('Auth exchange error:', error)
        setIsValidLink(false)
      }
    }
    
    handleAuthExchange()
  }, [supabase])

  const onSubmit = async (data: ResetPasswordData) => {
    setIsSubmitting(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) {
        toast.error(error.message || 'Fehler beim Zurücksetzen des Passworts')
      } else {
        toast.success('Ihr Passwort wurde erfolgreich zurückgesetzt')
        
        // Sign out and redirect to login
        await supabase.auth.signOut()
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } catch (error) {
      toast.error('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isValidLink) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div>
            <h2 className="text-3xl font-bold">Ungültiger Link</h2>
            <p className="mt-2 text-muted-foreground">
              Dieser Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.
              Bitte fordern Sie einen neuen Link an.
            </p>
          </div>
          <div className="mt-8">
            <Button asChild className="w-full">
              <Link href="/forgot-password">Neuen Link anfordern</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Neues Passwort festlegen</h2>
          <p className="mt-2 text-muted-foreground">
            Geben Sie Ihr neues Passwort ein.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="password">Neues Passwort</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
              className="mt-1"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
              className="mt-1"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Wird gespeichert...' : 'Passwort speichern'}
          </Button>
        </form>
      </div>
    </div>
  )
}