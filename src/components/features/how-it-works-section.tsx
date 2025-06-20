const steps = [
  {
    number: '1',
    title: 'Konto erstellen',
    description: 'Registrieren Sie sich kostenlos und richten Sie Ihr Unternehmensprofil in wenigen Minuten ein.',
  },
  {
    number: '2',
    title: 'Services & Zeiten festlegen',
    description: 'Definieren Sie Ihre Dienstleistungen, Preise und Verfügbarkeiten. Fügen Sie Mitarbeiter hinzu.',
  },
  {
    number: '3',
    title: 'Buchungslink teilen',
    description: 'Teilen Sie Ihren persönlichen Buchungslink und lassen Sie Kunden selbstständig Termine buchen.',
  },
]

export function HowItWorksSection() {
  return (
    <section className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">So einfach geht&apos;s</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            In 3 Schritten zu Ihrer Online-Terminbuchung
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl lg:max-w-none">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-12 hidden h-0.5 w-full -translate-x-1/2 bg-gray-300 lg:block" />
                )}
                <div className="relative flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-lg">
                    {step.number}
                  </div>
                  <h3 className="mt-6 text-lg font-semibold leading-8 text-gray-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-base leading-7 text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}