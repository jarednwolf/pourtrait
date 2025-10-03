import { describe, it, expect, beforeEach } from 'vitest'
import { DrinkingWindowService, DrinkingWindowUtils } from '../drinking-window'
import { Wine, DrinkingWindow } from '@/types'

describe('DrinkingWindowService', () => {
  const mockWine: Partial<Wine> = {
    vintage: 2018,
    type: 'red',
    region: 'Bordeaux',
    country: 'France',
    externalData: {}
  }

  describe('calculateDrinkingWindow', () => {
    it('should calculate drinking window for red wine', () => {
      const result = DrinkingWindowService.calculateDrinkingWindow(mockWine)
      
      expect(result).toHaveProperty('earliestDate')
      expect(result).toHaveProperty('peakStartDate')
      expect(result).toHaveProperty('peakEndDate')
      expect(result).toHaveProperty('latestDate')
      expect(result).toHaveProperty('currentStatus')
      
      // Red wine should have minimum 2 years aging
      const earliestYear = new Date(result.earliestDate).getFullYear()
      expect(earliestYear).toBeGreaterThanOrEqual(2020)
    })

    it('should calculate different windows for different wine types', () => {
      const redWine = { ...mockWine, type: 'red' as const }
      const whiteWine = { ...mockWine, type: 'white' as const }
      const sparklingWine = { ...mockWine, type: 'sparkling' as const }
      
      const redWindow = DrinkingWindowService.calculateDrinkingWindow(redWine)
      const whiteWindow = DrinkingWindowService.calculateDrinkingWindow(whiteWine)
      const sparklingWindow = DrinkingWindowService.calculateDrinkingWindow(sparklingWine)
      
      // Red wines typically age longer than white wines
      const redLatest = new Date(redWindow.latestDate).getFullYear()
      const whiteLatest = new Date(whiteWindow.latestDate).getFullYear()
      
      expect(redLatest).toBeGreaterThan(whiteLatest)
    })

    it('should use external aging potential when available', () => {
      const wineWithExternalData = {
        ...mockWine,
        externalData: {
          agingPotential: 15
        }
      }
      
      const result = DrinkingWindowService.calculateDrinkingWindow(wineWithExternalData)
      const latestYear = new Date(result.latestDate).getFullYear()
      
      expect(latestYear).toBe(2018 + 15) // vintage + aging potential
    })

    it('should adjust for premium regions', () => {
      const bordeauxWine = { ...mockWine, region: 'Bordeaux' }
      const genericWine = { ...mockWine, region: 'Generic Region' }
      
      const bordeauxWindow = DrinkingWindowService.calculateDrinkingWindow(bordeauxWine)
      const genericWindow = DrinkingWindowService.calculateDrinkingWindow(genericWine)
      
      const bordeauxLatest = new Date(bordeauxWindow.latestDate).getFullYear()
      const genericLatest = new Date(genericWindow.latestDate).getFullYear()
      
      expect(bordeauxLatest).toBeGreaterThan(genericLatest)
    })
  })

  describe('updateDrinkingWindowStatus', () => {
    it('should update status based on current date', () => {
      const now = new Date()
      const drinkingWindow: DrinkingWindow = {
        earliestDate: new Date(now.getFullYear() - 2, 0, 1),
        peakStartDate: new Date(now.getFullYear() - 1, 0, 1),
        peakEndDate: new Date(now.getFullYear() + 1, 11, 31),
        latestDate: new Date(now.getFullYear() + 3, 11, 31),
        currentStatus: 'too_young'
      }
      
      const updated = DrinkingWindowService.updateDrinkingWindowStatus(drinkingWindow)
      
      // Should be in peak window now
      expect(updated.currentStatus).toBe('peak')
    })
  })

  describe('getWinesNeedingAlerts', () => {
    const createMockWine = (status: DrinkingWindow['currentStatus'], daysOffset: number): Wine => {
      const now = new Date()
      const baseDate = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000)
      
      return {
        id: `wine-${status}-${daysOffset}`,
        userId: 'user1',
        name: `Test Wine ${status}`,
        producer: 'Test Producer',
        vintage: 2020,
        region: 'Test Region',
        country: 'Test Country',
        varietal: ['Cabernet Sauvignon'],
        type: 'red',
        quantity: 1,
        drinkingWindow: {
          earliestDate: new Date(baseDate.getTime() - 365 * 24 * 60 * 60 * 1000),
          peakStartDate: baseDate,
          peakEndDate: new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000),
          latestDate: new Date(baseDate.getTime() + 2 * 365 * 24 * 60 * 60 * 1000),
          currentStatus: status
        },
        externalData: {},
        createdAt: new Date(),
        updatedAt: new Date()
      } as Wine
    }

    it('should identify wines entering peak window', () => {
      const wines = [
        createMockWine('ready', 5), // Entering peak in 5 days
        createMockWine('ready', 15), // Entering peak in 15 days (too far)
        createMockWine('peak', 0) // Already in peak
      ]
      
      const alerts = DrinkingWindowService.getWinesNeedingAlerts(wines)
      
      expect(alerts.enteringPeak).toHaveLength(1)
      expect(alerts.enteringPeak[0].id).toBe('wine-ready-5')
    })

    it('should identify wines leaving peak window', () => {
      const now = new Date()
      const wines = [
        {
          ...createMockWine('peak', 0),
          drinkingWindow: {
            earliestDate: new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000),
            peakStartDate: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
            peakEndDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000), // Ends in 20 days
            latestDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
            currentStatus: 'peak' as const
          }
        },
        {
          ...createMockWine('peak', 0),
          drinkingWindow: {
            earliestDate: new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000),
            peakStartDate: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
            peakEndDate: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000), // Ends in 40 days (too far)
            latestDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
            currentStatus: 'peak' as const
          }
        }
      ]
      
      const alerts = DrinkingWindowService.getWinesNeedingAlerts(wines)
      
      expect(alerts.leavingPeak).toHaveLength(1)
    })
  })

  describe('getDrinkingUrgencyScore', () => {
    it('should give high urgency to over-the-hill wines', () => {
      const wine = {
        drinkingWindow: {
          earliestDate: new Date('2020-01-01'),
          peakStartDate: new Date('2021-01-01'),
          peakEndDate: new Date('2022-12-31'),
          latestDate: new Date('2023-12-31'),
          currentStatus: 'over_hill' as const
        }
      } as Wine
      
      const urgency = DrinkingWindowService.getDrinkingUrgencyScore(wine)
      
      expect(urgency).toBe(100)
    })

    it('should give medium urgency to wines in peak window', () => {
      const wine = {
        drinkingWindow: {
          earliestDate: new Date('2020-01-01'),
          peakStartDate: new Date('2021-01-01'),
          peakEndDate: new Date('2030-12-31'),
          latestDate: new Date('2035-12-31'),
          currentStatus: 'peak' as const
        }
      } as Wine
      
      const urgency = DrinkingWindowService.getDrinkingUrgencyScore(wine)
      
      expect(urgency).toBe(50)
    })

    it('should give low urgency to young wines', () => {
      const wine = {
        drinkingWindow: {
          earliestDate: new Date('2030-01-01'),
          peakStartDate: new Date('2032-01-01'),
          peakEndDate: new Date('2035-12-31'),
          latestDate: new Date('2040-12-31'),
          currentStatus: 'too_young' as const
        }
      } as Wine
      
      const urgency = DrinkingWindowService.getDrinkingUrgencyScore(wine)
      
      expect(urgency).toBe(10)
    })
  })
})

describe('DrinkingWindowUtils', () => {
  describe('getStatusText', () => {
    it('should return correct status text', () => {
      expect(DrinkingWindowUtils.getStatusText('too_young')).toBe('Too Young')
      expect(DrinkingWindowUtils.getStatusText('ready')).toBe('Ready to Drink')
      expect(DrinkingWindowUtils.getStatusText('peak')).toBe('At Peak')
      expect(DrinkingWindowUtils.getStatusText('declining')).toBe('Declining')
      expect(DrinkingWindowUtils.getStatusText('over_hill')).toBe('Past Prime')
    })
  })

  describe('getStatusColor', () => {
    it('should return appropriate colors for each status', () => {
      expect(DrinkingWindowUtils.getStatusColor('too_young')).toContain('blue')
      expect(DrinkingWindowUtils.getStatusColor('ready')).toContain('green')
      expect(DrinkingWindowUtils.getStatusColor('peak')).toContain('emerald')
      expect(DrinkingWindowUtils.getStatusColor('declining')).toContain('yellow')
      expect(DrinkingWindowUtils.getStatusColor('over_hill')).toContain('red')
    })
  })

  describe('getUrgencyIndicator', () => {
    it('should return critical for high urgency scores', () => {
      const indicator = DrinkingWindowUtils.getUrgencyIndicator(90)
      
      expect(indicator.level).toBe('critical')
      expect(indicator.text).toBe('Drink Soon!')
    })

    it('should return low for low urgency scores', () => {
      const indicator = DrinkingWindowUtils.getUrgencyIndicator(20)
      
      expect(indicator.level).toBe('low')
      expect(indicator.text).toBe('Low Priority')
    })
  })

  describe('formatDrinkingWindow', () => {
    it('should format single year peak window', () => {
      const drinkingWindow: DrinkingWindow = {
        earliestDate: new Date(2020, 0, 1),
        peakStartDate: new Date(2025, 0, 1),
        peakEndDate: new Date(2025, 11, 31),
        latestDate: new Date(2030, 11, 31),
        currentStatus: 'ready'
      }
      
      const formatted = DrinkingWindowUtils.formatDrinkingWindow(drinkingWindow)
      
      expect(formatted).toBe('Peak: 2025')
    })

    it('should format multi-year peak window', () => {
      const drinkingWindow: DrinkingWindow = {
        earliestDate: new Date(2020, 0, 1),
        peakStartDate: new Date(2025, 0, 1),
        peakEndDate: new Date(2028, 11, 31),
        latestDate: new Date(2030, 11, 31),
        currentStatus: 'ready'
      }
      
      const formatted = DrinkingWindowUtils.formatDrinkingWindow(drinkingWindow)
      
      expect(formatted).toBe('Peak: 2025-2028')
    })
  })

  describe('getDaysUntilStatusChange', () => {
    it('should calculate days until ready for young wine', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      
      const drinkingWindow: DrinkingWindow = {
        earliestDate: futureDate,
        peakStartDate: new Date(futureDate.getTime() + 365 * 24 * 60 * 60 * 1000),
        peakEndDate: new Date(futureDate.getTime() + 2 * 365 * 24 * 60 * 60 * 1000),
        latestDate: new Date(futureDate.getTime() + 3 * 365 * 24 * 60 * 60 * 1000),
        currentStatus: 'too_young'
      }
      
      const result = DrinkingWindowUtils.getDaysUntilStatusChange(drinkingWindow)
      
      expect(result.nextStatus).toBe('ready')
      expect(result.daysUntil).toBe(30)
      expect(result.description).toContain('Ready to drink in 30 days')
    })

    it('should return null for over-the-hill wines', () => {
      const drinkingWindow: DrinkingWindow = {
        earliestDate: new Date('2020-01-01'),
        peakStartDate: new Date('2021-01-01'),
        peakEndDate: new Date('2022-12-31'),
        latestDate: new Date('2023-12-31'),
        currentStatus: 'over_hill'
      }
      
      const result = DrinkingWindowUtils.getDaysUntilStatusChange(drinkingWindow)
      
      expect(result.nextStatus).toBeNull()
      expect(result.daysUntil).toBeNull()
      expect(result.description).toBe('Past optimal drinking window')
    })
  })
})