import { 
  CalendarIcon, 
  ClockIcon, 
  UsersIcon, 
  ChartBarIcon,
  BellIcon,
  ShieldCheckIcon 
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Online-Terminbuchung',
    description: 'Ihre Kunden können rund um die Uhr Termine buchen – ganz ohne Anrufe oder E-Mails.',
    icon: CalendarIcon,
  },
  {
    name: 'Intelligente Verfügbarkeit',
    description: 'Automatische Berechnung freier Termine basierend auf Ihren Arbeitszeiten und bestehenden Buchungen.',
    icon: ClockIcon,
  },
  {
    name: 'Mitarbeiterverwaltung',
    description: 'Verwalten Sie mehrere Mitarbeiter mit individuellen Arbeitszeiten und Dienstleistungen.',
    icon: UsersIcon,
  },
  {
    name: 'Automatische Erinnerungen',
    description: 'Reduzieren Sie No-Shows mit automatischen SMS- und E-Mail-Erinnerungen.',
    icon: BellIcon,
  },
  {
    name: 'Detaillierte Berichte',
    description: 'Behalten Sie den Überblick mit aussagekräftigen Statistiken zu Buchungen und Umsätzen.',
    icon: ChartBarIcon,
  },
  {
    name: 'Sicher & DSGVO-konform',
    description: 'Ihre Daten sind bei uns sicher. Hosting in Deutschland und vollständig DSGVO-konform.',
    icon: ShieldCheckIcon,
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">Alles was Sie brauchen</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Leistungsstarke Funktionen für Ihr Unternehmen
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            nauw bietet Ihnen alle Tools, die Sie für eine effiziente Terminverwaltung benötigen.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}