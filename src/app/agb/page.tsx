import { Metadata } from 'next'
import { NavigationHeader } from '@/src/components/features/navigation-header'
import { Footer } from '@/src/components/features/footer'

export const metadata: Metadata = {
  title: 'AGB - nauw',
  description: 'Allgemeine Geschäftsbedingungen für die Nutzung von nauw - Online Terminbuchung Software',
}

export default function AGBPage() {
  return (
    <>
      <NavigationHeader />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow px-8 py-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Allgemeine Geschäftsbedingungen (AGB)</h1>
            
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-6">
                Stand: {new Date().toLocaleDateString('de-CH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Geltungsbereich</h2>
                <p className="text-gray-600">
                  Diese Allgemeinen Geschäftsbedingungen (nachfolgend &quot;AGB&quot;) gelten für alle 
                  Verträge zwischen der Hedinger-Digital, Inhaber Manuel Hedinger (nachfolgend 
                  &quot;Anbieter&quot;) und ihren Kunden (nachfolgend &quot;Kunde&quot;) über die Nutzung der 
                  Online-Terminbuchungssoftware &quot;nauw&quot; (nachfolgend &quot;Software&quot; oder &quot;Service&quot;).
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Leistungsbeschreibung</h2>
                <p className="text-gray-600 mb-3">
                  Der Anbieter stellt dem Kunden eine cloudbasierte Software zur Online-Terminbuchung 
                  zur Verfügung. Der Service umfasst:
                </p>
                <ul className="list-disc ml-6 text-gray-600">
                  <li>Online-Terminbuchungssystem für Endkunden</li>
                  <li>Verwaltung von Dienstleistungen und Mitarbeitern</li>
                  <li>Kalenderansichten und Terminverwaltung</li>
                  <li>Kundenverwaltung</li>
                  <li>SMS-Erinnerungen (je nach gewähltem Tarif)</li>
                  <li>Hosting und Datenspeicherung in der Schweiz</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Vertragsabschluss</h2>
                <p className="text-gray-600">
                  Der Vertrag kommt durch die Registrierung des Kunden auf der Plattform und die 
                  Annahme dieser AGB zustande. Mit der Registrierung bestätigt der Kunde, diese 
                  AGB gelesen und akzeptiert zu haben.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Preise und Zahlungsbedingungen</h2>
                <p className="text-gray-600 mb-3">
                  Die Nutzung der Software ist kostenpflichtig. Die aktuellen Preise sind auf der 
                  Website einsehbar. Alle Preise verstehen sich in Schweizer Franken (CHF) und 
                  exklusive der gesetzlichen Mehrwertsteuer.
                </p>
                <p className="text-gray-600 mb-3">
                  Die Abrechnung erfolgt monatlich im Voraus. Die Zahlung erfolgt per Kreditkarte 
                  oder anderen auf der Plattform angebotenen Zahlungsmethoden über unseren 
                  Zahlungsdienstleister Stripe.
                </p>
                <p className="text-gray-600">
                  Bei Zahlungsverzug behält sich der Anbieter vor, den Zugang zur Software zu 
                  sperren.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Geld-zurück-Garantie</h2>
                <p className="text-gray-600">
                  <strong>30-Tage-Geld-zurück-Garantie:</strong> Ist der Kunde innerhalb der ersten 
                  30 Tage nach Abschluss eines kostenpflichtigen Abonnements nicht zufrieden, 
                  erhält er auf Anfrage den vollen Betrag zurückerstattet. Die Rückerstattung 
                  erfolgt auf das ursprünglich belastete Zahlungsmittel.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Kündigungsbedingungen</h2>
                <p className="text-gray-600 mb-3">
                  <strong>Ordentliche Kündigung:</strong> Der Vertrag kann von beiden Parteien 
                  monatlich gekündigt werden. Die Kündigung muss bis spätestens 24 Stunden vor 
                  Ablauf der aktuellen Abrechnungsperiode erfolgen. Es gibt keine 
                  Mindestvertragslaufzeit.
                </p>
                <p className="text-gray-600 mb-3">
                  <strong>Ausserordentliche Kündigung:</strong> Das Recht zur ausserordentlichen 
                  Kündigung aus wichtigem Grund bleibt unberührt.
                </p>
                <p className="text-gray-600">
                  Die Kündigung kann über die Kontoeinstellungen in der Software oder per E-Mail 
                  an support@nauw.ch erfolgen.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Rückerstattungsrichtlinien</h2>
                <p className="text-gray-600 mb-3">
                  <strong>Bei ordentlicher Kündigung:</strong> Bei einer ordentlichen Kündigung 
                  erfolgt keine anteilige Rückerstattung für den laufenden Abrechnungszeitraum. 
                  Der Service steht bis zum Ende der bezahlten Periode zur Verfügung.
                </p>
                <p className="text-gray-600">
                  <strong>Bei Serviceausfall:</strong> Bei erheblichen Serviceausfällen, die vom 
                  Anbieter zu vertreten sind und länger als 24 Stunden andauern, wird eine 
                  anteilige Gutschrift für die Ausfallzeit gewährt.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Verfügbarkeit und Wartung</h2>
                <p className="text-gray-600">
                  Der Anbieter bemüht sich um eine Verfügbarkeit der Software von 99,9%. 
                  Geplante Wartungsarbeiten werden mindestens 24 Stunden im Voraus angekündigt. 
                  Notfallwartungen können ohne Vorankündigung durchgeführt werden.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Pflichten des Kunden</h2>
                <p className="text-gray-600 mb-3">Der Kunde verpflichtet sich:</p>
                <ul className="list-disc ml-6 text-gray-600">
                  <li>Die Software nur für legale Zwecke zu nutzen</li>
                  <li>Keine falschen oder irreführenden Informationen anzugeben</li>
                  <li>Die Zugangsdaten vertraulich zu behandeln</li>
                  <li>Bei der Speicherung von Kundendaten die geltenden Datenschutzbestimmungen 
                      einzuhalten</li>
                  <li>Keine Versuche zu unternehmen, die Software zu hacken oder zu manipulieren</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Haftung</h2>
                <p className="text-gray-600 mb-3">
                  Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit. Für 
                  leichte Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher 
                  Vertragspflichten und begrenzt auf den vorhersehbaren, vertragstypischen Schaden.
                </p>
                <p className="text-gray-600">
                  Der Anbieter haftet nicht für Schäden, die durch höhere Gewalt, 
                  Internetausfälle oder andere vom Anbieter nicht zu vertretende Umstände 
                  entstehen.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Datenschutz</h2>
                <p className="text-gray-600">
                  Der Anbieter verpflichtet sich, die geltenden Datenschutzbestimmungen 
                  einzuhalten. Einzelheiten zur Datenverarbeitung sind in der separaten 
                  <a href="/datenschutz" className="text-primary hover:underline"> Datenschutzerklärung</a> geregelt.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Änderungen der AGB</h2>
                <p className="text-gray-600">
                  Der Anbieter behält sich vor, diese AGB zu ändern. Änderungen werden dem 
                  Kunden per E-Mail mitgeteilt. Widerspricht der Kunde den neuen AGB nicht 
                  innerhalb von 30 Tagen nach Bekanntgabe, gelten diese als angenommen.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Stornierung von Terminen</h2>
                <p className="text-gray-600">
                  Die Stornierungsbedingungen für Endkunden-Termine werden vom jeweiligen 
                  Geschäftskunden individuell festgelegt. Der Anbieter stellt lediglich die 
                  technische Plattform zur Verfügung und ist nicht Partei des 
                  Terminvereinbarungsvertrags zwischen Geschäftskunde und Endkunde.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Schlussbestimmungen</h2>
                <p className="text-gray-600 mb-3">
                  Es gilt schweizerisches Recht unter Ausschluss des UN-Kaufrechts. 
                  Gerichtsstand ist der Sitz des Anbieters, soweit gesetzlich zulässig.
                </p>
                <p className="text-gray-600">
                  Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, berührt 
                  dies die Wirksamkeit der übrigen Bestimmungen nicht.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">15. Kontakt</h2>
                <p className="text-gray-600">Bei Fragen zu diesen AGB wenden Sie sich bitte an:</p>
                <div className="mt-2 text-gray-600">
                  <p>Hedinger-Digital</p>
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