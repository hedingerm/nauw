'use client'

import Link from 'next/link'
import { Button } from '@/src/components/ui/button'
import { useAuth } from '@/src/lib/auth/context'
import { useRouter } from 'next/navigation'

export function NavigationHeader() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">nauw</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {loading ? (
            <div className="h-9 w-20 animate-pulse bg-muted rounded-md" />
          ) : user ? (
            <>
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
              >
                Dashboard
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                Abmelden
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => router.push('/login')}
              >
                Anmelden
              </Button>
              <Button onClick={() => router.push('/register')}>
                Kostenlos starten
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}