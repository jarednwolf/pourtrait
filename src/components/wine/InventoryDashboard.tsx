'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { DrinkingWindowAlerts, DrinkingWindowSummary } from './DrinkingWindowAlerts'
import { Wine } from '@/types'
import { fromDrinkingWindow } from '@/lib/services/drinking-window-readiness'

interface InventoryStats {
  totalWines: number
  totalBottles: number
  ratedWines: number
  averageRating: number
  redWines: number
  whiteWines: number
  sparklingWines: number
}

interface InventoryDashboardProps {
  stats: InventoryStats
  wines?: Wine[]
  userId?: string
  isLoading?: boolean
  onAddRequest?: () => void
}

export function InventoryDashboard({ 
  stats, 
  wines = [], 
  userId, 
  isLoading = false,
  onAddRequest,
}: InventoryDashboardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    subtitle,
    color = 'text-gray-900'
  }: {
    title: string
    value: string | number
    icon: string
    subtitle?: string
    color?: string
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon name={icon as any} className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const formatRating = (rating: number) => {
    if (rating === 0) {return 'No ratings yet'}
    return `${rating.toFixed(1)}/10`
  }

  const calculateRatingPercentage = () => {
    if (stats.totalWines === 0) {return 0}
    return Math.round((stats.ratedWines / stats.totalWines) * 100)
  }

  const readyCount = wines.filter(w => {
    const { status } = fromDrinkingWindow(w.drinkingWindow)
    return status === 'at_peak' || status === 'drink_soon'
  }).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          Inventory Overview
          {wines.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700" aria-label={`${readyCount} ready to drink`}>
              <Icon name="check-circle" className="h-3 w-3" /> {readyCount} ready
            </span>
          )}
        </h2>
        <Button onClick={onAddRequest} aria-label="Add wine">
          <Icon name="plus" className="h-4 w-4 mr-2" />
          Add wine
        </Button>
      </div>

      {/* Drinking Window Alerts */}
      {userId && wines.length > 0 && (
        <DrinkingWindowAlerts 
          userId={userId} 
          wines={wines}
        />
      )}

      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Wines"
          value={stats.totalWines}
          icon="wine"
          subtitle={`${stats.totalBottles} bottles total`}
        />
        
        <StatCard
          title="Ready to Drink"
          value={wines.filter(w => {
            const { status } = fromDrinkingWindow(w.drinkingWindow)
            return status === 'at_peak' || status === 'drink_soon'
          }).length}
          icon="check-circle"
          subtitle="Based on drinking window readiness"
          color="text-green-700"
        />

        <StatCard
          title="Average Rating"
          value={formatRating(stats.averageRating)}
          icon="star"
          subtitle={`${calculateRatingPercentage()}% of wines rated`}
        />
        
        <StatCard
          title="Red Wines"
          value={stats.redWines}
          icon="wine"
          color="text-red-600"
        />
        
        <StatCard
          title="White Wines"
          value={stats.whiteWines}
          icon="wine"
          color="text-yellow-600"
        />
      </div>

      {/* Drinking Window Summary */}
      {wines.length > 0 && (
        <DrinkingWindowSummary wines={wines} />
      )}

      {/* Wine Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="pie-chart" className="h-5 w-5" />
            Wine Collection Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Red Wines */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="font-medium">Red Wines</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {stats.totalWines > 0 ? Math.round((stats.redWines / stats.totalWines) * 100) : 0}%
                </span>
                <span className="font-medium">{stats.redWines}</span>
              </div>
            </div>
            
            {/* Progress bar for red wines */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: stats.totalWines > 0 ? `${(stats.redWines / stats.totalWines) * 100}%` : '0%' 
                }}
              ></div>
            </div>

            {/* White Wines */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="font-medium">White Wines</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {stats.totalWines > 0 ? Math.round((stats.whiteWines / stats.totalWines) * 100) : 0}%
                </span>
                <span className="font-medium">{stats.whiteWines}</span>
              </div>
            </div>
            
            {/* Progress bar for white wines */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: stats.totalWines > 0 ? `${(stats.whiteWines / stats.totalWines) * 100}%` : '0%' 
                }}
              ></div>
            </div>

            {/* Sparkling Wines */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="font-medium">Sparkling Wines</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {stats.totalWines > 0 ? Math.round((stats.sparklingWines / stats.totalWines) * 100) : 0}%
                </span>
                <span className="font-medium">{stats.sparklingWines}</span>
              </div>
            </div>
            
            {/* Progress bar for sparkling wines */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: stats.totalWines > 0 ? `${(stats.sparklingWines / stats.totalWines) * 100}%` : '0%' 
                }}
              ></div>
            </div>

            {/* Other wines (calculated) */}
            {(() => {
              const otherWines = stats.totalWines - stats.redWines - stats.whiteWines - stats.sparklingWines
              if (otherWines > 0) {
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-purple-500 rounded"></div>
                        <span className="font-medium">Other Wines</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {Math.round((otherWines / stats.totalWines) * 100)}%
                        </span>
                        <span className="font-medium">{otherWines}</span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(otherWines / stats.totalWines) * 100}%` }}
                      ></div>
                    </div>
                  </>
                )
              }
              return null
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Icon name="success" className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.ratedWines}</p>
            <p className="text-sm text-gray-600">Wines Rated</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Icon name="clock" className="h-6 w-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalWines - stats.ratedWines}
            </p>
            <p className="text-sm text-gray-600">Wines to Try</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Icon name="arrow-up" className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalBottles}
            </p>
            <p className="text-sm text-gray-600">Total Bottles</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Additions */}
      {wines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="history" className="h-5 w-5" />
              Recent additions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-200">
              {wines.slice(0, 5).map((w) => (
                <div key={w.id} className="py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{w.name} ({w.vintage})</div>
                    <div className="text-sm text-gray-600 truncate">{w.producer} • {w.region}</div>
                  </div>
                  <div className="text-sm text-gray-700">
                    {fromDrinkingWindow(w.drinkingWindow).status.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {stats.totalWines === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Icon name="wine" className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Start Building Your Wine Collection
            </h3>
            <p className="text-gray-600 mb-6">
              Add your first wine to begin tracking your cellar and get personalized recommendations.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    try {
                      window.dispatchEvent(new CustomEvent('sample_wine_add_request'))
                    } catch {}
                  }
                }}
                aria-label="Add sample wine"
              >
                Add sample
              </Button>
              {/* CSV import helper removed for streamlined onboarding */}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}