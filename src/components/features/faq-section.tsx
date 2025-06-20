'use client'

import { useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

const faqs = [
  {
    question: "Wie lange dauert die Einrichtung?",
    answer: "Die Grundeinrichtung ist in nur 15 Minuten erledigt. Sie erstellen Ihr Konto, fügen Ihre Services hinzu und definieren Ihre Arbeitszeiten – fertig! Für erweiterte Funktionen wie Mitarbeiterverwaltung planen Sie etwa 30 Minuten ein.",
  },
  {
    question: "Was passiert mit meinen Kundendaten?",
    answer: "Ihre Daten sind bei uns in besten Händen. Wir hosten ausschliesslich in der Schweiz, sind vollständig DSGVO-konform und verwenden modernste Verschlüsselungstechnologie. Sie behalten jederzeit die volle Kontrolle über Ihre Daten.",
  },
  {
    question: "Kann ich jederzeit kündigen?",
    answer: "Absolut! Es gibt keine Mindestvertragslaufzeit. Sie können monatlich kündigen – ganz ohne Wenn und Aber. In den ersten 30 Tagen erhalten Sie bei Unzufriedenheit sogar Ihr Geld zurück.",
  },
  {
    question: "Funktioniert nauw mit meinem bestehenden System?",
    answer: "nauw ist als eigenständige Lösung konzipiert und ersetzt Ihr bisheriges Terminmanagement komplett. Sie können Ihre bestehenden Termine beim Start importieren. Eine Kalender-Synchronisation (Google, Outlook) ist in Entwicklung.",
  },
  {
    question: "Was kostet nauw?",
    answer: "Unsere Preise starten bei CHF 29 pro Monat für Einzelunternehmer. Grössere Teams profitieren von gestaffelten Preisen. Die ersten 30 Tage sind komplett kostenlos – ohne Kreditkarte.",
  },
  {
    question: "Können meine Kunden auch ohne Registrierung buchen?",
    answer: "Ja, absolut! Ihre Kunden müssen sich nicht registrieren. Sie wählen einfach Service, Datum und Zeit aus, geben ihre Kontaktdaten ein – fertig. So einfach wie möglich.",
  },
  {
    question: "Was passiert bei technischen Problemen?",
    answer: "Unser Support-Team ist werktags von 8-18 Uhr für Sie da. Kritische Probleme lösen wir meist innerhalb von 2 Stunden. Zusätzlich bieten wir eine 99,9% Verfügbarkeitsgarantie.",
  },
  {
    question: "Kann ich das Design an mein Unternehmen anpassen?",
    answer: "Ja! Sie können Ihr Logo hochladen, Ihre Unternehmensfarben definieren und die Buchungsseite an Ihr Corporate Design anpassen. So bleibt alles in Ihrem Look.",
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">Häufige Fragen</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Wir haben Antworten
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Noch Fragen? Unser Support-Team hilft Ihnen gerne weiter.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <dl className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <dt>
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="flex w-full items-start justify-between text-left p-6 hover:bg-gray-50"
                  >
                    <span className="text-base font-semibold leading-7 text-gray-900">
                      {faq.question}
                    </span>
                    <span className="ml-6 flex h-7 items-center">
                      <ChevronDownIcon
                        className={`h-6 w-6 transform transition-transform ${
                          openIndex === index ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </span>
                  </button>
                </dt>
                {openIndex === index && (
                  <dd className="px-6 pb-6">
                    <p className="text-base leading-7 text-gray-600">{faq.answer}</p>
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </div>

        <div className="mx-auto mt-16 max-w-2xl text-center">
          <div className="rounded-2xl bg-gray-50 p-8">
            <h3 className="text-lg font-semibold text-gray-900">
              Noch Fragen? Wir sind für Sie da!
            </h3>
            <p className="mt-2 text-gray-600">
              Unser Support-Team beantwortet Ihre Fragen gerne persönlich.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@nauw.ch"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                support@nauw.ch
              </a>
              <span className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700">
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +41 44 123 45 67
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}