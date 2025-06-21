// Structured data schemas for SEO

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'nauw',
  legalName: 'Hedinger-Digital',
  description: 'Online Terminbuchung Software für Schweizer Unternehmen',
  url: 'https://nauw.ch',
  logo: 'https://nauw.ch/logo.png',
  image: 'https://nauw.ch/og-image.png',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Rosgartenstrasse 19',
    addressLocality: 'Zizers',
    postalCode: '7205',
    addressCountry: 'CH',
    addressRegion: 'Graubünden',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    areaServed: 'CH',
    availableLanguage: ['de', 'fr', 'it', 'en'],
    email: 'support@nauw.ch',
    telephone: '+41 81 511 23 41',
  },
  sameAs: [
    'https://www.linkedin.com/company/nauw',
    'https://twitter.com/nauw_ch',
    'https://www.facebook.com/nauw.ch',
  ],
}

export const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'nauw',
  description: 'Professionelle Terminbuchungssoftware für Schweizer Dienstleister',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web-based',
  url: 'https://nauw.ch',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'CHF',
    priceSpecification: [
      {
        '@type': 'PriceSpecification',
        price: '0',
        priceCurrency: 'CHF',
        name: 'Kostenlose Testversion',
      },
      {
        '@type': 'PriceSpecification',
        price: '29',
        priceCurrency: 'CHF',
        name: 'Starter Plan',
        billingIncrement: {
          '@type': 'QuantitativeValue',
          value: 1,
          unitText: 'MONTH',
        },
      },
      {
        '@type': 'PriceSpecification',
        price: '79',
        priceCurrency: 'CHF',
        name: 'Professional Plan',
        billingIncrement: {
          '@type': 'QuantitativeValue',
          value: 1,
          unitText: 'MONTH',
        },
      },
    ],
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '127',
  },
  screenshot: 'https://nauw.ch/screenshots/dashboard.png',
  featureList: [
    'Online Terminbuchung',
    'Kundenverwaltung',
    'SMS Erinnerungen',
    'Kalenderintegration',
    'Mitarbeiterverwaltung',
    'Automatische Bestätigungen',
    'Statistiken & Berichte',
    'Mobile App',
  ],
  creator: {
    '@type': 'Organization',
    name: 'nauw',
  },
}

export const localBusinessSchema = (businessData: {
  name: string
  description?: string
  address?: {
    street?: string
    city?: string
    postalCode?: string
  }
  phone?: string
  email?: string
  openingHours?: string[]
  priceRange?: string
  url?: string
}) => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: businessData.name,
  description: businessData.description,
  address: businessData.address
    ? {
        '@type': 'PostalAddress',
        streetAddress: businessData.address.street,
        addressLocality: businessData.address.city,
        postalCode: businessData.address.postalCode,
        addressCountry: 'CH',
      }
    : undefined,
  telephone: businessData.phone,
  email: businessData.email,
  openingHoursSpecification: businessData.openingHours?.map(hours => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: hours,
  })),
  priceRange: businessData.priceRange || 'CHF',
  url: businessData.url,
  potentialAction: {
    '@type': 'ReserveAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: businessData.url,
      actionPlatform: [
        'http://schema.org/DesktopWebPlatform',
        'http://schema.org/MobileWebPlatform',
      ],
    },
    result: {
      '@type': 'Reservation',
      name: 'Terminbuchung',
    },
  },
})

export const faqSchema = (faqs: Array<{ question: string; answer: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
})

export const breadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
})