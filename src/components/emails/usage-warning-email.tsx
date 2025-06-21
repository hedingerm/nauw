import * as React from 'react'

interface UsageWarningEmailProps {
  businessName: string
  used: number
  total: number
  percentage: number
  remaining: number
  appUrl: string
}

export const UsageWarningEmail: React.FC<Readonly<UsageWarningEmailProps>> = ({
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

  const warningBox = {
    backgroundColor: '#fff4e5',
    border: '1px solid #ffa500',
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

  const statNumber = {
    fontSize: '24px',
    fontWeight: '700',
    color: '#484848',
    margin: '0',
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
    backgroundColor: '#5469d4',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 24px',
    margin: '0 8px',
  }

  const secondaryButton = {
    ...button,
    backgroundColor: '#ffffff',
    color: '#5469d4',
    border: '1px solid #5469d4',
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

  return (
    <div style={main}>
      <div style={container}>
        <div style={logo}>
          <h1 style={{ color: '#5469d4', fontSize: '32px', margin: 0 }}>nauw</h1>
        </div>
        
        <div style={{ padding: '0 48px' }}>
          <h2 style={heading}>
            ⚠️ Warnung: Ihr Buchungskontingent läuft aus
          </h2>

          <p style={paragraph}>
            Guten Tag {businessName},
          </p>

          <div style={warningBox}>
            <p style={{ ...paragraph, margin: 0, fontWeight: '600' }}>
              Sie haben bereits {percentage}% Ihres monatlichen Buchungskontingents verwendet.
            </p>
          </div>

          <div style={statsGrid}>
            <div style={statBox}>
              <p style={statNumber}>{used}</p>
              <p style={statLabel}>Verwendete Buchungen</p>
            </div>
            <div style={statBox}>
              <p style={statNumber}>{remaining}</p>
              <p style={statLabel}>Verbleibende Buchungen</p>
            </div>
          </div>

          <p style={paragraph}>
            Sie haben noch <strong>{remaining} Buchungen</strong> in diesem Monat verfügbar. 
            Planen Sie voraus, um zusätzliche Kosten zu vermeiden.
          </p>

          <hr style={hr} />

          <h3 style={{ ...heading, fontSize: '18px' }}>Was können Sie tun?</h3>

          <div style={buttonContainer}>
            <a href={`${appUrl}/billing/booster`} style={button}>
              Booster Pack kaufen
            </a>
            <a href={`${appUrl}/billing/upgrade`} style={secondaryButton}>
              Plan upgraden
            </a>
          </div>

          <p style={{ ...paragraph, fontSize: '14px', color: '#697386' }}>
            <strong>Booster Pack:</strong> 50 zusätzliche Buchungen für CHF 20<br />
            <strong>Plan Upgrade:</strong> Mehr monatliche Buchungen und zusätzliche Funktionen
          </p>

          <hr style={hr} />

          <p style={footer}>
            Diese E-Mail wurde automatisch von nauw gesendet.<br />
            Sie erhalten diese Benachrichtigung, weil Sie 80% Ihres Kontingents erreicht haben.<br />
            <a href={`${appUrl}/settings`} style={{ color: '#5469d4' }}>
              Benachrichtigungseinstellungen verwalten
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}