import { Metadata } from 'next'
import { NavigationHeader } from '@/src/components/features/navigation-header'
import { Footer } from '@/src/components/features/footer'

export const metadata: Metadata = {
  title: 'Impressum - nauw',
  description: 'Impressum und rechtliche Informationen zu nauw - Online Terminbuchung Software',
}

export default function ImpressumPage() {
  return (
    <>
      <NavigationHeader />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow px-8 py-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Impressum</h1>
            
            <section className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Angaben gemäss OR</h2>
                <div className="space-y-2 text-gray-600">
                  <p>Hedinger-Digital</p>
                  <p>Einzelfirma</p>
                  <p>Manuel Hedinger</p>
                  <p>Rosgartenstrasse 19</p>
                  <p>7205 Zizers</p>
                  <p>Schweiz</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Kontakt</h2>
                <div className="space-y-2 text-gray-600">
                  <p>Telefon: +41 81 511 23 41</p>
                  <p>E-Mail: support@nauw.ch</p>
                  <p>Webseite: https://nauw.ch</p>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Handelsregister</h2>
                <p className="text-gray-600">
                  Die Handelsregistereintragung ist derzeit in Bearbeitung.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Verantwortlich für den Inhalt</h2>
                <p className="text-gray-600">Manuel Hedinger</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Haftungsausschluss</h2>
                <p className="text-gray-600 mb-3">
                  Der Autor übernimmt keinerlei Gewähr hinsichtlich der inhaltlichen Richtigkeit, 
                  Genauigkeit, Aktualität, Zuverlässigkeit und Vollständigkeit der Informationen.
                </p>
                <p className="text-gray-600 mb-3">
                  Haftungsansprüche gegen den Autor wegen Schäden materieller oder immaterieller Art, 
                  welche aus dem Zugriff oder der Nutzung bzw. Nichtnutzung der veröffentlichten 
                  Informationen, durch Missbrauch der Verbindung oder durch technische Störungen 
                  entstanden sind, werden ausgeschlossen.
                </p>
                <p className="text-gray-600">
                  Alle Angebote sind unverbindlich. Der Autor behält es sich ausdrücklich vor, 
                  Teile der Seiten oder das gesamte Angebot ohne besondere Ankündigung zu verändern, 
                  zu ergänzen, zu löschen oder die Veröffentlichung zeitweise oder endgültig einzustellen.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Haftungsausschluss für Links</h2>
                <p className="text-gray-600">
                  Verweise und Links auf Webseiten Dritter liegen ausserhalb unseres Verantwortungsbereichs. 
                  Es wird jegliche Verantwortung für solche Webseiten abgelehnt. Der Zugriff und die 
                  Nutzung solcher Webseiten erfolgen auf eigene Gefahr des jeweiligen Nutzers.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Urheberrechte</h2>
                <p className="text-gray-600">
                  Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos oder anderen Dateien 
                  auf dieser Website, gehören ausschliesslich der Firma Hedinger-Digital oder den speziell 
                  genannten Rechteinhabern. Für die Reproduktion jeglicher Elemente ist die schriftliche 
                  Zustimmung des Urheberrechtsträgers im Voraus einzuholen.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Datenschutz</h2>
                <p className="text-gray-600">
                  Gestützt auf Artikel 13 der schweizerischen Bundesverfassung und die 
                  datenschutzrechtlichen Bestimmungen des Bundes (Datenschutzgesetz, DSG) hat jede 
                  Person Anspruch auf Schutz ihrer Privatsphäre sowie auf Schutz vor Missbrauch ihrer 
                  persönlichen Daten. Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen 
                  Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und 
                  entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
                </p>
                <p className="text-gray-600 mt-3">
                  Weitere Informationen finden Sie in unserer{' '}
                  <a href="/datenschutz" className="text-primary hover:underline">
                    Datenschutzerklärung
                  </a>.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}