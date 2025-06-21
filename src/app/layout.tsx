import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/src/lib/providers'
import { StructuredDataScript } from '@/src/components/seo/structured-data-script'
import { organizationSchema, softwareApplicationSchema } from '@/src/lib/seo/structured-data'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'nauw - Online Terminbuchung Software für Schweizer Unternehmen',
  description: 'Professionelle Terminbuchungssoftware für Friseursalons, Therapeuten, Beautysalons und Dienstleister in der Schweiz. Kostenlos testen!',
  keywords: 'Terminbuchung, Online Terminbuchung, Terminbuchungssoftware, Buchungssystem Schweiz, Terminverwaltung, nauw',
  authors: [{ name: 'nauw' }],
  openGraph: {
    title: 'nauw - Online Terminbuchung Software für Schweizer Unternehmen',
    description: 'Professionelle Terminbuchungssoftware für Friseursalons, Therapeuten, Beautysalons und Dienstleister in der Schweiz. Kostenlos testen!',
    type: 'website',
    locale: 'de_CH',
    url: 'https://nauw.ch',
    siteName: 'nauw',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'nauw - Online Terminbuchung für Schweizer Unternehmen'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'nauw - Online Terminbuchung Software',
    description: 'Professionelle Terminbuchungssoftware für Schweizer Unternehmen',
    images: ['/og-image.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://nauw.ch',
    languages: {
      'de-CH': 'https://nauw.ch',
      'fr-CH': 'https://nauw.ch/fr',
      'it-CH': 'https://nauw.ch/it',
      'en-CH': 'https://nauw.ch/en',
    }
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <StructuredDataScript data={[organizationSchema, softwareApplicationSchema]} />
      </body>
    </html>
  )
}