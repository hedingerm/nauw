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
    name: 'Schluss mit endlosen Telefonaten',
    description: 'Ihre Kunden buchen selbst, wann es ihnen passt – Sie konzentrieren sich auf Ihr Geschäft statt auf Terminabsprachen.',
    icon: CalendarIcon,
    painPoint: 'Verbringen Sie Stunden am Telefon?',
  },
  {
    name: 'Keine Doppelbuchungen mehr',
    description: 'Unser System kennt Ihre Verfügbarkeit in Echtzeit und verhindert Konflikte automatisch – peinliche Überschneidungen gehören der Vergangenheit an.',
    icon: ClockIcon,
    painPoint: 'Stress wegen Terminüberschneidungen?',
  },
  {
    name: 'Chaos im Team? Nicht mit uns',
    description: 'Verwalten Sie alle Mitarbeiterkalender zentral und konfliktfrei – jeder weiss, wann er wo sein muss.',
    icon: UsersIcon,
    painPoint: 'Koordinationschaos im Team?',
  },
  {
    name: '70% weniger No-Shows',
    description: 'Automatische SMS- und E-Mail-Erinnerungen sorgen dafür, dass Ihre Kunden ihre Termine wahrnehmen – Ihr Umsatz wird es Ihnen danken.',
    icon: BellIcon,
    painPoint: 'Frustriert von Leerläufen?',
  },
  {
    name: 'Wissen, was läuft',
    description: 'Sehen Sie auf einen Blick, welche Services gefragt sind und wo Sie optimieren können – datenbasierte Entscheidungen statt Bauchgefühl.',
    icon: ChartBarIcon,
    painPoint: 'Keine Übersicht über Ihr Geschäft?',
  },
  {
    name: 'Schweizer Qualität & Datenschutz',
    description: 'Ihre Daten bleiben in der Schweiz, 100% DSGVO-konform und sicher verschlüsselt – weil Vertrauen keine Kompromisse kennt.',
    icon: ShieldCheckIcon,
    painPoint: 'Bedenken beim Datenschutz?',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">Ihre Probleme – unsere Lösungen</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Wir lösen die täglichen Herausforderungen Ihrer Terminverwaltung
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Kennen Sie diese Probleme? nauw schafft Abhilfe – einfach, effizient und automatisch.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="mb-4 inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700">
                    {feature.painPoint}
                  </div>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
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