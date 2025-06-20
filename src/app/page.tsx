import { NavigationHeader } from '@/src/components/features/navigation-header'
import { HeroSection } from '@/src/components/features/hero-section'
import { FeaturesSection } from '@/src/components/features/features-section'
import { HowItWorksSection } from '@/src/components/features/how-it-works-section'
import { CTASection } from '@/src/components/features/cta-section'
import { Footer } from '@/src/components/features/footer'

export default function Home() {
  return (
    <>
      <NavigationHeader />
      <main className="min-h-screen">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}