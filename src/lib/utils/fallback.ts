/**
 * Fallback mechanisms for when primary services fail
 */

import { AppError, ErrorType } from '../errors';

export interface FallbackOptions<T> {
  fallbackValue?: T;
  fallbackFunction?: () => Promise<T> | T;
  shouldUseFallback?: (error: Error) => boolean;
  onFallback?: (error: Error) => void;
}

/**
 * Execute function with fallback
 */
export async function withFallback<T>(
  primaryFn: () => Promise<T>,
  options: FallbackOptions<T> = {}
): Promise<T> {
  try {
    return await primaryFn();
  } catch (error) {
    const shouldFallback = options.shouldUseFallback?.(error as Error) ?? true;
    
    if (!shouldFallback) {
      throw error;
    }
    
    options.onFallback?.(error as Error);
    
    if (options.fallbackFunction) {
      return await options.fallbackFunction();
    }
    
    if (options.fallbackValue !== undefined) {
      return options.fallbackValue;
    }
    
    throw error;
  }
}

/**
 * AI service fallbacks
 */
export class AIServiceFallbacks {
  /**
   * Fallback for wine recommendations when AI is unavailable
   */
  static getRecommendationFallback(userPreferences?: any) {
    return {
      recommendations: [
        {
          id: 'fallback-1',
          name: 'Explore Your Inventory',
          description: 'Browse your wine collection to find something perfect for tonight.',
          type: 'inventory_browse',
          confidence: 0.8
        },
        {
          id: 'fallback-2',
          name: 'Popular Wines',
          description: 'Check out wines that are popular with other wine lovers.',
          type: 'popular_wines',
          confidence: 0.7
        }
      ],
      fallbackMode: true,
      message: "I'm temporarily unavailable, but here are some suggestions to help you find great wine."
    };
  }
  
  /**
   * Fallback for chat responses when AI is unavailable
   */
  static getChatFallback(query: string) {
    const fallbackResponses = {
      'what should i drink': "I'd love to help you choose a wine! While I'm temporarily unavailable, you can browse your inventory or check out popular wine recommendations.",
      'wine pairing': "Wine pairing is a wonderful way to enhance your meal! While I'm getting back online, consider classic pairings like red wine with red meat or white wine with fish.",
      'default': "I'm temporarily unavailable, but I'll be back soon to help with all your wine questions! In the meantime, feel free to explore your wine inventory."
    };
    
    const lowerQuery = query.toLowerCase();
    let response = fallbackResponses.default;
    
    for (const [key, value] of Object.entries(fallbackResponses)) {
      if (lowerQuery.includes(key)) {
        response = value;
        break;
      }
    }
    
    return {
      message: response,
      fallbackMode: true,
      suggestions: [
        'Browse my wine inventory',
        'View popular wines',
        'Learn about wine basics'
      ]
    };
  }
}

/**
 * Image processing fallbacks
 */
export class ImageProcessingFallbacks {
  /**
   * Fallback when wine label recognition fails
   */
  static getWineRecognitionFallback() {
    return {
      success: false,
      confidence: 0,
      extractedText: null,
      suggestions: [
        'Try taking another photo with better lighting',
        'Make sure the wine label is clearly visible',
        'Add wine details manually instead'
      ],
      fallbackMode: true
    };
  }
  
  /**
   * Fallback when OCR fails
   */
  static getOCRFallback() {
    return {
      text: '',
      confidence: 0,
      suggestions: [
        'Try taking a clearer photo',
        'Ensure good lighting conditions',
        'Type the information manually'
      ],
      fallbackMode: true
    };
  }
}

/**
 * Data service fallbacks
 */
export class DataServiceFallbacks {
  /**
   * Fallback wine data when external APIs are unavailable
   */
  static getWineDataFallback(wineName: string) {
    return {
      name: wineName,
      producer: 'Unknown Producer',
      region: 'Unknown Region',
      vintage: new Date().getFullYear() - 2,
      type: 'red',
      description: 'Wine details will be updated when our data service is available.',
      fallbackMode: true,
      dataSource: 'fallback'
    };
  }
  
  /**
   * Fallback for drinking window calculations
   */
  static getDrinkingWindowFallback(wineType: string, vintage: number) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - vintage;
    
    // Simple fallback logic based on wine type
    let peakStart = 2;
    let peakEnd = 8;
    
    switch (wineType.toLowerCase()) {
      case 'white':
        peakStart = 1;
        peakEnd = 5;
        break;
      case 'red':
        peakStart = 3;
        peakEnd = 10;
        break;
      case 'sparkling':
        peakStart = 0;
        peakEnd = 3;
        break;
    }
    
    return {
      earliestDate: new Date(vintage + 1, 0, 1),
      peakStartDate: new Date(vintage + peakStart, 0, 1),
      peakEndDate: new Date(vintage + peakEnd, 0, 1),
      latestDate: new Date(vintage + peakEnd + 2, 0, 1),
      currentStatus: age < peakStart ? 'too_young' : 
                    age <= peakEnd ? 'peak' : 'declining',
      confidence: 0.6,
      dataSource: 'fallback',
      fallbackMode: true
    };
  }
}

/**
 * Network fallbacks
 */
export class NetworkFallbacks {
  /**
   * Check if we're offline
   */
  static isOffline(): boolean {
    return typeof navigator !== 'undefined' && !navigator.onLine;
  }
  
  /**
   * Get cached data when offline
   */
  static async getCachedData<T>(key: string): Promise<T | null> {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Return cached data if it's less than 1 hour old
        if (Date.now() - timestamp < 3600000) {
          return data;
        }
      }
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
    }
    
    return null;
  }
  
  /**
   * Cache data for offline use
   */
  static setCachedData<T>(key: string, data: T): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }
}