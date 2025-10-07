"use client"
import React from 'react'
import { Icon } from '@/components/ui/Icon'
import { track } from '@/lib/utils/track'

export function HowItWorks() {
  const steps = [
    { icon: 'user', title: 'Create your taste profile', desc: 'Answer quick questions to set your baseline.' },
    { icon: 'save', title: 'Add your cellar', desc: 'Track bottles and unlock drinking window insights.' },
    { icon: 'sparkles', title: 'Leverage the AI sommelier', desc: 'Optimize drinking and purchases with clear rationale.' },
  ] as const

  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="py-12">
      <h2 id="how-heading" className="text-heading-2 text-gray-900 text-center mb-8">How it works</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {steps.map((s, i) => (
          <div key={i} className="rounded-lg border border-gray-200 p-5 bg-white">
            <div className="flex items-center mb-2">
              <Icon name={s.icon as any} className="w-5 h-5 text-primary mr-2" aria-hidden="true" />
              <div className="font-medium text-gray-900">{s.title}</div>
            </div>
            <p className="text-sm text-gray-600">{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <a
          href={'/onboarding/step1'}
          onClick={() => track('cta_start_profile', { source: 'how_it_works' })}
          className="inline-flex items-center text-primary underline underline-offset-4"
          aria-label="Start your profile"
        >
          Start your profile
          <span aria-hidden className="ml-1">→</span>
        </a>
      </div>
    </section>
  )
}


