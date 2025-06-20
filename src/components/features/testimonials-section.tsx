const testimonials = [
  {
    content: "Seit wir nauw nutzen, haben sich unsere No-Shows um 65% reduziert. Die automatischen Erinnerungen funktionieren perfekt und unsere Kunden lieben die einfache Buchung.",
    author: "Maria Schneider",
    role: "Inhaberin Coiffeur Maria",
    location: "Zürich",
    rating: 5,
  },
  {
    content: "Endlich keine doppelten Buchungen mehr! Mit 3 Therapeuten war die Koordination vorher ein Albtraum. Jetzt läuft alles automatisch und fehlerfrei.",
    author: "Dr. Thomas Weber",
    role: "Praxisleiter Physiotherapie",
    location: "Basel",
    rating: 5,
  },
  {
    content: "Die Zeitersparnis ist unglaublich – mindestens 2 Stunden täglich! Statt am Telefon zu hängen, kann ich mich auf meine Kunden konzentrieren.",
    author: "Sarah Müller",
    role: "Kosmetikstudio Beauty & More",
    location: "Bern",
    rating: 5,
  },
]

const stats = [
  { label: "Aktive Unternehmen", value: "500+" },
  { label: "Gebuchte Termine", value: "250.000+" },
  { label: "Zeitersparnis pro Woche", value: "10+ Std" },
  { label: "Reduzierung No-Shows", value: "70%" },
]

export function TestimonialsSection() {
  return (
    <section className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">Was unsere Kunden sagen</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Vertrauen Sie nicht nur uns – hören Sie auf unsere Kunden
          </p>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-16 max-w-2xl lg:max-w-none">
          <dl className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="text-base leading-7 text-gray-600">{stat.label}</dt>
                <dd className="text-3xl font-bold leading-9 tracking-tight text-gray-900">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Testimonials */}
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="flex flex-col bg-white p-8 shadow-lg ring-1 ring-gray-900/5 rounded-2xl">
              <div className="flex gap-x-1 text-primary">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 flex-none" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                  </svg>
                ))}
              </div>
              <blockquote className="mt-6 text-base leading-7 text-gray-700 flex-grow">
                <p>&ldquo;{testimonial.content}&rdquo;</p>
              </blockquote>
              <div className="mt-6 border-t border-gray-100 pt-6">
                <p className="text-sm font-semibold text-gray-900">{testimonial.author}</p>
                <p className="text-sm text-gray-600">{testimonial.role}</p>
                <p className="text-sm text-gray-500">{testimonial.location}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mx-auto mt-16 max-w-2xl">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-medium">SSL verschlüsselt</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              <span className="font-medium">Swiss Made</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="font-medium">DSGVO konform</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
              <span className="font-medium">Hosting in der Schweiz</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}