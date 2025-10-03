'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { InteractiveDemo } from '@/components/demo/InteractiveDemo'
import { DemoTasteProfileQuiz } from '@/components/demo/DemoTasteProfileQuiz'
import { DemoRecommendations } from '@/components/demo/DemoRecommendations'

type DemoState = 'landing' | 'interactive' | 'quiz' | 'results'

export default function Home() {
  const router = useRouter()
  const [demoState, setDemoState] = React.useState<DemoState>('landing')
  const [quizResult, setQuizResult] = React.useState<any>(null)

  const handleStartInteractiveDemo = () => {
    setDemoState('interactive')
  }

  const handleStartQuiz = () => {
    setDemoState('quiz')
  }

  const handleQuizComplete = (result: any) => {
    setQuizResult(result)
    setDemoState('results')
  }

  const handleSignUp = () => {
    router.push('/auth/signup')
  }

  const handleTryAnother = () => {
    setDemoState('landing')
    setQuizResult(null)
  }

  const handleBackToLanding = () => {
    setDemoState('landing')
  }

  if (demoState === 'interactive') {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={handleBackToLanding}
              className="flex items-center"
            >
              <Icon name="arrow-left" size="sm" className="mr-2" />
              Back to Home
            </Button>
          </div>
          <InteractiveDemo
            onStartQuiz={handleStartQuiz}
            onSignUp={handleSignUp}
          />
        </div>
      </main>
    )
  }

  if (demoState === 'quiz') {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={handleBackToLanding}
              className="flex items-center"
            >
              <Icon name="arrow-left" size="sm" className="mr-2" />
              Back to Home
            </Button>
          </div>
          <DemoTasteProfileQuiz onComplete={handleQuizComplete} />
        </div>
      </main>
    )
  }

  if (demoState === 'results' && quizResult) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={handleBackToLanding}
              className="flex items-center"
            >
              <Icon name="arrow-left" size="sm" className="mr-2" />
              Back to Home
            </Button>
          </div>
          <DemoRecommendations
            tasteProfile={quizResult}
            onSignUp={handleSignUp}
            onTryAnother={handleTryAnother}
          />
        </div>
      </main>
    )
  }

  // Landing page
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <Badge className="mb-6 bg-purple-100 text-purple-800 border-purple-200">
              <Icon name="sparkles" size="sm" className="mr-1" />
              AI-Powered Wine Intelligence
            </Badge>
            
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Your Personal
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                {' '}AI Sommelier
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Discover wines you'll love, manage your collection intelligently, and get expert recommendations 
              tailored to your taste—whether you're a beginner or connoisseur.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                onClick={handleStartInteractiveDemo}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8"
              >
                <Icon name="play" size="sm" className="mr-2" />
                Try Interactive Demo
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleStartQuiz}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Icon name="clipboard-list" size="sm" className="mr-2" />
                Take Taste Quiz
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center">
                <Icon name="shield-check" size="sm" className="mr-2 text-green-600" />
                Free to start
              </div>
              <div className="flex items-center">
                <Icon name="users" size="sm" className="mr-2 text-blue-600" />
                No wine experience required
              </div>
              <div className="flex items-center">
                <Icon name="zap" size="sm" className="mr-2 text-purple-600" />
                Instant recommendations
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Enjoy Wine
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From managing your collection to discovering new favorites, Pourtrait makes wine accessible and enjoyable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon name="camera" size="md" className="text-purple-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Smart Wine Scanning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Simply photograph wine labels to automatically add them to your collection. 
                  Our AI recognizes wines and fills in all the details.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon name="brain" size="md" className="text-blue-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Personalized AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Get tailored wine suggestions based on your taste profile, occasion, and food pairings. 
                  Our AI learns your preferences over time.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon name="clock" size="md" className="text-green-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Optimal Drinking Windows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Never miss a wine's peak again. Get intelligent alerts about when your wines 
                  are ready to drink for maximum enjoyment.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Preview Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              See Pourtrait in Action
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience our AI sommelier before you sign up. No commitment required.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleStartInteractiveDemo}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Interactive Demo
                  </CardTitle>
                  <Icon name="external-link" size="sm" className="text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Ask our AI sommelier any wine question and see how it provides personalized recommendations.
                  </p>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-800 italic">
                      "What wine should I serve with pasta and grilled vegetables for 6 people?"
                    </p>
                  </div>
                  <Button className="w-full" onClick={handleStartInteractiveDemo}>
                    Try Interactive Demo
                    <Icon name="arrow-right" size="sm" className="ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleStartQuiz}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Taste Profile Quiz
                  </CardTitle>
                  <Icon name="external-link" size="sm" className="text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Take our quick taste profile quiz to see how we create personalized wine recommendations.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      5 quick questions • Personalized results • No signup required
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleStartQuiz}>
                    Take Taste Quiz
                    <Icon name="arrow-right" size="sm" className="ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Perfect for Every Wine Lover
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="leaf" size="lg" className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Wine Beginners</h3>
              <p className="text-gray-600">
                Learn about wine without intimidation. Our AI explains everything in simple, 
                approachable language.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="trending-up" size="lg" className="text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Casual Enthusiasts</h3>
              <p className="text-gray-600">
                Expand your palate and discover new wines that match your evolving taste preferences.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="award" size="lg" className="text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Wine Collectors</h3>
              <p className="text-gray-600">
                Manage your collection intelligently with drinking window alerts and detailed tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Discover Your Perfect Wine?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of wine lovers who use Pourtrait to discover, manage, and enjoy wine like never before.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={handleSignUp}
              className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8"
            >
              Create Free Account
              <Icon name="arrow-right" size="sm" className="ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleStartInteractiveDemo}
              className="border-white text-white hover:bg-white/10"
            >
              Try Demo First
            </Button>
          </div>

          <p className="text-sm text-purple-200 mt-6">
            Free to start • No credit card required • Cancel anytime
          </p>
        </div>
      </section>
    </main>
  )
}