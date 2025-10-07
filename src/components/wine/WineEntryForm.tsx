'use client'

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import type { WineInput } from '@/types'
import { fromDrinkingWindow } from '@/lib/services/drinking-window-readiness'
import { DrinkingWindowService } from '@/lib/services/drinking-window'

interface WineEntryFormProps {
  onSubmit: (wineData: WineInput) => Promise<void>
  onCancel?: () => void
  initialData?: Partial<WineInput>
  isLoading?: boolean
}

const WINE_TYPES = [
  { value: 'red', label: 'Red Wine' },
  { value: 'white', label: 'White Wine' },
  { value: 'rosé', label: 'Rosé Wine' },
  { value: 'sparkling', label: 'Sparkling Wine' },
  { value: 'dessert', label: 'Dessert Wine' },
  { value: 'fortified', label: 'Fortified Wine' }
] as const

export function WineEntryForm({ 
  onSubmit, 
  onCancel, 
  initialData, 
  isLoading = false 
}: WineEntryFormProps) {
  const [formData, setFormData] = useState<WineInput>({
    name: initialData?.name || '',
    producer: initialData?.producer || '',
    vintage: initialData?.vintage || new Date().getFullYear(),
    region: initialData?.region || '',
    country: initialData?.country || '',
    varietal: initialData?.varietal || [],
    type: initialData?.type || 'red',
    quantity: initialData?.quantity || 1,
    purchasePrice: initialData?.purchasePrice,
    purchaseDate: initialData?.purchaseDate,
    personalRating: initialData?.personalRating,
    personalNotes: initialData?.personalNotes || '',
    imageUrl: initialData?.imageUrl
  })

  const [varietalInput, setVarietalInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [imagePreview, setImagePreview] = useState<string | undefined>(formData.imageUrl)

  const handleInputChange = (field: keyof WineInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleAddVarietal = () => {
    if (varietalInput.trim() && !formData.varietal.includes(varietalInput.trim())) {
      setFormData(prev => ({
        ...prev,
        varietal: [...prev.varietal, varietalInput.trim()]
      }))
      setVarietalInput('')
    }
  }

  const handleRemoveVarietal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      varietal: prev.varietal.filter((_, i) => i !== index)
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {return}
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      setImagePreview(url)
      handleInputChange('imageUrl', url)
    }
    reader.readAsDataURL(file)
  }

  const previewDrinkingWindow = useMemo(() => {
    try {
      const dw = DrinkingWindowService.calculateDrinkingWindow({
        ...formData,
        id: '',
        userId: '',
        externalData: {}
      } as any)
      const { score, status } = fromDrinkingWindow(dw)
      return { dw, score, status }
    } catch {
      return undefined
    }
  }, [formData])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Wine name is required'
    }

    if (!formData.producer.trim()) {
      newErrors.producer = 'Producer is required'
    }

    if (!formData.region.trim()) {
      newErrors.region = 'Region is required'
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required'
    }

    if (formData.varietal.length === 0) {
      newErrors.varietal = 'At least one varietal is required'
    }

    if (formData.vintage < 1800 || formData.vintage > new Date().getFullYear() + 5) {
      newErrors.vintage = 'Please enter a valid vintage year'
    }

    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantity cannot be negative'
    }

    if (formData.purchasePrice !== undefined && formData.purchasePrice < 0) {
      newErrors.purchasePrice = 'Price cannot be negative'
    }

    if (formData.personalRating !== undefined && 
        (formData.personalRating < 1 || formData.personalRating > 10)) {
      newErrors.personalRating = 'Rating must be between 1 and 10'
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
      console.error('Failed to submit wine:', error)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="wine" className="h-5 w-5" />
          {initialData ? 'Edit Wine' : 'Add New Wine'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Wine Name *
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Château Margaux"
                  state={errors.name ? 'error' : 'default'}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="text-sm text-red-600 mt-1" role="alert">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="producer" className="block text-sm font-medium mb-1">
                  Producer *
                </label>
                <Input
                  id="producer"
                  value={formData.producer}
                  onChange={(e) => handleInputChange('producer', e.target.value)}
                  placeholder="e.g., Château Margaux"
                  state={errors.producer ? 'error' : 'default'}
                  aria-invalid={!!errors.producer}
                  aria-describedby={errors.producer ? 'producer-error' : undefined}
                />
                {errors.producer && (
                  <p id="producer-error" className="text-sm text-red-600 mt-1" role="alert">{errors.producer}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="vintage" className="block text-sm font-medium mb-1">
                  Vintage *
                </label>
                <Input
                  id="vintage"
                  type="number"
                  value={formData.vintage}
                  onChange={(e) => handleInputChange('vintage', parseInt(e.target.value))}
                  min="1800"
                  max={new Date().getFullYear() + 5}
                  state={errors.vintage ? 'error' : 'default'}
                  aria-invalid={!!errors.vintage}
                  aria-describedby={errors.vintage ? 'vintage-error' : undefined}
                />
                {errors.vintage && (
                  <p id="vintage-error" className="text-sm text-red-600 mt-1" role="alert">{errors.vintage}</p>
                )}
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium mb-1">
                  Wine Type *
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {WINE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium mb-1">
                  Quantity *
                </label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                  min="0"
                  state={errors.quantity ? 'error' : 'default'}
                  aria-invalid={!!errors.quantity}
                  aria-describedby={errors.quantity ? 'quantity-error' : undefined}
                />
                {errors.quantity && (
                  <p id="quantity-error" className="text-sm text-red-600 mt-1" role="alert">{errors.quantity}</p>
                )}
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Bottle Image</h3>
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" onChange={handleImageChange} aria-label="Upload bottle image" />
                  {imagePreview && (
                    <div className="relative h-16 w-12">
                      <Image 
                        src={imagePreview} 
                        alt="Bottle preview" 
                        fill 
                        sizes="48px" 
                        className="object-cover rounded border"
                        placeholder="blur"
                        blurDataURL={"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><filter id='b'><feGaussianBlur stdDeviation='2'/></filter><rect width='8' height='8' fill='%23e5e7eb' filter='url(%23b)'/></svg>"}
                      />
                    </div>
                  )}
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Location</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="region" className="block text-sm font-medium mb-1">
                  Region *
                </label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => handleInputChange('region', e.target.value)}
                  placeholder="e.g., Margaux"
                  state={errors.region ? 'error' : 'default'}
                  aria-invalid={!!errors.region}
                  aria-describedby={errors.region ? 'region-error' : undefined}
                />
                {errors.region && (
                  <p id="region-error" className="text-sm text-red-600 mt-1" role="alert">{errors.region}</p>
                )}
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium mb-1">
                  Country *
                </label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="e.g., France"
                  state={errors.country ? 'error' : 'default'}
                  aria-invalid={!!errors.country}
                  aria-describedby={errors.country ? 'country-error' : undefined}
                />
                {errors.country && (
                  <p id="country-error" className="text-sm text-red-600 mt-1" role="alert">{errors.country}</p>
                )}
              </div>
            </div>
          </div>

          {/* Readiness Preview */}
          {previewDrinkingWindow && (
            <div className="p-4 rounded-md border border-gray-200 bg-gray-50" aria-live="polite">
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-900">Readiness Preview</div>
                <div className="text-sm text-gray-700">Score: {Math.round(previewDrinkingWindow.score * 100)}%</div>
              </div>
              <div className="text-sm text-gray-600">
                Status: {previewDrinkingWindow.status.replace('_', ' ')}
              </div>
            </div>
          )}

          {/* Varietal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Grape Varietals</h3>
            
            <div className="flex gap-2">
              <Input
                value={varietalInput}
                onChange={(e) => setVarietalInput(e.target.value)}
                placeholder="e.g., Cabernet Sauvignon"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddVarietal()
                  }
                }}
                aria-describedby={errors.varietal ? 'varietal-error' : undefined}
              />
              <Button
                type="button"
                onClick={handleAddVarietal}
                variant="outline"
                size="sm"
              >
                <Icon name="plus" className="h-4 w-4" />
                Add
              </Button>
            </div>

            {formData.varietal.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.varietal.map((varietal, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {varietal}
                    <button
                      type="button"
                      onClick={() => handleRemoveVarietal(index)}
                      className="ml-1 hover:text-blue-600"
                      aria-label={`Remove ${varietal}`}
                    >
                      <Icon name="x" className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {errors.varietal && (
              <p id="varietal-error" className="text-sm text-red-600" role="alert">{errors.varietal}</p>
            )}
          </div>

          {/* Purchase Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Purchase Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="purchasePrice" className="block text-sm font-medium mb-1">
                  Purchase Price
                </label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice || ''}
                  onChange={(e) => handleInputChange('purchasePrice', 
                    e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0.00"
                  state={errors.purchasePrice ? 'error' : 'default'}
                  aria-invalid={!!errors.purchasePrice}
                  aria-describedby={errors.purchasePrice ? 'purchasePrice-error' : undefined}
                />
                {errors.purchasePrice && (
                  <p id="purchasePrice-error" className="text-sm text-red-600 mt-1" role="alert">{errors.purchasePrice}</p>
                )}
              </div>

              <div>
                <label htmlFor="purchaseDate" className="block text-sm font-medium mb-1">
                  Purchase Date
                </label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleInputChange('purchaseDate', 
                    e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Personal Notes</h3>
            
            <div>
              <label htmlFor="personalRating" className="block text-sm font-medium mb-1">
                Personal Rating (1-10)
              </label>
              <Input
                id="personalRating"
                type="number"
                min="1"
                max="10"
                value={formData.personalRating || ''}
                onChange={(e) => handleInputChange('personalRating', 
                  e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Rate this wine"
                state={errors.personalRating ? 'error' : 'default'}
                aria-invalid={!!errors.personalRating}
                aria-describedby={errors.personalRating ? 'personalRating-error' : undefined}
              />
              {errors.personalRating && (
                <p id="personalRating-error" className="text-sm text-red-600 mt-1" role="alert">{errors.personalRating}</p>
              )}
            </div>

            <div>
              <label htmlFor="personalNotes" className="block text-sm font-medium mb-1">
                Personal Notes
              </label>
              <textarea
                id="personalNotes"
            value={formData.personalNotes ?? ''}
                onChange={(e) => handleInputChange('personalNotes', e.target.value)}
                placeholder="Your thoughts about this wine..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {(formData.personalNotes ?? '').length}/1000 characters
              </p>
            </div>
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
                  {initialData ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Icon name="save" className="h-4 w-4 mr-2" />
                  {initialData ? 'Update Wine' : 'Add Wine'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}