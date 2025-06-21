import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://nauw.ch'
  const currentDate = new Date()

  // Static marketing pages
  const staticPages = [
    '',
    '/funktionen',
    '/preise',
    '/integrationen',
    '/sicherheit',
    '/ressourcen',
    '/erfolgsgeschichten',
    '/ueber-uns',
    '/kontakt',
    '/impressum',
    '/datenschutz',
  ]

  // Industry-specific landing pages
  const industryPages = [
    '/friseure',
    '/therapeuten',
    '/nachhilfe',
    '/beauty',
    '/massage',
    '/kosmetik',
    '/personal-trainer',
    '/berater',
  ]

  // City/Canton pages for local SEO
  const locationPages = [
    '/zuerich',
    '/basel',
    '/bern',
    '/genf',
    '/lausanne',
    '/winterthur',
    '/luzern',
    '/st-gallen',
  ]

  const sitemap: MetadataRoute.Sitemap = []

  // Add static pages
  staticPages.forEach(page => {
    sitemap.push({
      url: `${baseUrl}${page}`,
      lastModified: currentDate,
      changeFrequency: page === '' ? 'daily' : 'weekly',
      priority: page === '' ? 1.0 : 0.8,
    })
  })

  // Add industry pages
  industryPages.forEach(page => {
    sitemap.push({
      url: `${baseUrl}${page}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    })
  })

  // Add location pages
  locationPages.forEach(page => {
    sitemap.push({
      url: `${baseUrl}${page}`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  })

  // Auth pages (lower priority)
  const authPages = ['/login', '/register']
  authPages.forEach(page => {
    sitemap.push({
      url: `${baseUrl}${page}`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    })
  })

  return sitemap
}