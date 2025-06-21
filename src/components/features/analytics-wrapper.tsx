'use client'

import { Analytics } from '@vercel/analytics/next'
import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'

const COOKIE_NAME = 'nauw-cookie-consent'

export function AnalyticsWrapper() {
  const [hasConsent, setHasConsent] = useState(false)

  useEffect(() => {
    // Check initial consent status
    const checkConsent = () => {
      const consentCookie = Cookies.get(COOKIE_NAME)
      // Cookie value is "true" when accepted, "false" when declined
      setHasConsent(consentCookie === 'true')
    }

    // Check on mount
    checkConsent()

    // Listen for cookie changes (when user changes consent)
    const interval = setInterval(checkConsent, 1000)

    return () => clearInterval(interval)
  }, [])

  // Only render Analytics if user has consented
  if (!hasConsent) {
    return null
  }

  return <Analytics />
}