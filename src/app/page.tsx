import { HomeHero } from '@/components/home/HomeHero'
export const revalidate = 0
export const dynamic = 'force-dynamic'
import { HomeBenefitsWrapper } from '@/components/home/HomeBenefitsWrapper'
import nextDynamic from 'next/dynamic'
import { track } from '@/lib/utils/track'
import { CompleteProfileCTA } from '@/components/home/CompleteProfileCTA'
// SocialProof removed from MVP landing to focus on funnel
// HowItWorks removed from landing to reduce redundancy
const TrustBadges = nextDynamic(
  () => import('@/components/home/TrustBadges').then(m => m.TrustBadges),
  { loading: () => <div className="h-16 bg-gray-100 rounded animate-pulse" aria-hidden="true" /> }
)
const SEOSection = nextDynamic(
  () => import('@/components/home/SEOSection').then(m => m.SEOSection),
  { loading: () => <div className="h-16 bg-gray-100 rounded animate-pulse" aria-hidden="true" /> }
)

// Scanner demo tile removed from hero area; replaced by focused benefits + demo modal

export default function Home() {
  if (typeof window !== 'undefined') {
    track('landing_viewed')
  }
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <HomeHero />

        <HomeBenefitsWrapper />
        {/* Testimonials and HowItWorks removed for simplicity */}
        <div className="mt-10">
          <CompleteProfileCTA source="home" />
        </div>
        <TrustBadges />

        <section aria-label="Footer links" className="py-6">
          <div className="flex flex-wrap gap-2">
            <a href="/privacy" className="text-primary underline" aria-label="Privacy policy">Privacy</a>
            <a href="/terms" className="text-primary underline" aria-label="Terms of service">Terms</a>
            <a href="/contact" className="text-primary underline" aria-label="Contact support">Contact</a>
          </div>
        </section>

        <SEOSection />
      </div>
    </div>
  )
}