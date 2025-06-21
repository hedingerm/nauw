import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/src/components/ui/button'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Nie wieder verpasste Termine – 
          <span className="text-primary">Die Terminbuchung, die Ihre Kunden lieben werden</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Reduzieren Sie No-Shows um bis zu 70% und sparen Sie 10+ Stunden pro Woche 
          mit automatischer Terminverwaltung. Speziell entwickelt für Schweizer Unternehmen.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button size="lg" asChild>
            <Link href="/register">
              Jetzt kostenlos starten
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="#features">
              Mehr erfahren
            </Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Keine Kreditkarte erforderlich • 30 Tage kostenlos testen • 100% Geld-zurück-Garantie
        </p>
        <div className="mt-8 flex items-center justify-center gap-x-4 text-sm text-gray-600">
          <span className="flex items-center gap-x-1">
            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            500+ Schweizer Unternehmen vertrauen uns
          </span>
          <span className="flex items-center gap-x-1">
            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            DSG-konform & Hosting in der Schweiz
          </span>
        </div>
      </div>
      
      {/* Product Screenshot */}
      <div className="mx-auto max-w-6xl px-6 lg:px-8 mt-16">
        <div className="relative rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:rounded-2xl overflow-hidden">
          <Image
            src="/booking_succesful.png"
            alt="nauw Buchungsbestätigung - Erfolgreiche Terminbuchung"
            width={1200}
            height={675}
            className="rounded-lg shadow-2xl"
            priority
            quality={90}
          />
        </div>
      </div>
    </section>
  )
}