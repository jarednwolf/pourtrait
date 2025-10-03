'use client'

import React, { useState } from 'react'
import { WineLabelScanner, RestaurantWineListScanner } from '@/components/wine'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { WineInput, ExtractedWineListItem } from '@/types'

type DemoMode = 'wine-label' | 'wine-list' | null

export default function ImageProcessingDemo() {
  const [mode, setMode] = useState<DemoMode>(null)
  const [result, setResult] = useState<any>(null)

  const handleWineDetected = (wineData: Partial<WineInput>) => {
    setResult({ type: 'wine', data: wineData })
    setMode(null)
  }

  const handleWineListProcessed = (wines: ExtractedWineListItem[]) => {
    setResult({ type: 'wine-list', data: wines })
    setMode(null)
  }

  const resetDemo = () => {
    setMode(null)
    setResult(null)
  }

  if (mode === 'wine-label') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <WineLabelScanner
            onWineDetected={handleWineDetected}
            onCancel={() => setMode(null)}
          />
        </div>
      </div>
    )
  }

  if (mode === 'wine-list') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <RestaurantWineListScanner
            onWineListProcessed={handleWineListProcessed}
            onCancel={() => setMode(null)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Image Processing Demo
          </h1>
          <p className="text-lg text-gray-600">
            Test the wine label recognition and restaurant wine list scanning features
          </p>
        </div>

        {result ? (
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {result.type === 'wine' ? 'Wine Label Result' : 'Wine List Result'}
              </h2>
              <Button onClick={resetDemo} variant="outline" size="sm">
                Try Another
              </Button>
            </div>
            
            {result.type === 'wine' ? (
              <div className="space-y-2">
                <div><strong>Name:</strong> {result.data.name || 'Not detected'}</div>
                <div><strong>Producer:</strong> {result.data.producer || 'Not detected'}</div>
                <div><strong>Vintage:</strong> {result.data.vintage || 'Not detected'}</div>
                <div><strong>Region:</strong> {result.data.region || 'Not detected'}</div>
                <div><strong>Varietal:</strong> {result.data.varietal?.join(', ') || 'Not detected'}</div>
                <div><strong>Type:</strong> {result.data.type || 'Not detected'}</div>
              </div>
            ) : (
              <div>
                <p className="mb-4"><strong>Found {result.data.length} wines:</strong></p>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {result.data.map((wine: ExtractedWineListItem, index: number) => (
                    <div key={index} className="border-b pb-2">
                      <div className="font-medium">{wine.name}</div>
                      {wine.producer && <div className="text-sm text-gray-600">{wine.producer}</div>}
                      <div className="flex justify-between text-sm">
                        <span>{wine.vintage && `${wine.vintage} • `}Confidence: {Math.round(wine.confidence * 100)}%</span>
                        {wine.price && <span className="font-medium">{wine.price}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Wine Label Scanner</h2>
              <p className="text-gray-600 mb-6">
                Scan a wine bottle label to automatically extract wine information like name, 
                producer, vintage, and region.
              </p>
              <Button 
                onClick={() => setMode('wine-label')}
                className="w-full"
              >
                Scan Wine Label
              </Button>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Restaurant Wine List Scanner</h2>
              <p className="text-gray-600 mb-6">
                Scan a restaurant wine menu to extract all available wines and get 
                personalized recommendations.
              </p>
              <Button 
                onClick={() => setMode('wine-list')}
                className="w-full"
              >
                Scan Wine List
              </Button>
            </Card>
          </div>
        )}

        <Card className="p-4 mt-8 bg-blue-50 border-blue-200">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Demo Notes</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• This demo requires the Google Vision API to be configured</li>
            <li>• Set GOOGLE_VISION_API_KEY in your environment variables</li>
            <li>• The image processing works best with clear, well-lit photos</li>
            <li>• Results may vary based on image quality and label design</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}