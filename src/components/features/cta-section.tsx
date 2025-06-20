import Link from 'next/link'
import { Button } from '@/src/components/ui/button'

export function CTASection() {
  return (
    <section className="bg-primary">
      <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Bereit für mehr Effizienz?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/90">
            Starten Sie noch heute mit CalBok und erleben Sie, wie einfach 
            professionelle Terminverwaltung sein kann.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button
              size="lg"
              variant="secondary"
              asChild
            >
              <Link href="/register">
                30 Tage kostenlos testen
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent text-white border-white hover:bg-white/10"
              asChild
            >
              <Link href="/login">
                Bereits Kunde? Anmelden
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}