import { Metadata } from 'next'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article'
  noIndex?: boolean
}

const defaultSEO = {
  title: 'nauw - Online Terminbuchung Software für Schweizer Unternehmen',
  description: 'Professionelle Terminbuchungssoftware für Friseursalons, Therapeuten, Beautysalons und Dienstleister in der Schweiz. Kostenlos testen!',
  keywords: ['Terminbuchung', 'Online Terminbuchung', 'Terminbuchungssoftware', 'Buchungssystem Schweiz', 'Terminverwaltung', 'nauw'],
  image: '/og-image.png',
  url: 'https://nauw.ch',
}

export function generateMetadata({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  noIndex = false,
}: SEOProps = {}): Metadata {
  const metaTitle = title ? `${title} | nauw` : defaultSEO.title
  const metaDescription = description || defaultSEO.description
  const metaKeywords = keywords ? [...keywords, ...defaultSEO.keywords] : defaultSEO.keywords
  const metaImage = image || defaultSEO.image
  const metaUrl = url || defaultSEO.url

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords.join(', '),
    authors: [{ name: 'nauw' }],
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type,
      locale: 'de_CH',
      url: metaUrl,
      siteName: 'nauw',
      images: [
        {
          url: metaImage,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [metaImage],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
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
    alternates: {
      canonical: metaUrl,
    },
  }
}

// Industry-specific metadata generators
export const industryMetadata = {
  friseure: generateMetadata({
    title: 'Terminbuchung für Friseursalons',
    description: 'Die führende Terminbuchungssoftware für Friseursalons in der Schweiz. Online-Buchung, Kundenverwaltung und automatische Erinnerungen.',
    keywords: ['Friseursalon', 'Coiffeur', 'Terminbuchung Friseur', 'Salonverwaltung'],
    url: 'https://nauw.ch/friseure',
  }),
  
  therapeuten: generateMetadata({
    title: 'Online Terminvergabe für Therapeuten',
    description: 'Professionelle Terminverwaltung für Therapeuten, Physiotherapeuten und Heilpraktiker. DSGVO-konform und Swiss Made.',
    keywords: ['Therapeut', 'Physiotherapie', 'Terminvergabe Therapie', 'Praxisverwaltung'],
    url: 'https://nauw.ch/therapeuten',
  }),
  
  beauty: generateMetadata({
    title: 'Buchungssystem für Beauty & Wellness',
    description: 'Das moderne Buchungssystem für Kosmetikstudios, Nagelstudios und Wellness-Center. Einfach, sicher und effizient.',
    keywords: ['Beauty', 'Kosmetik', 'Nagelstudio', 'Wellness', 'Spa Buchung'],
    url: 'https://nauw.ch/beauty',
  }),
  
  nachhilfe: generateMetadata({
    title: 'Terminplanung für Nachhilfelehrer',
    description: 'Vereinfachen Sie Ihre Nachhilfe-Organisation mit nauw. Online-Terminbuchung, Schülerverwaltung und automatische Erinnerungen.',
    keywords: ['Nachhilfe', 'Privatunterricht', 'Terminplanung Lehrer', 'Schülerverwaltung'],
    url: 'https://nauw.ch/nachhilfe',
  }),
}

// Location-specific metadata generators
export const locationMetadata = {
  zuerich: generateMetadata({
    title: 'Terminbuchungssoftware für Zürcher Unternehmen',
    description: 'Die lokale Lösung für Terminbuchung in Zürich. Perfekt für Dienstleister im Raum Zürich.',
    keywords: ['Zürich', 'Terminbuchung Zürich', 'Software Zürich'],
    url: 'https://nauw.ch/zuerich',
  }),
  
  basel: generateMetadata({
    title: 'Terminbuchungssoftware für Basler Unternehmen',
    description: 'Online Terminvergabe für Unternehmen in Basel. Lokal entwickelt, schweizweit erfolgreich.',
    keywords: ['Basel', 'Terminbuchung Basel', 'Software Basel'],
    url: 'https://nauw.ch/basel',
  }),
  
  bern: generateMetadata({
    title: 'Terminbuchungssoftware für Berner Unternehmen',
    description: 'Die moderne Terminlösung für Dienstleister in Bern und Umgebung.',
    keywords: ['Bern', 'Terminbuchung Bern', 'Software Bern'],
    url: 'https://nauw.ch/bern',
  }),
}