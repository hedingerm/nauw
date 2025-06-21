import { Metadata } from 'next'
import { NavigationHeader } from '@/src/components/features/navigation-header'
import { Footer } from '@/src/components/features/footer'

export const metadata: Metadata = {
  title: 'Datenschutzerklärung - nauw',
  description: 'Datenschutzerklärung und Informationen zum Schutz Ihrer persönlichen Daten bei nauw',
}

export default function DatenschutzPage() {
  return (
    <>
      <NavigationHeader />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow px-8 py-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Datenschutzerklärung</h1>
            
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-6">
                Stand: {new Date().toLocaleDateString('de-CH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Verantwortliche Stelle</h2>
                <p className="text-gray-600">
                  Verantwortlich für die Datenverarbeitung auf dieser Website ist:
                </p>
                <div className="mt-2 text-gray-600">
                  <p>Hedinger-Digital</p>
                  <p>Manuel Hedinger</p>
                  <p>Rosgartenstrasse 19</p>
                  <p>7205 Zizers</p>
                  <p>Schweiz</p>
                  <p>E-Mail: support@nauw.ch</p>
                  <p>Telefon: +41 81 511 23 41</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Allgemeine Hinweise</h2>
                <p className="text-gray-600">
                  Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. Wir verarbeiten 
                  Ihre Daten daher ausschliesslich auf Grundlage der gesetzlichen Bestimmungen des 
                  schweizerischen Datenschutzgesetzes (DSG/nDSG). In diesen Datenschutzinformationen 
                  informieren wir Sie über die wichtigsten Aspekte der Datenverarbeitung im Rahmen 
                  unserer Website und unseres Services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Datenerfassung auf unserer Website</h2>
                
                <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">3.1 Server-Log-Dateien</h3>
                <p className="text-gray-600 mb-3">
                  Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten 
                  Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
                </p>
                <ul className="list-disc ml-6 text-gray-600 mb-3">
                  <li>Browsertyp und Browserversion</li>
                  <li>Verwendetes Betriebssystem</li>
                  <li>Referrer URL</li>
                  <li>Hostname des zugreifenden Rechners</li>
                  <li>Uhrzeit der Serveranfrage</li>
                  <li>IP-Adresse</li>
                </ul>
                <p className="text-gray-600">
                  Diese Daten sind nicht bestimmten Personen zuordenbar. Eine Zusammenführung dieser 
                  Daten mit anderen Datenquellen wird nicht vorgenommen.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">3.2 Cookies</h3>
                <p className="text-gray-600 mb-3">
                  Unsere Website verwendet Cookies. Dabei handelt es sich um kleine Textdateien, die 
                  auf Ihrem Endgerät gespeichert werden. Wir verwenden ausschliesslich technisch 
                  notwendige Cookies, die für den Betrieb der Website erforderlich sind.
                </p>
                <p className="text-gray-600">
                  Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies 
                  informiert werden und einzeln über deren Annahme entscheiden oder die Annahme von 
                  Cookies für bestimmte Fälle oder generell ausschliessen.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Datenverarbeitung bei Nutzung unseres Services</h2>
                
                <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">4.1 Registrierung</h3>
                <p className="text-gray-600 mb-3">
                  Bei der Registrierung für unseren Service werden folgende Daten erhoben:
                </p>
                <ul className="list-disc ml-6 text-gray-600 mb-3">
                  <li>Name des Unternehmens</li>
                  <li>Vor- und Nachname</li>
                  <li>E-Mail-Adresse</li>
                  <li>Telefonnummer</li>
                  <li>Geschäftsadresse</li>
                </ul>
                <p className="text-gray-600">
                  Diese Daten werden zur Bereitstellung unseres Services und zur Vertragserfüllung 
                  benötigt.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">4.2 Kundendaten</h3>
                <p className="text-gray-600">
                  Wenn Sie als Geschäftskunde unseren Service nutzen, können Sie Daten Ihrer eigenen 
                  Kunden in unserem System speichern. Sie sind selbst für die rechtmässige Erhebung 
                  und Verarbeitung dieser Daten verantwortlich. Wir verarbeiten diese Daten 
                  ausschliesslich im Auftrag und nach Ihren Weisungen.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">4.3 Terminbuchungen</h3>
                <p className="text-gray-600">
                  Bei der Buchung eines Termins über unsere Plattform werden die für die 
                  Terminvereinbarung notwendigen Daten erhoben (Name, Kontaktdaten, gewählter Service).
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Datenspeicherung und -sicherheit</h2>
                <p className="text-gray-600 mb-3">
                  Alle Daten werden ausschliesslich auf Servern in der Schweiz gespeichert. Wir 
                  verwenden modernste Verschlüsselungstechnologien (SSL/TLS) für die Übertragung 
                  und Speicherung Ihrer Daten.
                </p>
                <p className="text-gray-600">
                  Wir treffen angemessene technische und organisatorische Massnahmen, um Ihre Daten 
                  gegen zufällige oder vorsätzliche Manipulationen, teilweisen oder vollständigen 
                  Verlust, Zerstörung oder gegen den unbefugten Zugriff Dritter zu schützen.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Weitergabe von Daten</h2>
                <p className="text-gray-600 mb-3">
                  Eine Übermittlung Ihrer persönlichen Daten an Dritte findet nicht statt, ausser:
                </p>
                <ul className="list-disc ml-6 text-gray-600">
                  <li>Sie haben Ihre ausdrückliche Einwilligung dazu erteilt</li>
                  <li>Die Weitergabe ist zur Erfüllung unserer vertraglichen Pflichten erforderlich</li>
                  <li>Wir sind gesetzlich dazu verpflichtet</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Zahlungsdienstleister</h2>
                <p className="text-gray-600">
                  Für die Abwicklung von Zahlungen nutzen wir den Zahlungsdienstleister Stripe. 
                  Dabei werden Ihre Zahlungsdaten direkt an Stripe übermittelt. Wir speichern 
                  keine Kreditkartendaten. Weitere Informationen finden Sie in der 
                  Datenschutzerklärung von Stripe unter https://stripe.com/privacy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Ihre Rechte</h2>
                <p className="text-gray-600 mb-3">
                  Ihnen stehen grundsätzlich die Rechte auf Auskunft, Berichtigung, Löschung, 
                  Einschränkung, Datenübertragbarkeit, Widerruf und Widerspruch zu. Wenn Sie 
                  glauben, dass die Verarbeitung Ihrer Daten gegen das Datenschutzrecht verstösst 
                  oder Ihre datenschutzrechtlichen Ansprüche sonst in einer Weise verletzt worden 
                  sind, können Sie sich bei der Aufsichtsbehörde beschweren.
                </p>
                <p className="text-gray-600">
                  In der Schweiz ist dies der Eidgenössische Datenschutz- und 
                  Öffentlichkeitsbeauftragte (EDÖB).
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Aufbewahrungsfristen</h2>
                <p className="text-gray-600">
                  Wir speichern Ihre Daten nur so lange, wie dies für die Erbringung unserer 
                  Dienstleistungen erforderlich ist oder wir ein berechtigtes Interesse an der 
                  weiteren Speicherung haben. In allen anderen Fällen löschen wir Ihre 
                  personenbezogenen Daten mit Ausnahme solcher Daten, die wir zur Erfüllung 
                  gesetzlicher Aufbewahrungsfristen weiter vorhalten müssen.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Änderungen dieser Datenschutzerklärung</h2>
                <p className="text-gray-600">
                  Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den 
                  aktuellen rechtlichen Anforderungen entspricht oder um Änderungen unserer 
                  Leistungen in der Datenschutzerklärung umzusetzen. Für Ihren erneuten Besuch 
                  gilt dann die neue Datenschutzerklärung.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Kontakt</h2>
                <p className="text-gray-600">
                  Bei Fragen zum Datenschutz können Sie uns jederzeit kontaktieren:
                </p>
                <div className="mt-2 text-gray-600">
                  <p>E-Mail: support@nauw.ch</p>
                  <p>Telefon: +41 81 511 23 41</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}