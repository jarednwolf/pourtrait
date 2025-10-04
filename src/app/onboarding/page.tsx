import { redirect } from 'next/navigation'

export default function OnboardingIndex() {
  redirect('/onboarding/step1')
}

export const metadata = {
  title: 'Onboarding - Pourtrait'
}


