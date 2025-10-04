'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import type { Wine } from '@/types'
import type { ConsumptionRecord } from '@/types'

interface WineDetailPageProps {
  wine: Wine
  consumptionHistory?: ConsumptionRecord[]
  onEdit?: (wine: Wine) => void
  onConsume?: (wine: Wine) => void
  onDelete?: (wine: Wine) => void
  onBack?: () => void
  isLoading?: boolean
}

const WINE_TYPE_COLORS = {
  red: 'bg-red-100 text-red-800',
  white: 'bg-yellow-100 text-yellow-800',
  rosé: 'bg-pink-100 text-pink-800',
  sparkling: 'bg-blue-100 text-blue-800',
  dessert: 'bg-purple-100 text-purple-800',
  fortified: 'bg-orange-100 text-orange-800'
} as const

const DRINKING_WINDOW_STATUS = {
  too_young: { 
    label: 'Too Young', 
    color: 'bg-gray-100 text-gray-800',
    description: 'This wine needs more time to develop its full potential.'
  },
  ready: { 
    label: 'Ready to Drink', 
    color: 'bg-green-100 text-green-800',
    description: 'This wine is ready to enjoy now.'
  },
  peak: { 
    label: 'At Peak', 
    color: 'bg-emerald-100 text-emerald-800',
    description: 'This wine is at its optimal drinking window.'
  },
  declining: { 
    label: 'Declining', 
    color: 'bg-yellow-100 text-yellow-800',
    description: 'This wine is past its peak but still enjoyable.'
  },
  over_hill: { 
    label: 'Past Prime', 
    color: 'bg-red-100 text-red-800',
    description: 'This wine may have lost its optimal characteristics.'
  }
} as const

export function WineDetailPage({
  wine,
  consumptionHistory = [],
  onEdit,
  onConsume,
  onDelete,
  onBack,
  isLoading = false
}: WineDetailPageProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const drinkingWindowStatus = wine.drinkingWindow as any
  const currentStatus = drinkingWindowStatus?.currentStatus || 'ready'
  const statusInfo = DRINKING_WINDOW_STATUS[currentStatus as keyof typeof DRINKING_WINDOW_STATUS]

  const handleDelete = () => {
    if (onDelete) {
      onDelete(wine)
      setShowDeleteConfirm(false)
    }
  }

  const renderRating = (rating: number | null) => {
    if (!rating) return null
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          {[...Array(10)].map((_, i) => (
            <Icon
              key={i}
              name="star"
              className={`h-4 w-4 ${
                i < rating 
                  ? 'text-yellow-500 fill-current' 
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{rating}/10</span>
      </div>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleDateString()
  }

  const formatPrice = (price: number | null) => {
    if (!price) return 'Not specified'
    return `$${price.toFixed(2)}`
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-4">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" size="sm" onClick={onBack}>
              <Icon name="arrow-left" className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{wine.name}</h1>
            <p className="text-lg text-gray-600">{wine.producer} • {wine.vintage}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <Button variant="outline" onClick={() => onEdit(wine)}>
              <Icon name="edit" className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {onConsume && wine.quantity > 0 && (
            <Button onClick={() => onConsume(wine)}>
              <Icon name="wine" className="h-4 w-4 mr-2" />
              Mark as Consumed
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Icon name="trash" className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Wine Image */}
          {wine.imageUrl && (
            <Card>
              <CardContent className="p-6">
                <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={wine.imageUrl}
                    alt={`${wine.name} bottle`}
                    fill
                    className="object-contain"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wine Details */}
          <Card>
            <CardHeader>
              <CardTitle>Wine Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Producer</label>
                  <p className="text-gray-900">{wine.producer}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Vintage</label>
                  <p className="text-gray-900">{wine.vintage}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Region</label>
                  <p className="text-gray-900">{wine.region}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Country</label>
                  <p className="text-gray-900">{wine.country}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Wine Type</label>
                  <div className="mt-1">
                    <Badge className={WINE_TYPE_COLORS[wine.type]}>
                      {wine.type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Quantity</label>
                  <p className="text-gray-900">{wine.quantity} bottles</p>
                </div>
              </div>

              {wine.varietal && wine.varietal.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Grape Varietals</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {wine.varietal.map((varietal, index) => (
                      <Badge key={index} className="bg-blue-100 text-blue-800">
                        {varietal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {wine.personalNotes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Personal Notes</label>
                  <p className="text-gray-900 mt-1">{wine.personalNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Consumption History */}
          {consumptionHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Consumption History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {consumptionHistory.map((record) => (
                    <div key={record.id} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          Consumed on {formatDate(record.consumedAt.toISOString())}
                        </p>
                        {record.rating && renderRating(record.rating)}
                      </div>
                      {record.occasion && (
                        <p className="text-sm text-gray-600">Occasion: {record.occasion}</p>
                      )}
                      {record.foodPairing && (
                        <p className="text-sm text-gray-600">Paired with: {record.foodPairing}</p>
                      )}
                      {record.companions && record.companions.length > 0 && (
                        <p className="text-sm text-gray-600">
                          With: {record.companions.join(', ')}
                        </p>
                      )}
                      {record.notes && (
                        <p className="text-sm text-gray-700 mt-1">{record.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Drinking Window Status */}
          <Card>
            <CardHeader>
              <CardTitle>Drinking Window</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Status</span>
                  <Badge className={statusInfo.color}>
                    {statusInfo.label}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{statusInfo.description}</p>
                
                {drinkingWindowStatus && (
                  <div className="space-y-2 text-sm">
                    {drinkingWindowStatus.earliestDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Earliest:</span>
                        <span>{formatDate(drinkingWindowStatus.earliestDate)}</span>
                      </div>
                    )}
                    {drinkingWindowStatus.peakStartDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Peak Start:</span>
                        <span>{formatDate(drinkingWindowStatus.peakStartDate)}</span>
                      </div>
                    )}
                    {drinkingWindowStatus.peakEndDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Peak End:</span>
                        <span>{formatDate(drinkingWindowStatus.peakEndDate)}</span>
                      </div>
                    )}
                    {drinkingWindowStatus.latestDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Latest:</span>
                        <span>{formatDate(drinkingWindowStatus.latestDate)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Purchase Information */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Purchase Price:</span>
                <span className="text-sm font-medium">{formatPrice(wine.purchasePrice || null)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Purchase Date:</span>
                <span className="text-sm font-medium">{formatDate(wine.purchaseDate ? wine.purchaseDate.toISOString() : null)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Added to Cellar:</span>
                <span className="text-sm font-medium">{formatDate(wine.createdAt.toISOString())}</span>
              </div>
            </CardContent>
          </Card>

          {/* Personal Rating */}
          {wine.personalRating && (
            <Card>
              <CardHeader>
                <CardTitle>Personal Rating</CardTitle>
              </CardHeader>
              <CardContent>
                {renderRating(wine.personalRating)}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Delete Wine</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete "{wine.name}"? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Wine
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}