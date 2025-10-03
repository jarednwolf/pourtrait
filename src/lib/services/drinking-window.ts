import { DrinkingWindow, Wine } from '@/types'
import { ExpertDrinkingWindowService } from './expert-drinking-windows'

/**
 * Service for calculating and managing wine drinking windows
 */
export class DrinkingWindowService {
  /**
   * Calculate drinking window for a wine based on its characteristics
   */
  static calculateDrinkingWindow(wine: Partial<Wine>): DrinkingWindow {
    // Base aging potential based on wine type and characteristics
    const agingPotential = this.getAgingPotential(wine)
    
    // Calculate dates
    const earliestDate = this.calculateEarliestDate(wine, agingPotential)
    const peakStartDate = this.calculatePeakStartDate(wine, agingPotential)
    const peakEndDate = this.calculatePeakEndDate(wine, agingPotential)
    const latestDate = this.calculateLatestDate(wine, agingPotential)
    
    // Determine current status
    const currentStatus = this.calculateCurrentStatus(
      earliestDate,
      peakStartDate,
      peakEndDate,
      latestDate
    )
    
    return {
      earliestDate,
      peakStartDate,
      peakEndDate,
      latestDate,
      currentStatus
    }
  }
  
  /**
   * Update drinking window status for existing wine
   */
  static updateDrinkingWindowStatus(drinkingWindow: DrinkingWindow): DrinkingWindow {
    const currentStatus = this.calculateCurrentStatus(
      drinkingWindow.earliestDate,
      drinkingWindow.peakStartDate,
      drinkingWindow.peakEndDate,
      drinkingWindow.latestDate
    )
    
    return {
      ...drinkingWindow,
      currentStatus
    }
  }
  
  /**
   * Get wines that need drinking window alerts
   */
  static getWinesNeedingAlerts(wines: Wine[]): {
    enteringPeak: Wine[]
    leavingPeak: Wine[]
    overHill: Wine[]
  } {
    const now = new Date()
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    const enteringPeak: Wine[] = []
    const leavingPeak: Wine[] = []
    const overHill: Wine[] = []
    
    wines.forEach(wine => {
      const { drinkingWindow } = wine
      const peakStart = new Date(drinkingWindow.peakStartDate)
      const peakEnd = new Date(drinkingWindow.peakEndDate)
      const latest = new Date(drinkingWindow.latestDate)
      
      // Entering peak window soon
      if (peakStart > now && peakStart <= oneWeekFromNow) {
        enteringPeak.push(wine)
      }
      
      // Leaving peak window soon
      if (peakEnd > now && peakEnd <= oneMonthFromNow) {
        leavingPeak.push(wine)
      }
      
      // Past optimal drinking window
      if (latest < now) {
        overHill.push(wine)
      }
    })
    
    return { enteringPeak, leavingPeak, overHill }
  }
  
  /**
   * Get priority score for drinking window urgency (higher = more urgent)
   */
  static getDrinkingUrgencyScore(wine: Wine): number {
    const now = new Date()
    const { drinkingWindow } = wine
    const peakEnd = new Date(drinkingWindow.peakEndDate)
    const latest = new Date(drinkingWindow.latestDate)
    
    // Already over the hill
    if (latest < now) {
      return 100
    }
    
    // In peak window, approaching end
    if (drinkingWindow.currentStatus === 'peak') {
      const daysUntilPeakEnd = Math.ceil((peakEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntilPeakEnd <= 30) {
        return 90 - daysUntilPeakEnd
      }
      return 50
    }
    
    // Ready to drink
    if (drinkingWindow.currentStatus === 'ready') {
      return 40
    }
    
    // Declining
    if (drinkingWindow.currentStatus === 'declining') {
      const daysUntilLatest = Math.ceil((latest.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return Math.max(70 - daysUntilLatest / 10, 60)
    }
    
    // Too young
    return 10
  }
  
  /**
   * Determine aging potential based on wine characteristics
   * Uses expert data when available, falls back to algorithmic calculation
   */
  private static getAgingPotential(wine: Partial<Wine>): number {
    // First, check if we have external data (from wine APIs, etc.)
    if (wine.externalData?.agingPotential) {
      return wine.externalData.agingPotential
    }
    
    // Try to get expert-curated data
    if (wine.producer && wine.region) {
      const expertData = ExpertDrinkingWindowService.calculateExpertAgingPotential({
        producer: wine.producer,
        name: wine.name,
        region: wine.region,
        varietal: wine.varietal,
        vintage: wine.vintage
      })
      
      if (expertData && expertData.confidence >= 0.7) {
        return expertData.agingPotential
      }
    }
    
    // Fall back to algorithmic calculation
    let basePotential = 5 // Default 5 years
    
    // Adjust based on wine type
    switch (wine.type) {
      case 'red':
        basePotential = 8
        break
      case 'white':
        basePotential = 4
        break
      case 'sparkling':
        basePotential = 6
        break
      case 'dessert':
        basePotential = 15
        break
      case 'fortified':
        basePotential = 20
        break
      default:
        basePotential = 5
    }
    
    // Adjust based on region (premium regions typically age longer)
    const premiumRegions = [
      'Bordeaux', 'Burgundy', 'Champagne', 'Barolo', 'Brunello di Montalcino',
      'Napa Valley', 'Sonoma', 'Willamette Valley', 'Mosel', 'Rheingau'
    ]
    
    if (wine.region && premiumRegions.some(region => 
      wine.region!.toLowerCase().includes(region.toLowerCase())
    )) {
      basePotential += 3
    }
    
    return basePotential
  }
  
  /**
   * Calculate earliest drinking date
   */
  private static calculateEarliestDate(wine: Partial<Wine>, _agingPotential: number): Date {
    const vintageDate = new Date(wine.vintage!, 0, 1)
    
    // Minimum aging time based on wine type
    let minAging = 1 // Default 1 year
    
    switch (wine.type) {
      case 'red':
        minAging = 2
        break
      case 'white':
        minAging = 1
        break
      case 'sparkling':
        minAging = 2
        break
      case 'dessert':
        minAging = 3
        break
      case 'fortified':
        minAging = 1
        break
    }
    
    return new Date(vintageDate.getFullYear() + minAging, 0, 1)
  }
  
  /**
   * Calculate peak start date
   */
  private static calculatePeakStartDate(wine: Partial<Wine>, agingPotential: number): Date {
    const vintageDate = new Date(wine.vintage!, 0, 1)
    const peakStart = Math.floor(agingPotential * 0.3)
    
    return new Date(vintageDate.getFullYear() + Math.max(peakStart, 2), 0, 1)
  }
  
  /**
   * Calculate peak end date
   */
  private static calculatePeakEndDate(wine: Partial<Wine>, agingPotential: number): Date {
    const vintageDate = new Date(wine.vintage!, 0, 1)
    const peakEnd = Math.floor(agingPotential * 0.7)
    
    return new Date(vintageDate.getFullYear() + Math.max(peakEnd, 4), 11, 31)
  }
  
  /**
   * Calculate latest drinking date
   */
  private static calculateLatestDate(wine: Partial<Wine>, agingPotential: number): Date {
    const vintageDate = new Date(wine.vintage!, 0, 1)
    
    return new Date(vintageDate.getFullYear() + agingPotential, 11, 31)
  }
  
  /**
   * Calculate current drinking window status
   */
  private static calculateCurrentStatus(
    earliestDate: Date,
    peakStartDate: Date,
    peakEndDate: Date,
    latestDate: Date
  ): DrinkingWindow['currentStatus'] {
    const now = new Date()
    
    if (now < earliestDate) {
      return 'too_young'
    }
    
    if (now >= earliestDate && now < peakStartDate) {
      return 'ready'
    }
    
    if (now >= peakStartDate && now <= peakEndDate) {
      return 'peak'
    }
    
    if (now > peakEndDate && now <= latestDate) {
      return 'declining'
    }
    
    return 'over_hill'
  }
}

/**
 * Utility functions for drinking window display
 */
export class DrinkingWindowUtils {
  /**
   * Get human-readable status text
   */
  static getStatusText(status: DrinkingWindow['currentStatus']): string {
    switch (status) {
      case 'too_young':
        return 'Too Young'
      case 'ready':
        return 'Ready to Drink'
      case 'peak':
        return 'At Peak'
      case 'declining':
        return 'Declining'
      case 'over_hill':
        return 'Past Prime'
      default:
        return 'Unknown'
    }
  }
  
  /**
   * Get status color for UI display
   */
  static getStatusColor(status: DrinkingWindow['currentStatus']): string {
    switch (status) {
      case 'too_young':
        return 'text-blue-600 bg-blue-50'
      case 'ready':
        return 'text-green-600 bg-green-50'
      case 'peak':
        return 'text-emerald-600 bg-emerald-50'
      case 'declining':
        return 'text-yellow-600 bg-yellow-50'
      case 'over_hill':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }
  
  /**
   * Get urgency indicator
   */
  static getUrgencyIndicator(urgencyScore: number): {
    level: 'low' | 'medium' | 'high' | 'critical'
    color: string
    text: string
  } {
    if (urgencyScore >= 80) {
      return {
        level: 'critical',
        color: 'text-red-700 bg-red-100',
        text: 'Drink Soon!'
      }
    }
    
    if (urgencyScore >= 60) {
      return {
        level: 'high',
        color: 'text-orange-700 bg-orange-100',
        text: 'High Priority'
      }
    }
    
    if (urgencyScore >= 40) {
      return {
        level: 'medium',
        color: 'text-yellow-700 bg-yellow-100',
        text: 'Medium Priority'
      }
    }
    
    return {
      level: 'low',
      color: 'text-gray-700 bg-gray-100',
      text: 'Low Priority'
    }
  }
  
  /**
   * Format drinking window for display
   */
  static formatDrinkingWindow(drinkingWindow: DrinkingWindow): string {
    const peakStart = new Date(drinkingWindow.peakStartDate).getFullYear()
    const peakEnd = new Date(drinkingWindow.peakEndDate).getFullYear()
    
    if (peakStart === peakEnd) {
      return `Peak: ${peakStart}`
    }
    
    return `Peak: ${peakStart}-${peakEnd}`
  }
  
  /**
   * Get information about the data source used for drinking window calculation
   */
  static getDrinkingWindowDataSource(wine: Partial<Wine>): {
    source: string
    confidence: number
    isExpertData: boolean
  } {
    // Check external data first
    if (wine.externalData?.agingPotential) {
      return {
        source: 'External wine database',
        confidence: 0.9,
        isExpertData: true
      }
    }
    
    // Check expert-curated data
    if (wine.producer && wine.region) {
      const expertData = ExpertDrinkingWindowService.calculateExpertAgingPotential({
        producer: wine.producer,
        name: wine.name,
        region: wine.region,
        varietal: wine.varietal,
        vintage: wine.vintage
      })
      
      if (expertData && expertData.confidence >= 0.7) {
        return {
          source: expertData.source,
          confidence: expertData.confidence,
          isExpertData: true
        }
      }
    }
    
    // Algorithmic calculation
    return {
      source: 'Algorithmic calculation',
      confidence: 0.6,
      isExpertData: false
    }
  }

  /**
   * Get days until status change
   */
  static getDaysUntilStatusChange(drinkingWindow: DrinkingWindow): {
    nextStatus: DrinkingWindow['currentStatus'] | null
    daysUntil: number | null
    description: string
  } {
    const now = new Date()
    const { currentStatus } = drinkingWindow
    
    switch (currentStatus) {
      case 'too_young': {
        const daysUntil = Math.ceil(
          (new Date(drinkingWindow.earliestDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        return {
          nextStatus: 'ready',
          daysUntil,
          description: `Ready to drink in ${daysUntil} days`
        }
      }
      
      case 'ready': {
        const daysUntil = Math.ceil(
          (new Date(drinkingWindow.peakStartDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        return {
          nextStatus: 'peak',
          daysUntil,
          description: `Enters peak window in ${daysUntil} days`
        }
      }
      
      case 'peak': {
        const daysUntil = Math.ceil(
          (new Date(drinkingWindow.peakEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        return {
          nextStatus: 'declining',
          daysUntil,
          description: `Peak window ends in ${daysUntil} days`
        }
      }
      
      case 'declining': {
        const daysUntil = Math.ceil(
          (new Date(drinkingWindow.latestDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        return {
          nextStatus: 'over_hill',
          daysUntil,
          description: `Past prime in ${daysUntil} days`
        }
      }
      
      default:
        return {
          nextStatus: null,
          daysUntil: null,
          description: 'Past optimal drinking window'
        }
    }
  }
}