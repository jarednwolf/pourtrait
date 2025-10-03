import { describe, it, expect } from 'vitest'
import { ExpertDrinkingWindowService } from '../expert-drinking-windows'

describe('ExpertDrinkingWindowService', () => {
  describe('findExpertData', () => {
    it('should find exact producer match', () => {
      const wine = {
        producer: 'Château Margaux',
        region: 'Margaux',
        varietal: ['Cabernet Sauvignon']
      }
      
      const result = ExpertDrinkingWindowService.findExpertData(wine)
      
      expect(result).toBeTruthy()
      expect(result?.producer).toBe('Château Margaux')
      expect(result?.drinkingWindow.latest).toBe(50)
    })

    it('should find regional + varietal match', () => {
      const wine = {
        producer: 'Unknown Producer',
        region: 'Barolo',
        varietal: ['Nebbiolo']
      }
      
      const result = ExpertDrinkingWindowService.findExpertData(wine)
      
      expect(result).toBeTruthy()
      expect(result?.region).toBe('Barolo')
      expect(result?.varietal).toContain('Nebbiolo')
    })

    it('should return null for unknown wine', () => {
      const wine = {
        producer: 'Unknown Producer',
        region: 'Unknown Region',
        varietal: ['Unknown Varietal']
      }
      
      const result = ExpertDrinkingWindowService.findExpertData(wine)
      
      expect(result).toBeFalsy()
    })
  })

  describe('getRegionalPattern', () => {
    it('should find Bordeaux pattern', () => {
      const result = ExpertDrinkingWindowService.getRegionalPattern('Bordeaux')
      
      expect(result).toBeTruthy()
      expect(result?.baseAging).toBe(12)
      expect(result?.confidence).toBe(0.9)
    })

    it('should find partial region match', () => {
      const result = ExpertDrinkingWindowService.getRegionalPattern('Napa Valley AVA')
      
      expect(result).toBeTruthy()
      expect(result?.baseAging).toBe(10)
    })

    it('should return null for unknown region', () => {
      const result = ExpertDrinkingWindowService.getRegionalPattern('Unknown Region')
      
      expect(result).toBeFalsy()
    })
  })

  describe('getVarietalPattern', () => {
    it('should find Cabernet Sauvignon pattern', () => {
      const result = ExpertDrinkingWindowService.getVarietalPattern(['Cabernet Sauvignon'])
      
      expect(result).toBeTruthy()
      expect(result?.baseAging).toBe(10)
      expect(result?.confidence).toBe(0.8)
    })

    it('should find partial varietal match', () => {
      const result = ExpertDrinkingWindowService.getVarietalPattern(['Cabernet Sauvignon Clone 337'])
      
      expect(result).toBeTruthy()
      expect(result?.baseAging).toBe(10)
    })

    it('should return null for empty varietals', () => {
      const result = ExpertDrinkingWindowService.getVarietalPattern([])
      
      expect(result).toBeFalsy()
    })
  })

  describe('calculateExpertAgingPotential', () => {
    it('should prioritize exact expert data', () => {
      const wine = {
        producer: 'Château Latour',
        region: 'Pauillac',
        varietal: ['Cabernet Sauvignon']
      }
      
      const result = ExpertDrinkingWindowService.calculateExpertAgingPotential(wine)
      
      expect(result).toBeTruthy()
      expect(result?.agingPotential).toBe(60)
      expect(result?.confidence).toBe(0.95)
      expect(result?.source).toContain('Expert data')
    })

    it('should fall back to regional pattern', () => {
      const wine = {
        producer: 'Unknown Producer',
        region: 'Bordeaux',
        varietal: ['Merlot']
      }
      
      const result = ExpertDrinkingWindowService.calculateExpertAgingPotential(wine)
      
      expect(result).toBeTruthy()
      expect(result?.agingPotential).toBe(12)
      expect(result?.source).toBe('Regional pattern')
    })

    it('should fall back to varietal pattern', () => {
      const wine = {
        producer: 'Unknown Producer',
        region: 'Unknown Region',
        varietal: ['Pinot Noir']
      }
      
      const result = ExpertDrinkingWindowService.calculateExpertAgingPotential(wine)
      
      expect(result).toBeTruthy()
      expect(result?.agingPotential).toBe(6)
      expect(result?.source).toBe('Varietal pattern')
    })

    it('should return null for completely unknown wine', () => {
      const wine = {
        producer: 'Unknown Producer',
        region: 'Unknown Region',
        varietal: ['Unknown Varietal']
      }
      
      const result = ExpertDrinkingWindowService.calculateExpertAgingPotential(wine)
      
      expect(result).toBeFalsy()
    })
  })
})