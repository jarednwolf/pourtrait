'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import type { Wine } from '@/types'

interface ConsumptionFormProps {
  wine: Wine
  onSubmit: (data: ConsumptionData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export interface ConsumptionData {
  consumedAt: Date
  rating?: number
  notes?: string
  occasion?: string
  companions?: string[]
  foodPairing?: string
}

export function ConsumptionForm({ 
  wine, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: ConsumptionFormProps) {
  const [formData, setFormData] = useState<ConsumptionData>({
    consumedAt: new Date(),
    rating: undefined,
    notes: '',
    occasion: '',
    companions: [],
    foodPairing: ''
  })

  const [companionInput, setCompanionInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof ConsumptionData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleAddCompanion = () => {
    if (companionInput.trim() && !formData.companions?.includes(companionInput.trim())) {
      setFormData(prev => ({
        ...prev,
        companions: [...(prev.companions || []), companionInput.trim()]
      }))
      setCompanionInput('')
    }
  }

  const handleRemoveCompanion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      companions: prev.companions?.filter((_, i) => i !== index) || []
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.consumedAt) {
      newErrors.consumedAt = 'Consumption date is required'
    }

    if (formData.rating !== undefined && 
        (formData.rating < 1 || formData.rating > 10)) {
      newErrors.rating = 'Rating must be between 1 and 10'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Failed to record consumption:', error)
    }
  }

  const renderRatingInput = () => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          How would you rate this wine? (1-10)
        </label>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(10)].map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleInputChange('rating', i + 1)}
                className={`p-1 hover:scale-110 transition-transform ${
                  formData.rating && i < formData.rating
                    ? 'text-yellow-500'
                    : 'text-gray-300 hover:text-yellow-400'
                }`}
              >
                <Icon name="star" className="h-6 w-6 fill-current" />
              </button>
            ))}
          </div>
          {formData.rating && (
            <span className="text-sm font-medium ml-2">
              {formData.rating}/10
            </span>
          )}
          {formData.rating && (
            <button
              type="button"
              onClick={() => handleInputChange('rating', undefined)}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          )}
        </div>
        {errors.rating && (
          <p className="text-sm text-red-600">{errors.rating}</p>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="wine" className="h-5 w-5" />
            Record Wine Consumption
          </CardTitle>
          <div className="text-sm text-gray-600">
            <p className="font-medium">{wine.name}</p>
            <p>{wine.producer} • {wine.vintage}</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Consumption Date */}
            <div>
              <label htmlFor="consumedAt" className="block text-sm font-medium mb-1">
                When did you drink this wine? *
              </label>
              <Input
                id="consumedAt"
                type="datetime-local"
                value={formData.consumedAt.toISOString().slice(0, 16)}
                onChange={(e) => handleInputChange('consumedAt', new Date(e.target.value))}
                state={errors.consumedAt ? 'error' : 'default'}
              />
              {errors.consumedAt && (
                <p className="text-sm text-red-600 mt-1">{errors.consumedAt}</p>
              )}
            </div>

            {/* Rating */}
            {renderRatingInput()}

            {/* Occasion */}
            <div>
              <label htmlFor="occasion" className="block text-sm font-medium mb-1">
                What was the occasion?
              </label>
              <Input
                id="occasion"
                value={formData.occasion}
                onChange={(e) => handleInputChange('occasion', e.target.value)}
                placeholder="e.g., Dinner party, Anniversary, Casual evening"
              />
            </div>

            {/* Food Pairing */}
            <div>
              <label htmlFor="foodPairing" className="block text-sm font-medium mb-1">
                What did you pair it with?
              </label>
              <Input
                id="foodPairing"
                value={formData.foodPairing}
                onChange={(e) => handleInputChange('foodPairing', e.target.value)}
                placeholder="e.g., Grilled steak, Cheese board, Chocolate dessert"
              />
            </div>

            {/* Companions */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Who did you share it with?
              </label>
              
              <div className="flex gap-2 mb-2">
                <Input
                  value={companionInput}
                  onChange={(e) => setCompanionInput(e.target.value)}
                  placeholder="Add a companion"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCompanion()
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddCompanion}
                  variant="outline"
                  size="sm"
                >
                  <Icon name="plus" className="h-4 w-4" />
                </Button>
              </div>

              {formData.companions && formData.companions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.companions.map((companion, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {companion}
                      <button
                        type="button"
                        onClick={() => handleRemoveCompanion(index)}
                        className="ml-1 hover:text-blue-600"
                      >
                        <Icon name="x" className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Tasting Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-1">
                Tasting notes and thoughts
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="How did it taste? What did you think of it? Any memorable characteristics?"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.notes?.length || 0}/500 characters
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-6 border-t">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Icon name="loader" className="h-4 w-4 mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Icon name="check-circle" className="h-4 w-4 mr-2" />
                    Record Consumption
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}