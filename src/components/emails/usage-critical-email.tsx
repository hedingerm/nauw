import * as React from 'react'

interface UsageCriticalEmailProps {
  businessName: string
  used: number
  total: number
  percentage: number
  remaining: number
  appUrl: string
}

export const UsageCriticalEmail: React.FC<Readonly<UsageCriticalEmailProps>> = ({
  businessName,
  used,
  total,
  percentage,
  remaining,
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

  const criticalBox = {
    backgroundColor: '#fee',
    border: '2px solid #dc3545',
    borderRadius: '5px',
    padding: '16px',
    margin: '24px 0',
  }

  const statsGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    margin: '24px 0',
  }

  const statBox = {
    backgroundColor: '#f6f9fc',
    padding: '16px',
    borderRadius: '5px',
    textAlign: 'center' as const,
  }

  const criticalStatBox = {
    ...statBox,
    backgroundColor: '#fee',
    border: '1px solid #dc3545',
  }

  const statNumber = {
    fontSize: '24px',
    fontWeight: '700',
    color: '#484848',
    margin: '0',
  }

  const criticalStatNumber = {
    ...statNumber,
    color: '#dc3545',
  }

  const statLabel = {
    fontSize: '13px',
    color: '#697386',
    margin: '4px 0 0',
  }

  const buttonContainer = {
    textAlign: 'center' as const,
    margin: '32px 0',
  }

  const button = {
    backgroundColor: '#dc3545',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 32px',
    margin: '0 8px',
  }

  const secondaryButton = {
    ...button,
    backgroundColor: '#5469d4',
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

  const urgentBanner = {
    backgroundColor: '#dc3545',
    color: '#ffffff',
    textAlign: 'center' as const,
    padding: '12px',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '0.5px',
  }

  return (
    <div style={main}>
      <div style={urgentBanner}>
        🚨 DRINGEND: SOFORTIGES HANDELN ERFORDERLICH 🚨
      </div>
      
      <div style={container}>
        <div style={logo}>
          <h1 style={{ color: '#5469d4', fontSize: '32px', margin: 0 }}>nauw</h1>
        </div>
        
        <div style={{ padding: '0 48px' }}>
          <h2 style={heading}>
            🚨 Kritisch: Buchungskontingent fast aufgebraucht!
          </h2>

          <p style={paragraph}>
            Guten Tag {businessName},
          </p>

          <div style={criticalBox}>
            <p style={{ ...paragraph, margin: 0, fontWeight: '700', fontSize: '16px', color: '#dc3545' }}>
              ACHTUNG: Sie haben {percentage}% Ihres Kontingents verbraucht!
            </p>
            <p style={{ ...paragraph, margin: '8px 0 0', fontSize: '14px' }}>
              Nur noch <strong>{remaining} Buchungen</strong> verfügbar.
            </p>
          </div>

          <div style={statsGrid}>
            <div style={statBox}>
              <p style={statNumber}>{used}</p>
              <p style={statLabel}>Verwendete Buchungen</p>
            </div>
            <div style={criticalStatBox}>
              <p style={criticalStatNumber}>{remaining}</p>
              <p style={statLabel}>⚠️ Verbleibend</p>
            </div>
          </div>

          <div style={{ ...paragraph, backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '5px' }}>
            <strong>Was passiert bei Überschreitung?</strong><br />
            Nach Aufbrauch Ihres Kontingents werden zusätzliche Buchungen mit 
            <strong> CHF 0.50 pro Buchung</strong> berechnet.
          </div>

          <hr style={hr} />

          <h3 style={{ ...heading, fontSize: '18px' }}>Handeln Sie jetzt!</h3>

          <div style={buttonContainer}>
            <a href={`${appUrl}/billing/booster`} style={button}>
              Sofort Booster Pack kaufen
            </a>
            <a href={`${appUrl}/billing/upgrade`} style={secondaryButton}>
              Plan upgraden
            </a>
          </div>

          <p style={{ ...paragraph, fontSize: '14px', color: '#697386', textAlign: 'center' as const }}>
            <strong>Booster Pack:</strong> 50 zusätzliche Buchungen für nur CHF 20 - Sofort verfügbar!<br />
            <strong>Plan Upgrade:</strong> Dauerhaft mehr Buchungen pro Monat
          </p>

          <hr style={hr} />

          <div style={{ ...paragraph, backgroundColor: '#e3f2fd', padding: '16px', borderRadius: '5px', fontSize: '14px' }}>
            💡 <strong>Tipp:</strong> Mit einem Upgrade auf den nächsthöheren Plan erhalten Sie nicht nur mehr 
            Buchungen, sondern auch zusätzliche Funktionen wie erweiterte Berichte und mehr Mitarbeiter.
          </div>

          <p style={footer}>
            Diese E-Mail wurde automatisch von nauw gesendet.<br />
            Sie erhalten diese dringende Benachrichtigung, weil Sie 95% Ihres Kontingents erreicht haben.<br />
            <a href={`${appUrl}/settings`} style={{ color: '#5469d4' }}>
              Benachrichtigungseinstellungen verwalten
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}