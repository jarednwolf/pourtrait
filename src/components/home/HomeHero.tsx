import React from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'

interface HomeHeroProps {
  className?: string
}

export function HomeHero({ className = '' }: HomeHeroProps) {
  return (
    <section className={`text-center ${className}`} aria-labelledby="home-hero-heading">
      <div className="mx-auto max-w-3xl">
        <h1 id="home-hero-heading" className="text-4xl sm:text-6xl font-bold text-gray-900 mb-4">
          Your AI Sommelier for everyday wine decisions
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-6">
          Get a fast, personalized pick for tonight, pair any dish in seconds, and build a smarter cellar.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <a href="/chat?q=What's%20your%20top%20pick%20for%20tonight%3F" aria-label="Get your personalized Tonight’s pick">
              Get your personalized Tonight’s pick
              <Icon name="arrow-right" className="w-5 h-5 ml-2" aria-hidden="true" />
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="#how-it-works" aria-label="Learn how Pourtrait works">How it works</a>
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap justify-center items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center" aria-label="Fast moment of value">
            <Icon name="zap" className="w-4 h-4 text-purple-600 mr-2" aria-hidden="true" />
            Under 60 seconds to value
          </div>
          <div className="flex items-center" aria-label="No expertise required">
            <Icon name="users" className="w-4 h-4 text-purple-600 mr-2" aria-hidden="true" />
            Beginner friendly
          </div>
          <div className="flex items-center" aria-label="Private and secure">
            <Icon name="shield-check" className="w-4 h-4 text-purple-600 mr-2" aria-hidden="true" />
            Private by design
          </div>
        </div>
      </div>
    </section>
  )
}


