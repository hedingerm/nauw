import { Metadata } from 'next'
import { NavigationHeader } from '@/src/components/features/navigation-header'
import { HeroSection } from '@/src/components/features/hero-section'
import { FeaturesSection } from '@/src/components/features/features-section'
import { TestimonialsSection } from '@/src/components/features/testimonials-section'
import { HowItWorksSection } from '@/src/components/features/how-it-works-section'
import { FAQSection } from '@/src/components/features/faq-section'
import { CTASection } from '@/src/components/features/cta-section'
import { Footer } from '@/src/components/features/footer'
import { generateMetadata as generateSEOMetadata } from '@/src/lib/seo/metadata'
import { StructuredDataScript } from '@/src/components/seo/structured-data-script'
import { faqSchema } from '@/src/lib/seo/structured-data'

export const metadata: Metadata = generateSEOMetadata({
  title: undefined, // Use default for homepage
  description: 'nauw - Die führende Online Terminbuchungssoftware für Schweizer Unternehmen. Steigern Sie Ihre Effizienz mit automatischer Terminvergabe, Kundenverwaltung und SMS-Erinnerungen.',
})

// FAQ data for structured data
const faqData = [
  {
    question: 'Was kostet nauw?',
    answer: 'nauw bietet flexible Preispläne ab CHF 29 pro Monat. Sie können die Software 14 Tage kostenlos und unverbindlich testen.',
  },
  {
    question: 'Ist nauw DSGVO-konform?',
    answer: 'Ja, nauw ist vollständig DSGVO-konform und speichert alle Daten sicher in der Schweiz.',
  },
  {
    question: 'Kann ich nauw auf dem Handy nutzen?',
    answer: 'Ja, nauw ist vollständig mobil optimiert und funktioniert auf allen Geräten - Smartphone, Tablet und Desktop.',
  },
  {
    question: 'Wie schnell kann ich nauw einrichten?',
    answer: 'Die Grundeinrichtung dauert nur wenige Minuten. Nach der Registrierung können Sie sofort mit der Terminvergabe beginnen.',
  },
  {
    question: 'Bietet nauw SMS-Erinnerungen?',
    answer: 'Ja, nauw sendet automatische SMS-Erinnerungen an Ihre Kunden, um No-Shows zu reduzieren.',
  },
]

export default function Home() {
  return (
    <>
      <NavigationHeader />
      <main className="min-h-screen">
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
        <HowItWorksSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
      <StructuredDataScript data={faqSchema(faqData)} />
    </>
  )
}