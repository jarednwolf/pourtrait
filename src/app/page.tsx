import { HomeHero } from '@/components/home/HomeHero'
import { MiniPairingTile } from '@/components/home/MiniPairingTile'
import { PromptChipsTile } from '@/components/home/PromptChipsTile'
import nextDynamic from 'next/dynamic'
import { track } from '@/lib/utils/track'
import { CompleteProfileCTA } from '@/components/home/CompleteProfileCTA'
const SocialProof = nextDynamic(
  () => import('@/components/home/SocialProof').then(m => m.SocialProof),
  { loading: () => <div className="h-24 bg-gray-100 rounded animate-pulse" aria-hidden="true" /> }
)
const HowItWorks = nextDynamic(
  () => import('@/components/home/HowItWorks').then(m => m.HowItWorks),
  { loading: () => <div className="h-24 bg-gray-100 rounded animate-pulse" aria-hidden="true" /> }
)
const StartHere = nextDynamic(
  () => import('@/components/home/StartHere').then(m => m.StartHere),
  { loading: () => <div className="h-24 bg-gray-100 rounded animate-pulse" aria-hidden="true" /> }
)
const TrustBadges = nextDynamic(
  () => import('@/components/home/TrustBadges').then(m => m.TrustBadges),
  { loading: () => <div className="h-16 bg-gray-100 rounded animate-pulse" aria-hidden="true" /> }
)
const SEOSection = nextDynamic(
  () => import('@/components/home/SEOSection').then(m => m.SEOSection),
  { loading: () => <div className="h-16 bg-gray-100 rounded animate-pulse" aria-hidden="true" /> }
)

const ScannerDemoTile = nextDynamic(
  () => import('@/components/home/ScannerDemoTile').then(m => m.ScannerDemoTile),
  {
    loading: () => (
      <div className="h-40 bg-gray-100 rounded animate-pulse" aria-hidden="true" />
    ),
  }
)

export default function Home() {
  if (typeof window !== 'undefined') {
    track('landing_viewed')
  }
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <HomeHero />

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <MiniPairingTile />
          <PromptChipsTile />
          <ScannerDemoTile />
        </div>

        <SocialProof />
        <HowItWorks />
        <StartHere />
        <div className="mt-10">
          <CompleteProfileCTA source="home" />
        </div>
        <TrustBadges />

        <section aria-label="Secondary actions" className="py-10">
          <div className="flex flex-wrap gap-2">
            <a href="/restaurant-scanner" className="text-primary underline" aria-label="Scan a label or menu">Scan a label or menu</a>
            <a href="/import?source=home_secondary" className="text-primary underline" aria-label="CSV import helper">CSV import helper</a>
            <a href="/onboarding/step1?source=home_secondary" className="text-primary underline" aria-label="Quick onboarding">Quick onboarding</a>
            <a href="/inventory" className="text-primary underline" aria-label="View inventory">View inventory</a>
            <a
              href={'/chat?q=' + encodeURIComponent('What should I drink tonight?') + '&send=1'}
              className="text-primary underline"
              aria-label="Explore recommendations with AI"
            >
              Explore recommendations
            </a>
            <a href="/settings?tab=notifications" className="text-primary underline" aria-label="Enable notifications">Enable notifications</a>
          </div>
        </section>

        <SEOSection />
      </div>
    </div>
  )
}