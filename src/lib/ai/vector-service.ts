// Vector Database Service for RAG (Retrieval-Augmented Generation)

import { Pinecone } from '@pinecone-database/pinecone'
import { OpenAI } from 'openai'
import { 
  WineVector, 
  WineVectorMetadata, 
  VectorSearchResult, 
  RAGContext, 
  WineKnowledgeItem 
} from './types'
import { Wine, TasteProfile } from '@/types'
import { AI_CONFIG } from './config'

// ============================================================================
// Vector Database Service
// ============================================================================

export class VectorService {
  private pinecone: Pinecone
  private openai: OpenAI
  private indexName: string

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: AI_CONFIG.vectorDb.apiKey || ''
    })
    this.openai = new OpenAI({
      apiKey: AI_CONFIG.openai.apiKey
    })
    this.indexName = AI_CONFIG.vectorDb.indexName
  }

  /**
   * Initialize the vector database index
   */
  async initializeIndex(): Promise<void> {
    try {
      const indexList = await this.pinecone.listIndexes()
      const indexExists = indexList.indexes?.some(index => index.name === this.indexName)

      if (!indexExists) {
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536, // OpenAI embedding dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        })
      }
    } catch (error) {
      console.error('Error initializing vector index:', error)
      throw error
    }
  }

  /**
   * Generate embeddings for wine data
   */
  async generateWineEmbedding(wine: Wine): Promise<number[]> {
    try {
      const wineText = this.wineToText(wine)
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: wineText
      })

      return response.data[0].embedding
    } catch (error) {
      console.error('Error generating wine embedding:', error)
      throw error
    }
  }

  /**
   * Store wine vector in database
   */
  async storeWineVector(wine: Wine): Promise<void> {
    try {
      const embedding = await this.generateWineEmbedding(wine)
      const metadata: WineVectorMetadata = {
        name: wine.name,
        producer: wine.producer,
        region: wine.region,
        country: wine.country,
        varietal: wine.varietal,
        type: wine.type,
        vintage: wine.vintage,
        tastingNotes: wine.externalData.tastingNotes,
        characteristics: this.extractCharacteristics(wine),
        priceRange: this.getPriceRange(wine.purchasePrice),
        professionalRatings: this.getAverageRating(wine.externalData.professionalRatings)
      }

      const index = this.pinecone.index(this.indexName)
      await index.upsert([{
        id: wine.id,
        values: embedding,
        metadata
      }])
    } catch (error) {
      console.error('Error storing wine vector:', error)
      throw error
    }
  }

  /**
   * Search for similar wines based on query
   */
  async searchSimilarWines(
    query: string, 
    filters?: Partial<WineVectorMetadata>,
    topK: number = 10
  ): Promise<VectorSearchResult[]> {
    try {
      const queryEmbedding = await this.generateQueryEmbedding(query)
      const index = this.pinecone.index(this.indexName)

      const searchRequest: any = {
        vector: queryEmbedding,
        topK,
        includeMetadata: true
      }

      if (filters) {
        searchRequest.filter = this.buildMetadataFilter(filters)
      }

      const response = await index.query(searchRequest)

      return response.matches?.map(match => ({
        id: match.id || '',
        score: match.score || 0,
        metadata: match.metadata as WineVectorMetadata
      })) || []
    } catch (error) {
      console.error('Error searching similar wines:', error)
      return []
    }
  }

  /**
   * Generate RAG context for AI recommendations
   */
  async generateRAGContext(
    query: string,
    userProfile: TasteProfile,
    inventory?: Wine[]
  ): Promise<RAGContext> {
    try {
      // Search for relevant wine knowledge
      const wineKnowledge = await this.searchWineKnowledge(query, userProfile)

      // Get user interaction history (mock for now)
      const userHistory = {
        recentQueries: [], // Would come from database
        preferenceEvolution: [],
        feedbackHistory: []
      }

      // Find similar users (mock for now)
      const similarUsers = []

      // Get expert opinions (mock for now)
      const expertOpinions = []

      return {
        wineKnowledge,
        userHistory,
        similarUsers,
        expertOpinions
      }
    } catch (error) {
      console.error('Error generating RAG context:', error)
      return {
        wineKnowledge: [],
        userHistory: { recentQueries: [], preferenceEvolution: [], feedbackHistory: [] },
        similarUsers: [],
        expertOpinions: []
      }
    }
  }

  /**
   * Search wine knowledge base
   */
  private async searchWineKnowledge(
    query: string,
    userProfile: TasteProfile
  ): Promise<WineKnowledgeItem[]> {
    try {
      // Build search filters based on user preferences
      const filters: Partial<WineVectorMetadata> = {}

      // Add preferred regions with null checks
      const allPreferredRegions = [
        ...(userProfile.redWinePreferences?.preferredRegions || []),
        ...(userProfile.whiteWinePreferences?.preferredRegions || []),
        ...(userProfile.sparklingPreferences?.preferredRegions || [])
      ]

      // Search for similar wines
      const searchResults = await this.searchSimilarWines(query, filters, 5)

      // Convert to wine knowledge items
      return searchResults.map(result => ({
        id: result.id,
        type: 'wine_data' as const,
        content: this.formatWineKnowledge(result.metadata),
        source: 'vector_database',
        confidence: result.score,
        lastUpdated: new Date()
      }))
    } catch (error) {
      console.error('Error searching wine knowledge:', error)
      return []
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Convert wine object to searchable text
   */
  private wineToText(wine: Wine): string {
    const parts = [
      wine.name,
      wine.producer,
      wine.region,
      wine.country,
      wine.varietal.join(' '),
      wine.type,
      wine.vintage.toString(),
      wine.externalData.tastingNotes || '',
      wine.personalNotes || ''
    ]

    return parts.filter(Boolean).join(' ')
  }

  /**
   * Generate embedding for search query
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query
    })

    return response.data[0].embedding
  }

  /**
   * Extract wine characteristics for metadata
   */
  private extractCharacteristics(wine: Wine): string[] {
    const characteristics: string[] = []

    // Add type-specific characteristics
    characteristics.push(wine.type)
    characteristics.push(...wine.varietal)

    // Add tasting notes keywords if available
    if (wine.externalData.tastingNotes) {
      const keywords = this.extractTastingKeywords(wine.externalData.tastingNotes)
      characteristics.push(...keywords)
    }

    return characteristics
  }

  /**
   * Extract keywords from tasting notes
   */
  private extractTastingKeywords(tastingNotes: string): string[] {
    const keywords = [
      'fruity', 'earthy', 'oaky', 'mineral', 'floral', 'spicy',
      'citrus', 'berry', 'cherry', 'plum', 'apple', 'pear',
      'vanilla', 'chocolate', 'tobacco', 'leather', 'herb'
    ]

    const lowerNotes = tastingNotes.toLowerCase()
    return keywords.filter(keyword => lowerNotes.includes(keyword))
  }

  /**
   * Get price range category
   */
  private getPriceRange(price?: number): string {
    if (!price) return 'unknown'
    if (price < 20) return 'budget'
    if (price < 50) return 'mid-range'
    if (price < 100) return 'premium'
    return 'luxury'
  }

  /**
   * Get average professional rating
   */
  private getAverageRating(ratings?: Array<{ score: number; maxScore: number }>): number | undefined {
    if (!ratings || ratings.length === 0) return undefined

    const normalizedRatings = ratings.map(rating => (rating.score / rating.maxScore) * 100)
    return normalizedRatings.reduce((sum, rating) => sum + rating, 0) / normalizedRatings.length
  }

  /**
   * Build metadata filter for Pinecone
   */
  private buildMetadataFilter(filters: Partial<WineVectorMetadata>): Record<string, any> {
    const filter: Record<string, any> = {}

    if (filters.type) {
      filter.type = { $eq: filters.type }
    }

    if (filters.country) {
      filter.country = { $eq: filters.country }
    }

    if (filters.priceRange) {
      filter.priceRange = { $eq: filters.priceRange }
    }

    if (filters.varietal && filters.varietal.length > 0) {
      filter.varietal = { $in: filters.varietal }
    }

    return filter
  }

  /**
   * Format wine knowledge for RAG context
   */
  private formatWineKnowledge(metadata: WineVectorMetadata): string {
    return `${metadata.name} by ${metadata.producer} from ${metadata.region}, ${metadata.country}. 
    Type: ${metadata.type}. Varietals: ${metadata.varietal.join(', ')}. 
    Vintage: ${metadata.vintage}. 
    ${metadata.tastingNotes ? `Tasting notes: ${metadata.tastingNotes}` : ''}
    ${metadata.professionalRatings ? `Professional rating: ${metadata.professionalRatings}/100` : ''}`
  }
}

// ============================================================================
// Wine Knowledge Database Service
// ============================================================================

export class WineKnowledgeService {
  private vectorService: VectorService

  constructor() {
    this.vectorService = new VectorService()
  }

  /**
   * Initialize wine knowledge database
   */
  async initializeKnowledgeBase(): Promise<void> {
    await this.vectorService.initializeIndex()
    // Additional initialization for wine knowledge base
  }

  /**
   * Add wine to knowledge base
   */
  async addWineToKnowledgeBase(wine: Wine): Promise<void> {
    await this.vectorService.storeWineVector(wine)
  }

  /**
   * Search wine knowledge for recommendations
   */
  async searchWineKnowledge(
    query: string,
    userProfile: TasteProfile,
    filters?: {
      type?: string[]
      region?: string[]
      priceRange?: string
    }
  ): Promise<WineKnowledgeItem[]> {
    const vectorFilters: Partial<WineVectorMetadata> = {}

    if (filters?.type && filters.type.length > 0) {
      vectorFilters.type = filters.type[0] // Pinecone doesn't support array filters directly
    }

    if (filters?.priceRange) {
      vectorFilters.priceRange = filters.priceRange
    }

    const results = await this.vectorService.searchSimilarWines(query, vectorFilters, 10)

    return results.map(result => ({
      id: result.id,
      type: 'wine_data' as const,
      content: this.formatWineRecommendation(result.metadata),
      source: 'wine_database',
      confidence: result.score,
      lastUpdated: new Date()
    }))
  }

  /**
   * Format wine data for recommendation context
   */
  private formatWineRecommendation(metadata: WineVectorMetadata): string {
    let recommendation = `${metadata.name} from ${metadata.producer} (${metadata.region}, ${metadata.country})`
    
    if (metadata.vintage) {
      recommendation += ` - ${metadata.vintage} vintage`
    }

    if (metadata.tastingNotes) {
      recommendation += `. Characteristics: ${metadata.tastingNotes}`
    }

    if (metadata.professionalRatings) {
      recommendation += `. Professional rating: ${Math.round(metadata.professionalRatings)}/100`
    }

    return recommendation
  }
}