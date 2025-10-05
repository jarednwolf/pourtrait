import { redirect } from 'next/navigation'

export default function OnboardingIndex() {
  redirect('/onboarding/step1')
}

// Metadata belongs in layout, this is a redirect utility page only.


