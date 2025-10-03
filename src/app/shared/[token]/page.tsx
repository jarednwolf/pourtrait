'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { collectionSharingService, SharedCollection } from '@/lib/services/collection-sharing'
import { WineCard } from '@/components/wine/WineCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'

export default function SharedCollectionPage() {
  const params = useParams()
  const token = params.token as string

  const [collection, setCollection] = useState<SharedCollection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      loadSharedCollection()
    }
  }, [token])

  const loadSharedCollection = async () => {
    try {
      setLoading(true)
      const sharedCollection = await collectionSharingService.getSharedCollection(token)
      
      if (!sharedCollection) {
        setError('Shared collection not found or no longer available')
        return
      }

      setCollection(sharedCollection)
    } catch (err) {
      setError('Failed to load shared collection')
      console.error('Error loading shared collection:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <Alert variant="destructive">
            {error || 'Collection not found'}
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{collection.title}</h1>
              {collection.description && (
                <p className="text-gray-600 mt-2">{collection.description}</p>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {collection.viewCount} views
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{collection.wines.length} wines</span>
            <span>•</span>
            <span>Shared on {new Date(collection.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Collection Stats */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Collection Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-wine-600">{collection.wines.length}</div>
              <div className="text-sm text-gray-600">Total Wines</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-wine-600">
                {new Set(collection.wines.map(w => w.region)).size}
              </div>
              <div className="text-sm text-gray-600">Regions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-wine-600">
                {new Set(collection.wines.map(w => w.producer)).size}
              </div>
              <div className="text-sm text-gray-600">Producers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-wine-600">
                {collection.wines.reduce((sum, wine) => sum + (wine.quantity || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Bottles</div>
            </div>
          </div>
        </Card>

        {/* Wine Grid */}
        {collection.wines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collection.wines.map((wine) => (
              <WineCard
                key={wine.id}
                wine={wine}
                showActions={false} // Don't show edit/delete actions for shared collections
                showPersonalData={false} // Don't show purchase prices etc.
              />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-600">This collection is empty.</p>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Shared via Pourtrait - Your AI Wine Sommelier</p>
          <p className="mt-2">
            <a 
              href="/" 
              className="text-wine-600 hover:text-wine-700 font-medium"
            >
              Create your own wine collection
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}