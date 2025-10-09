"use client"
import React from 'react'
import { Card } from '@/components/ui/Card'

const QUOTES = [
  { quote: 'Pourtrait removed the guesswork—now I open bottles at their best.', author: 'Sophia, NYC' },
  { quote: 'Recommendations feel spot‑on and the explanations teach me as I go.', author: 'Marco, SF' },
  { quote: 'The cellar view and alerts keep me organized without fuss.', author: 'Ava, Chicago' }
]

export function Testimonials() {
  return (
    <section aria-labelledby="testimonials-heading" className="py-10">
      <h2 id="testimonials-heading" className="text-heading-2 text-center text-gray-900">Loved by curious drinkers</h2>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {QUOTES.map((q, i) => (
          <Card key={i} className="p-5">
            <blockquote className="text-sm text-gray-800">“{q.quote}”</blockquote>
            <div className="mt-3 text-xs text-gray-500">{q.author}</div>
          </Card>
        ))}
      </div>
    </section>
  )
}


