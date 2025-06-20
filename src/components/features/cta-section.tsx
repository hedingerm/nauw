import Link from 'next/link'
import { Button } from '@/src/components/ui/button'

export function CTASection() {
  return (
    <section className="bg-primary">
      <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8 inline-flex items-center rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white">
            🎯 Über 250.000 Termine erfolgreich gebucht
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Schliessen Sie sich 500+ erfolgreichen Schweizer Unternehmen an
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/90">
            Jede Stunde ohne nauw ist eine verlorene Stunde. Starten Sie jetzt und 
            erleben Sie schon morgen, wie viel Zeit Sie sparen können.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button
              size="lg"
              variant="secondary"
              className="group"
              asChild
            >
              <Link href="/register">
                <span>Jetzt starten – 30 Tage gratis</span>
                <svg className="ml-2 -mr-1 h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
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
          <div className="mt-8 flex items-center justify-center gap-x-8 text-sm text-white/80">
            <span className="flex items-center gap-x-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Keine Kreditkarte nötig
            </span>
            <span className="flex items-center gap-x-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Setup in 15 Minuten
            </span>
            <span className="flex items-center gap-x-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Jederzeit kündbar
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}