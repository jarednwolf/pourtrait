"use client"
import React from 'react'
import Image from 'next/image'
import heroImg from 'public/images/hero.jpg'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { track } from '@/lib/utils/track'

interface HomeHeroProps {
  className?: string
}

export function HomeHero({ className = '' }: HomeHeroProps) {
  return (
    <section
      className={`relative bg-white dark:bg-transparent ${className}`}
      aria-labelledby="home-hero-heading"
    >
      <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-8 sm:pt-12 sm:pb-10 lg:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Copy side */}
          <div className="lg:col-span-7">
            <h1
              id="home-hero-heading"
              className="font-serif font-bold tracking-tight text-gray-900 lg:text-brand-gradient text-heading-1"
            >
              Every bottle a brushstroke
            </h1>
            <p className="mt-5 text-body-lg text-gray-700 dark:text-gray-300 max-w-2xl">
              Build your palate profile and cellar over time. Pourtrait learns your preferences, guides your wine journey with personalized recommendations, and alerts you when bottles are at their best.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" onClick={() => track('cta_home_start_profile')}>
                <a href="/onboarding/step1" aria-label="Start your taste profile and see tonight’s pick">
                  Start your taste profile
                  <Icon name="arrow-right" className="w-5 h-5 ml-2" aria-hidden="true" />
                </a>
              </Button>
              {/* Secondary CTA removed for focus */}
            </div>

            <ul className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-700" role="list">
              <li className="flex items-center gap-3">
                <Icon name="sparkles" className="w-5 h-5 text-primary" aria-hidden="true" />
                <span>Learns your taste over time</span>
              </li>
              <li className="flex items-center gap-3">
                <Icon name="clock" className="w-5 h-5 text-primary" aria-hidden="true" />
                <span>Drink‑window alerts</span>
              </li>
              <li className="flex items-center gap-3">
                <Icon name="shield-check" className="w-5 h-5 text-primary" aria-hidden="true" />
                <span>Private by design</span>
              </li>
            </ul>
          </div>

          {/* Visual side (hero image with gradient overlay) */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto w-full max-w-md h-56 sm:h-72 lg:h-80 rounded-2xl overflow-hidden">
              <Image
                src={heroImg}
                alt="Wine being poured into a glass with soft lighting"
                fill
                priority
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-fuchsia-200/10 to-rose-100/15 dark:from-primary/10 dark:via-transparent dark:to-transparent" aria-hidden="true" />
              <div className="absolute inset-0 ring-1 ring-white/50 dark:ring-white/10" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


