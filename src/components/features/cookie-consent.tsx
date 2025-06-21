'use client'

import Link from 'next/link'
import CookieConsent from 'react-cookie-consent'
import Cookies from 'js-cookie'

const COOKIE_NAME = 'nauw-cookie-consent'

export function CookieConsentBanner() {
  return (
    <CookieConsent
      location="bottom"
      buttonText="Alle akzeptieren"
      declineButtonText="Nur notwendige"
      enableDeclineButton
      cookieName={COOKIE_NAME}
      expires={365}
      style={{
        background: '#1f2937',
        fontSize: '14px',
        padding: '20px',
        alignItems: 'center',
      }}
      buttonStyle={{
        background: '#10b981',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        borderRadius: '6px',
        padding: '8px 20px',
        margin: '0 10px',
      }}
      declineButtonStyle={{
        background: 'transparent',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        border: '1px solid #6b7280',
        borderRadius: '6px',
        padding: '8px 20px',
        margin: '0',
      }}
      onAccept={(acceptedByScrolling) => {
        if (!acceptedByScrolling) {
          // User clicked accept - set cookie value to true
          Cookies.set(COOKIE_NAME, 'true', { expires: 365 })
          // Force page reload to initialize analytics
          window.location.reload()
        }
      }}
      onDecline={() => {
        // User clicked decline - set cookie value to false
        Cookies.set(COOKIE_NAME, 'false', { expires: 365 })
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          Diese Website verwendet Cookies, um Ihre Benutzererfahrung zu verbessern. 
          Mit Ihrer Zustimmung verwenden wir auch Analyse-Cookies zur Verbesserung unseres Services. 
          Weitere Informationen finden Sie in unserer{' '}
          <Link href="/datenschutz" className="text-emerald-400 hover:text-emerald-300 underline">
            Datenschutzerklärung
          </Link>.
        </div>
      </div>
    </CookieConsent>
  )
}