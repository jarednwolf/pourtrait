import { HomeHero } from '@/components/home/HomeHero'
import { MiniPairingTile } from '@/components/home/MiniPairingTile'
import { PromptChipsTile } from '@/components/home/PromptChipsTile'
import { ScannerDemoTile } from '@/components/home/ScannerDemoTile'
import { SocialProof } from '@/components/home/SocialProof'
import { HowItWorks } from '@/components/home/HowItWorks'
import { TrustBadges } from '@/components/home/TrustBadges'
import { SEOSection } from '@/components/home/SEOSection'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <HomeHero />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <MiniPairingTile />
          <PromptChipsTile />
          <ScannerDemoTile />
        </div>

        <SocialProof />
        <HowItWorks />
        <TrustBadges />

        <section aria-label="Secondary actions" className="py-6">
          <div className="flex flex-wrap gap-2">
            <a href="/restaurant-scanner" className="text-purple-700 underline" aria-label="Scan a label or menu">Scan a label or menu</a>
            <a href="/import?source=home_secondary" className="text-purple-700 underline" aria-label="CSV import helper">CSV import helper</a>
            <a href="/onboarding/step1?source=home_secondary" className="text-purple-700 underline" aria-label="Quick onboarding">Quick onboarding</a>
            <a href="/inventory" className="text-purple-700 underline" aria-label="View inventory">View inventory</a>
            <a
              href={'/chat?q=' + encodeURIComponent('What should I drink tonight?') + '&send=1'}
              className="text-purple-700 underline"
              aria-label="Explore recommendations with AI"
            >
              Explore recommendations
            </a>
            <a href="/settings?tab=notifications" className="text-purple-700 underline" aria-label="Enable notifications">Enable notifications</a>
          </div>
        </section>

        <SEOSection />
      </div>
    </div>
  )
}