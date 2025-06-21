import * as React from 'react'

interface PaymentFailedEmailProps {
  businessName: string
  invoiceAmount: number
  appUrl: string
}

export const PaymentFailedEmail: React.FC<Readonly<PaymentFailedEmailProps>> = ({
  businessName,
  invoiceAmount,
  appUrl
}) => {
  const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  }

  const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    borderRadius: '5px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  }

  const logo = {
    margin: '0 auto',
    marginBottom: '32px',
    textAlign: 'center' as const,
  }

  const heading = {
    fontSize: '24px',
    letterSpacing: '-0.5px',
    lineHeight: '1.3',
    fontWeight: '600',
    color: '#484848',
    padding: '17px 0 0',
    margin: '0',
  }

  const paragraph = {
    margin: '16px 0',
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#484848',
  }

  const errorBox = {
    backgroundColor: '#fee',
    border: '1px solid #dc3545',
    borderRadius: '5px',
    padding: '16px',
    margin: '24px 0',
  }

  const amountBox = {
    backgroundColor: '#f6f9fc',
    padding: '24px',
    borderRadius: '5px',
    textAlign: 'center' as const,
    margin: '24px 0',
  }

  const amountText = {
    fontSize: '32px',
    fontWeight: '700',
    color: '#484848',
    margin: '0',
  }

  const amountLabel = {
    fontSize: '14px',
    color: '#697386',
    margin: '8px 0 0',
  }

  const buttonContainer = {
    textAlign: 'center' as const,
    margin: '32px 0',
  }

  const button = {
    backgroundColor: '#5469d4',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 32px',
  }

  const footer = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
    textAlign: 'center' as const,
    margin: '32px 0 0',
  }

  const hr = {
    borderColor: '#e6ebf1',
    margin: '32px 0',
  }

  const infoBox = {
    backgroundColor: '#e3f2fd',
    borderRadius: '5px',
    padding: '16px',
    margin: '24px 0',
  }

  const listItem = {
    margin: '8px 0',
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#484848',
  }

  return (
    <div style={main}>
      <div style={container}>
        <div style={logo}>
          <h1 style={{ color: '#5469d4', fontSize: '32px', margin: 0 }}>nauw</h1>
        </div>
        
        <div style={{ padding: '0 48px' }}>
          <h2 style={heading}>
            ❌ Zahlung fehlgeschlagen
          </h2>

          <p style={paragraph}>
            Guten Tag {businessName},
          </p>

          <div style={errorBox}>
            <p style={{ ...paragraph, margin: 0, fontWeight: '600' }}>
              Wir konnten Ihre Zahlung leider nicht verarbeiten.
            </p>
          </div>

          <div style={amountBox}>
            <p style={amountText}>CHF {invoiceAmount.toFixed(2)}</p>
            <p style={amountLabel}>Offener Betrag</p>
          </div>

          <p style={paragraph}>
            Ihre Zahlung für das nauw-Abonnement konnte nicht abgebucht werden. 
            Bitte aktualisieren Sie Ihre Zahlungsmethode, um Unterbrechungen Ihres Services zu vermeiden.
          </p>

          <hr style={hr} />

          <h3 style={{ ...heading, fontSize: '18px' }}>Was passiert jetzt?</h3>

          <div style={infoBox}>
            <p style={{ ...paragraph, margin: 0, fontWeight: '600' }}>
              Ihr Abonnement bleibt vorerst aktiv
            </p>
            <ul style={{ margin: '12px 0 0', paddingLeft: '20px' }}>
              <li style={listItem}>Wir versuchen die Zahlung in den nächsten Tagen erneut</li>
              <li style={listItem}>Sie können weiterhin alle Funktionen nutzen</li>
              <li style={listItem}>Bei weiteren Fehlversuchen wird Ihr Konto pausiert</li>
            </ul>
          </div>

          <div style={buttonContainer}>
            <a href={`${appUrl}/billing`} style={button}>
              Zahlungsmethode aktualisieren
            </a>
          </div>

          <hr style={hr} />

          <h3 style={{ ...heading, fontSize: '16px' }}>Mögliche Gründe für die Ablehnung:</h3>
          
          <ul style={{ margin: '16px 0', paddingLeft: '20px' }}>
            <li style={listItem}>Unzureichende Deckung auf der Karte</li>
            <li style={listItem}>Abgelaufene Kreditkarte</li>
            <li style={listItem}>Tägliches Transaktionslimit erreicht</li>
            <li style={listItem}>Karte wurde von Ihrer Bank gesperrt</li>
          </ul>

          <p style={{ ...paragraph, fontSize: '14px', color: '#697386' }}>
            Bei Fragen kontaktieren Sie uns gerne unter support@nauw.ch oder 
            aktualisieren Sie Ihre Zahlungsdaten direkt in Ihrem Account.
          </p>

          <p style={footer}>
            Diese E-Mail wurde automatisch von nauw gesendet.<br />
            Sie erhalten diese Benachrichtigung, weil eine Zahlung fehlgeschlagen ist.<br />
            <a href={`${appUrl}/settings`} style={{ color: '#5469d4' }}>
              Benachrichtigungseinstellungen verwalten
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}