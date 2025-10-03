'use client'

import React from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { DrinkingWindowIndicator, DrinkingUrgencyBadge } from './DrinkingWindowIndicator'
import { DrinkingWindowService } from '@/lib/services/drinking-window'
import type { Wine } from '@/types'

interface WineCardProps {
  wine: Wine
  onView?: (wine: Wine) => void
  onEdit?: (wine: Wine) => void
  onConsume?: (wine: Wine) => void
  onDelete?: (wine: Wine) => void
  compact?: boolean
}

const WINE_TYPE_COLORS = {
  red: 'bg-red-100 text-red-800',
  white: 'bg-yellow-100 text-yellow-800',
  rosé: 'bg-pink-100 text-pink-800',
  sparkling: 'bg-blue-100 text-blue-800',
  dessert: 'bg-purple-100 text-purple-800',
  fortified: 'bg-orange-100 text-orange-800'
} as const

export function WineCard({ 
  wine, 
  onView, 
  onEdit, 
  onConsume, 
  onDelete, 
  compact = false 
}: WineCardProps) {
  const urgencyScore = DrinkingWindowService.getDrinkingUrgencyScore(wine)

  const handleCardClick = () => {
    if (onView) {
      onView(wine)
    }
  }

  const renderRating = (rating: number | null) => {
    if (!rating) return null
    
    return (
      <div className="flex items-center gap-1">
        <Icon name="star" className="h-4 w-4 text-yellow-500 fill-current" />
        <span className="text-sm font-medium">{rating}/10</span>
      </div>
    )
  }

  const renderPrice = (price: number | null) => {
    if (!price) return null
    
    return (
      <span className="text-sm text-gray-600">
        ${price.toFixed(2)}
      </span>
    )
  }

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {wine.image_url && (
              <div className="relative w-12 h-16 flex-shrink-0">
                <Image
                  src={wine.image_url}
                  alt={`${wine.name} bottle`}
                  fill
                  className="object-cover rounded"
                />
              </div>
            )}
            
            <div className="flex-1 min-w-0" onClick={handleCardClick}>
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 truncate">
                    {wine.name}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    {wine.producer} • {wine.vintage}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {wine.region}, {wine.country}
                  </p>
                </div>
                
                <div className="flex flex-col items-end gap-1 ml-2">
                  <Badge className={WINE_TYPE_COLORS[wine.type]}>
                    {wine.type}
                  </Badge>
                  <DrinkingWindowIndicator 
                    drinkingWindow={wine.drinkingWindow}
                    wine={wine}
                    size="sm"
                  />
                  <DrinkingUrgencyBadge urgencyScore={urgencyScore} />
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  {wine.personal_rating && renderRating(wine.personal_rating)}
                  {wine.purchase_price && renderPrice(wine.purchase_price)}
                </div>
                
                <span className="text-sm text-gray-500">
                  Qty: {wine.quantity}
                </span>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col gap-1">
              {onConsume && wine.quantity > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    onConsume(wine)
                  }}
                >
                  <Icon name="wine" className="h-3 w-3" />
                </Button>
              )}
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(wine)
                  }}
                >
                  <Icon name="edit" className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate" onClick={handleCardClick}>
              {wine.name}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {wine.producer}
            </p>
          </div>
          
          <div className="flex flex-col gap-1 ml-2">
            <Badge className={WINE_TYPE_COLORS[wine.type]}>
              {wine.type}
            </Badge>
            <DrinkingWindowIndicator 
              drinkingWindow={wine.drinkingWindow}
              wine={wine}
              size="sm"
            />
            <DrinkingUrgencyBadge urgencyScore={urgencyScore} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div onClick={handleCardClick}>
          {wine.image_url && (
            <div className="relative w-full h-48 mb-4 bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={wine.image_url}
                alt={`${wine.name} bottle`}
                fill
                className="object-cover"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Vintage</span>
              <span className="font-medium">{wine.vintage}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Region</span>
              <span className="font-medium truncate ml-2">{wine.region}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Country</span>
              <span className="font-medium">{wine.country}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Quantity</span>
              <span className="font-medium">{wine.quantity} bottles</span>
            </div>
            
            {wine.varietal && wine.varietal.length > 0 && (
              <div className="text-sm">
                <span className="text-gray-600">Varietals: </span>
                <span className="font-medium">{wine.varietal.join(', ')}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                {wine.personal_rating && renderRating(wine.personal_rating)}
                {wine.purchase_price && renderPrice(wine.purchase_price)}
              </div>
            </div>
            
            {wine.personal_notes && (
              <div className="text-sm text-gray-600 pt-2 border-t">
                <p className="line-clamp-2">{wine.personal_notes}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          {onConsume && wine.quantity > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onConsume(wine)
              }}
              className="flex-1"
            >
              <Icon name="wine" className="h-4 w-4 mr-1" />
              Consume
            </Button>
          )}
          
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(wine)
              }}
            >
              <Icon name="edit" className="h-4 w-4" />
            </Button>
          )}
          
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(wine)
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Icon name="trash" className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}