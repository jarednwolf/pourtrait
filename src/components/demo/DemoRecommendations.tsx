/**
 * Demo Recommendations Component
 * 
 * Shows sample wine recommendations based on demo quiz responses.
 * Demonstrates the AI sommelier capabilities without requiring actual AI calls.
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/design-system/utils'

interface DemoRecommendation {
  id: string
  name: string
  producer: string
  vintage: number
  region: string
  varietal: string[]
  type: 'red' | 'white' | 'rosé' | 'sparkling'
  priceRange: string
  reasoning: string
  confidence: number
  educationalNote?: string
  pairingNotes: string[]
}

interface DemoRecommendationsProps {
  tasteProfile: any
  onSignUp: () => void
  onTryAnother: () => void
  className?: string
}

export function DemoRecommendations({
  tasteProfile,
  onSignUp,
  onTryAnother,
  className
}: DemoRecommendationsProps) {
  // Generate sample recommendations based on taste profile
  const recommendations = generateSampleRecommendations(tasteProfile)

  return (
    <div className={cn('max-w-4xl mx-auto space-y-6', className)}>
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Your Personalized Wine Recommendations
          </CardTitle>
          <p className="text-lg text-gray-600 mt-2">
            Based on your preferences, here's what our AI sommelier recommends
          </p>
          <div className="flex justify-center mt-4">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <Icon name="check-circle" size="sm" className="mr-2" />
              Demo Complete - See how it works!
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* Taste Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
            <Icon name="user" size="sm" className="mr-2" />
            Your Wine Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {tasteProfile.experienceLevel}
              </div>
              <div className="text-sm text-gray-600">Experience Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(tasteProfile.confidenceScore * 100)}%
              </div>
              <div className="text-sm text-gray-600">Profile Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {recommendations.length}
              </div>
              <div className="text-sm text-gray-600">Recommendations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Recommended Wines</h3>
        {recommendations.map((wine) => (
          <Card key={wine.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {wine.name}
                      </h4>
                      <p className="text-gray-600">
                        {wine.producer} • {wine.vintage} • {wine.region}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Badge variant="primary" className="capitalize">
                        {wine.type}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Icon name="star" size="sm" className="mr-1 text-yellow-500" />
                        {Math.round(wine.confidence * 100)}% match
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-gray-700 mb-2">
                      <span className="font-medium">Why this wine:</span> {wine.reasoning}
                    </p>
                    {wine.educationalNote && (
                      <p className="text-blue-700 bg-blue-50 p-3 rounded-lg text-sm">
                        <Icon name="lightbulb" size="sm" className="inline mr-1" />
                        {wine.educationalNote}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Varietals:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {wine.varietal.map(v => (
                          <Badge key={v} variant="secondary" className="text-xs">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Price Range:</span>
                      <span className="ml-2 text-gray-600">{wine.priceRange}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="font-medium text-gray-700">Food Pairings:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {wine.pairingNotes.map(pairing => (
                        <span key={pairing} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {pairing}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">Ready to Build Your Wine Collection?</h3>
            <p className="text-purple-100 max-w-2xl mx-auto">
              This is just a preview! Create your account to track your actual wine inventory, 
              get personalized recommendations, and discover wines you'll love.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 text-left">
              <div className="bg-white/10 p-4 rounded-lg">
                <Icon name="wine-glass" size="md" className="mb-2" />
                <h4 className="font-semibold mb-1">Track Your Collection</h4>
                <p className="text-sm text-purple-100">
                  Scan wine labels, track drinking windows, and manage your inventory
                </p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <Icon name="brain" size="md" className="mb-2" />
                <h4 className="font-semibold mb-1">AI Sommelier</h4>
                <p className="text-sm text-purple-100">
                  Get personalized recommendations and expert wine advice
                </p>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <Icon name="trending-up" size="md" className="mb-2" />
                <h4 className="font-semibold mb-1">Learn & Grow</h4>
                <p className="text-sm text-purple-100">
                  Expand your palate with educational content and tasting notes
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={onSignUp}
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 font-semibold"
              >
                Create Free Account
                <Icon name="arrow-right" size="sm" className="ml-2" />
              </Button>
              <Button
                onClick={onTryAnother}
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                Try Another Demo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Generate sample recommendations based on taste profile
 */
function generateSampleRecommendations(tasteProfile: any): DemoRecommendation[] {
  const experienceLevel = tasteProfile.experienceLevel
  const isBeginnerFriendly = experienceLevel === 'beginner'

  const recommendations: DemoRecommendation[] = []

  // Red wine recommendation
  if (tasteProfile.redWinePreferences?.body !== undefined) {
    const redWine: DemoRecommendation = {
      id: 'demo-red-1',
      name: tasteProfile.redWinePreferences.body === 'light' ? 'Pinot Noir' : 
            tasteProfile.redWinePreferences.body === 'full' ? 'Cabernet Sauvignon' : 'Merlot',
      producer: tasteProfile.redWinePreferences.body === 'light' ? 'Willamette Valley Vineyards' :
                tasteProfile.redWinePreferences.body === 'full' ? 'Napa Valley Reserve' : 'Columbia Crest',
      vintage: 2021,
      region: tasteProfile.redWinePreferences.body === 'light' ? 'Oregon' :
              tasteProfile.redWinePreferences.body === 'full' ? 'Napa Valley' : 'Washington',
      varietal: tasteProfile.redWinePreferences.body === 'light' ? ['Pinot Noir'] :
                tasteProfile.redWinePreferences.body === 'full' ? ['Cabernet Sauvignon'] : ['Merlot'],
      type: 'red',
      priceRange: isBeginnerFriendly ? '$15-25' : '$25-40',
      reasoning: `Perfect match for your preference for ${tasteProfile.redWinePreferences.body}-bodied red wines. This wine offers excellent balance and represents great value.`,
      confidence: 0.92,
      educationalNote: isBeginnerFriendly ? 
        `This wine is an excellent introduction to ${tasteProfile.redWinePreferences.body}-bodied reds, with approachable flavors that showcase the varietal character.` : 
        undefined,
      pairingNotes: tasteProfile.redWinePreferences.body === 'light' ? 
        ['Salmon', 'Mushroom risotto', 'Roasted chicken'] :
        tasteProfile.redWinePreferences.body === 'full' ?
        ['Grilled steak', 'Aged cheese', 'Dark chocolate'] :
        ['Pasta with tomato sauce', 'Grilled vegetables', 'Medium-aged cheese']
    }
    recommendations.push(redWine)
  }

  // White wine recommendation
  if (tasteProfile.whiteWinePreferences?.body !== undefined) {
    const whiteWine: DemoRecommendation = {
      id: 'demo-white-1',
      name: tasteProfile.whiteWinePreferences.body === 'light' ? 'Sauvignon Blanc' : 'Chardonnay',
      producer: tasteProfile.whiteWinePreferences.body === 'light' ? 'Marlborough Vineyards' : 'Sonoma Coast Cellars',
      vintage: 2022,
      region: tasteProfile.whiteWinePreferences.body === 'light' ? 'New Zealand' : 'California',
      varietal: tasteProfile.whiteWinePreferences.body === 'light' ? ['Sauvignon Blanc'] : ['Chardonnay'],
      type: 'white',
      priceRange: isBeginnerFriendly ? '$12-20' : '$20-35',
      reasoning: `Ideal for your taste in ${tasteProfile.whiteWinePreferences.body}-bodied white wines. This wine delivers crisp, clean flavors with excellent food pairing versatility.`,
      confidence: 0.89,
      educationalNote: isBeginnerFriendly ?
        `This is a fantastic example of ${tasteProfile.whiteWinePreferences.body === 'light' ? 'crisp, refreshing' : 'rich, complex'} white wine that's perfect for learning about different white wine styles.` :
        undefined,
      pairingNotes: tasteProfile.whiteWinePreferences.body === 'light' ?
        ['Fresh seafood', 'Goat cheese salad', 'Sushi'] :
        ['Lobster', 'Creamy pasta', 'Roasted chicken']
    }
    recommendations.push(whiteWine)
  }

  // Sparkling recommendation for special occasions
  if (tasteProfile.generalPreferences?.occasionPreferences?.includes('celebrations')) {
    const sparklingWine: DemoRecommendation = {
      id: 'demo-sparkling-1',
      name: 'Prosecco',
      producer: 'Villa Sandi',
      vintage: 2022,
      region: 'Veneto, Italy',
      varietal: ['Glera'],
      type: 'sparkling',
      priceRange: '$15-25',
      reasoning: 'Perfect for celebrations and special occasions. This sparkling wine offers bright acidity and festive bubbles.',
      confidence: 0.85,
      educationalNote: isBeginnerFriendly ?
        'Prosecco is an excellent introduction to sparkling wines - lighter and more approachable than Champagne, with delightful fruit flavors.' :
        undefined,
      pairingNotes: ['Appetizers', 'Light seafood', 'Fruit desserts', 'Celebration toasts']
    }
    recommendations.push(sparklingWine)
  }

  return recommendations
}