"use client"
import React from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { track } from '@/lib/utils/track'

interface HomeHeroProps {
  className?: string
}

export function HomeHero({ className = '' }: HomeHeroProps) {
  return (
    <section
      className={`relative ${className}`}
      aria-labelledby="home-hero-heading"
    >
      {/* Decorative, CSS-only background (keeps LCP lightweight) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-purple-50/40 to-white"/>

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Copy side */}
          <div className="lg:col-span-7">
            <h1
              id="home-hero-heading"
              className="font-serif font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-700 text-display-2 sm:text-display-1"
            >
              Every bottle a brushstroke
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-gray-700 max-w-2xl">
              Pourtrait learns your taste with each choice—using AI to paint a personal portrait of what you love to drink.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button asChild onClick={() => track('cta_tonights_pick_click')}>
                <a href="/chat?q=What's%20your%20top%20pick%20for%20tonight%3F" aria-label="Get your personalized Tonight’s pick">
                  Get Tonight’s pick
                  <Icon name="arrow-right" className="w-5 h-5 ml-2" aria-hidden="true" />
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="#how-it-works" aria-label="Learn how Pourtrait works">How it works</a>
              </Button>
            </div>

            <dl className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Icon name="zap" className="w-4 h-4 text-primary" aria-hidden="true" />
                <div>
                  <dt className="sr-only">Speed</dt>
                  <dd>Under 60s to value</dd>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="users" className="w-4 h-4 text-primary" aria-hidden="true" />
                <div>
                  <dt className="sr-only">Ease</dt>
                  <dd>Beginner friendly</dd>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="shield-check" className="w-4 h-4 text-primary" aria-hidden="true" />
                <div>
                  <dt className="sr-only">Privacy</dt>
                  <dd>Private by design</dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Visual side (hero image with gradient overlay) */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto w-full max-w-md h-56 sm:h-72 lg:h-80 rounded-2xl overflow-hidden">
              <img
                src="/images/hero.jpg"
                alt="Wine being poured into a glass with soft lighting"
                className="absolute inset-0 h-full w-full object-cover"
                decoding="async"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-200/30 via-fuchsia-200/20 to-rose-100/30" aria-hidden="true" />
              <div className="absolute inset-0 ring-1 ring-white/50" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


