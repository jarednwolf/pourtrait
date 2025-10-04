/**
 * Interactive Demo Component
 * 
 * Main demo interface that showcases the "What should I drink?" functionality
 * without requiring user signup. Includes both quiz-based and direct query demos.
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/design-system/utils'

interface InteractiveDemoProps {
  onStartQuiz: () => void
  onSignUp: () => void
  className?: string
}

interface DemoScenario {
  id: string
  title: string
  description: string
  query: string
  context: string
  icon: string
}

const demoScenarios: DemoScenario[] = [
  {
    id: 'dinner-party',
    title: 'Dinner Party Tonight',
    description: 'Hosting friends for Italian food',
    query: 'What wine should I serve with pasta and grilled vegetables for 6 people?',
    context: 'Casual dinner party, Italian cuisine, budget $20-30 per bottle',
    icon: 'users'
  },
  {
    id: 'romantic-evening',
    title: 'Romantic Evening',
    description: 'Special date night at home',
    query: 'Recommend a romantic wine for dinner with salmon and asparagus',
    context: 'Intimate dinner, seafood main course, special occasion',
    icon: 'heart'
  },
  {
    id: 'wine-learning',
    title: 'Learning About Wine',
    description: 'New to wine, want to explore',
    query: 'I\'m new to wine. What should I try to learn about different styles?',
    context: 'Beginner-friendly, educational, variety of styles',
    icon: 'book-open'
  },
  {
    id: 'celebration',
    title: 'Celebration',
    description: 'Toasting a promotion',
    query: 'What sparkling wine should I get to celebrate a job promotion?',
    context: 'Celebration, sparkling wine, special occasion',
    icon: 'gift'
  }
]

export function InteractiveDemo({
  onStartQuiz,
  onSignUp,
  className
}: InteractiveDemoProps) {
  const [selectedScenario, setSelectedScenario] = React.useState<DemoScenario | null>(null)
  const [customQuery, setCustomQuery] = React.useState('')
  const [showResponse, setShowResponse] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleScenarioSelect = (scenario: DemoScenario) => {
    setSelectedScenario(scenario)
    setCustomQuery(scenario.query)
    setShowResponse(false)
  }

  const handleGetRecommendation = async () => {
    if (!customQuery.trim()) {return}

    setIsLoading(true)
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
    setShowResponse(true)
  }

  const generateSampleResponse = () => {
    if (!selectedScenario && !customQuery) {return null}

    const scenario = selectedScenario || { id: 'custom', context: 'Custom query' }
    
    switch (scenario.id) {
      case 'dinner-party':
        return {
          wines: [
            {
              name: 'Chianti Classico',
              producer: 'Castello di Verrazzano',
              reasoning: 'Perfect for Italian cuisine with its bright acidity and food-friendly tannins',
              price: '$22',
              confidence: 94
            },
            {
              name: 'Barbera d\'Alba',
              producer: 'Michele Chiarlo',
              reasoning: 'Excellent with grilled vegetables, medium-bodied with great versatility',
              price: '$18',
              confidence: 89
            }
          ],
          explanation: 'For your Italian dinner party, I recommend wines that complement both pasta and grilled vegetables. These selections offer excellent food pairing versatility and are crowd-pleasers.',
          tips: [
            'Serve at cellar temperature (60-65°F)',
            'Open 30 minutes before serving to let them breathe',
            'Consider having both options available for guest preferences'
          ]
        }
      
      case 'romantic-evening':
        return {
          wines: [
            {
              name: 'Sancerre',
              producer: 'Henri Bourgeois',
              reasoning: 'Elegant Sauvignon Blanc that pairs beautifully with salmon, crisp and sophisticated',
              price: '$35',
              confidence: 96
            }
          ],
          explanation: 'For a romantic evening with salmon, this Loire Valley white wine offers elegance and perfect food pairing. Its mineral complexity and crisp finish complement the richness of salmon.',
          tips: [
            'Chill to 45-50°F for optimal serving temperature',
            'The wine\'s minerality enhances the salmon\'s natural flavors',
            'Consider decanting for a special presentation'
          ]
        }

      case 'wine-learning':
        return {
          wines: [
            {
              name: 'Pinot Noir',
              producer: 'Erath (Oregon)',
              reasoning: 'Approachable red wine that showcases classic varietal character without overwhelming tannins',
              price: '$20',
              confidence: 92
            },
            {
              name: 'Sauvignon Blanc',
              producer: 'Oyster Bay (New Zealand)',
              reasoning: 'Crisp, clean white wine that demonstrates bright acidity and fruit-forward style',
              price: '$12',
              confidence: 90
            }
          ],
          explanation: 'As a wine beginner, these selections represent two classic styles that are approachable yet educational. They showcase distinct varietal characteristics without being overwhelming.',
          tips: [
            'Taste them side by side to understand red vs. white differences',
            'Take notes on what you smell and taste',
            'Try them with different foods to see how pairings work'
          ]
        }

      case 'celebration':
        return {
          wines: [
            {
              name: 'Champagne Brut',
              producer: 'Veuve Clicquot',
              reasoning: 'Classic celebration wine with perfect balance of elegance and festivity',
              price: '$55',
              confidence: 98
            },
            {
              name: 'Cava Brut',
              producer: 'Freixenet',
              reasoning: 'Excellent value sparkling wine for celebrations, crisp and celebratory',
              price: '$15',
              confidence: 85
            }
          ],
          explanation: 'Congratulations on your promotion! These sparkling wines are perfect for toasting achievements. Choose based on your budget - both offer excellent celebration-worthy bubbles.',
          tips: [
            'Chill thoroughly before serving (38-42°F)',
            'Open carefully to preserve the bubbles',
            'Serve in flutes to maintain effervescence'
          ]
        }

      default:
        return {
          wines: [
            {
              name: 'Versatile Selection',
              producer: 'Recommended Producer',
              reasoning: 'Based on your query, this wine offers great balance and food pairing versatility',
              price: '$25',
              confidence: 88
            }
          ],
          explanation: 'Based on your specific request, here\'s a personalized recommendation that should meet your needs.',
          tips: [
            'Consider the serving temperature for optimal enjoyment',
            'Think about food pairings to enhance the experience'
          ]
        }
    }
  }

  const sampleResponse = generateSampleResponse()

  return (
    <div className={cn('max-w-4xl mx-auto space-y-6', className)}>
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Try Our AI Sommelier
          </CardTitle>
          <p className="text-lg text-gray-600 mt-2">
            Ask any wine question and see how our AI provides personalized recommendations
          </p>
          <div className="flex justify-center mt-4">
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <Icon name="zap" size="sm" className="mr-1" />
              Interactive Demo
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Demo Scenarios */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Try These Common Scenarios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demoScenarios.map((scenario) => (
            <Card 
              key={scenario.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                selectedScenario?.id === scenario.id ? 'ring-2 ring-purple-500 bg-purple-50' : ''
              )}
              onClick={() => handleScenarioSelect(scenario)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Icon name={scenario.icon as any} size="md" className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{scenario.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
                    <p className="text-xs text-gray-500 italic">"{scenario.query}"</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Query Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Or Ask Your Own Question
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="What wine should I drink with dinner tonight?"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                className="text-base"
              />
            </div>
            <Button
              onClick={handleGetRecommendation}
              disabled={!customQuery.trim() || isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Icon name="loader" size="sm" className="mr-2 animate-spin" />
                  Getting Recommendations...
                </>
              ) : (
                <>
                  <Icon name="search" size="sm" className="mr-2" />
                  Get AI Recommendation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sample Response */}
      {showResponse && sampleResponse && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <Icon name="wine-glass" size="sm" className="mr-2 text-purple-600" />
              AI Sommelier Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700">{sampleResponse.explanation}</p>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Recommended Wines:</h4>
                {sampleResponse.wines.map((wine, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-semibold text-gray-900">{wine.name}</h5>
                        <p className="text-sm text-gray-600">{wine.producer}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">{wine.price}</div>
                        <div className="text-xs text-gray-500">{wine.confidence}% match</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{wine.reasoning}</p>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Sommelier Tips:</h4>
                <ul className="space-y-1">
                  {sampleResponse.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <Icon name="check" size="sm" className="mr-2 text-green-600 mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">Experience the Full Power</h3>
            <p className="text-purple-100 max-w-2xl mx-auto">
              This demo shows just a glimpse of what Pourtrait can do. Create your account to get 
              personalized recommendations based on your actual wine collection and refined taste profile.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={onStartQuiz}
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 font-semibold"
              >
                Take Full Taste Quiz
                <Icon name="arrow-right" size="sm" className="ml-2" />
              </Button>
              <Button
                onClick={onSignUp}
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                Create Free Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}