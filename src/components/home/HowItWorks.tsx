import React from 'react'
import { Icon } from '@/components/ui/Icon'

export function HowItWorks() {
  const steps = [
    { icon: 'sparkles', title: "Tell us tonight's context", desc: 'Dish, budget, or vibe.' },
    { icon: 'brain', title: 'AI sommelier picks', desc: 'Clear pick with rationale and alternatives.' },
    { icon: 'save', title: 'Save and learn', desc: 'Track what you like; get smarter over time.' },
  ] as const

  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="py-8">
      <h2 id="how-heading" className="text-xl font-semibold text-gray-900 text-center mb-6">How it works</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {steps.map((s, i) => (
          <div key={i} className="rounded-lg border border-gray-200 p-4 bg-white">
            <div className="flex items-center mb-2">
              <Icon name={s.icon as any} className="w-5 h-5 text-purple-600 mr-2" aria-hidden="true" />
              <div className="font-medium text-gray-900">{s.title}</div>
            </div>
            <p className="text-sm text-gray-600">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}


