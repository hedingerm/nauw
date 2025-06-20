import Link from 'next/link'
import { Button } from '@/src/components/ui/button'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 px-6 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Termine online buchen – 
          <span className="text-primary"> einfach und schnell</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Die moderne Terminbuchungsplattform für Ihr Unternehmen. 
          Sparen Sie Zeit, reduzieren Sie No-Shows und begeistern Sie Ihre Kunden 
          mit einem professionellen Buchungserlebnis.
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
          Keine Kreditkarte erforderlich • 30 Tage kostenlos testen
        </p>
      </div>
    </section>
  )
}