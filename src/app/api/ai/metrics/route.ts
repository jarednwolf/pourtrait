// AI Metrics and Monitoring API Route

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

// ============================================================================
// AI Metrics Endpoint
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '24h'
    const userId = searchParams.get('userId')

    // Validate timeframe
    const validTimeframes = ['1h', '24h', '7d', '30d']
    if (!validTimeframes.includes(timeframe)) {
      return NextResponse.json(
        { error: 'Invalid timeframe. Use: 1h, 24h, 7d, or 30d' },
        { status: 400 }
      )
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Calculate time range
    const timeRanges = {
      '1h': new Date(Date.now() - 60 * 60 * 1000),
      '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
      '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }

    const startTime = timeRanges[timeframe as keyof typeof timeRanges]

    // Build base query
    let query = supabase
      .from('ai_interactions')
      .select('*')
      .gte('created_at', startTime.toISOString())

    // Filter by user if specified
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: interactions, error } = await query

    if (error) {
      throw error
    }

    // Calculate metrics
    const metrics = calculateMetrics(interactions || [])

    return NextResponse.json({
      success: true,
      data: {
        timeframe,
        startTime: startTime.toISOString(),
        endTime: new Date().toISOString(),
        metrics,
        totalInteractions: interactions?.length || 0
      }
    })

  } catch (error) {
    console.error('AI Metrics API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Log Custom Metrics
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.userId || !body.metricType) {
      return NextResponse.json(
        { error: 'userId and metricType are required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Log custom metric
    const { error } = await supabase
      .from('ai_metrics')
      .insert({
        user_id: body.userId,
        metric_type: body.metricType,
        metric_value: body.metricValue || 1,
        metadata: body.metadata || {},
        created_at: new Date().toISOString()
      })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Metric logged successfully'
    })

  } catch (error) {
    console.error('Error logging custom metric:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// Performance Metrics Calculation
// ============================================================================

function calculateMetrics(interactions: any[]) {
  if (interactions.length === 0) {
    return {
      averageResponseTime: 0,
      averageConfidence: 0,
      averageTokensUsed: 0,
      totalCost: 0,
      successRate: 0,
      popularQueries: [],
      modelUsage: {},
      hourlyDistribution: {}
    }
  }

  // Calculate averages
  const totalResponseTime = interactions.reduce((sum, i) => sum + (i.response_time || 0), 0)
  const totalConfidence = interactions.reduce((sum, i) => sum + (i.confidence || 0), 0)
  const totalTokens = interactions.reduce((sum, i) => sum + (i.tokens_used || 0), 0)

  const averageResponseTime = totalResponseTime / interactions.length
  const averageConfidence = totalConfidence / interactions.length
  const averageTokensUsed = totalTokens / interactions.length

  // Calculate cost (rough estimate)
  const totalCost = interactions.reduce((sum, i) => {
    const tokens = i.tokens_used || 0
    const costPer1K = i.model?.includes('gpt-4') ? 0.02 : 0.002
    return sum + (tokens * costPer1K / 1000)
  }, 0)

  // Calculate success rate
  const successfulInteractions = interactions.filter(i => i.confidence > 0.7).length
  const successRate = successfulInteractions / interactions.length

  // Popular queries analysis
  const queryFrequency: { [key: string]: number } = {}
  interactions.forEach(i => {
    const query = i.query?.toLowerCase() || ''
    const words = query.split(' ').filter((word: string) => word.length > 3)
    words.forEach((word: string) => {
      queryFrequency[word] = (queryFrequency[word] || 0) + 1
    })
  })

  const popularQueries = Object.entries(queryFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }))

  // Model usage distribution
  const modelUsage: { [key: string]: number } = {}
  interactions.forEach(i => {
    const model = i.model || 'unknown'
    modelUsage[model] = (modelUsage[model] || 0) + 1
  })

  // Hourly distribution
  const hourlyDistribution: { [key: number]: number } = {}
  interactions.forEach(i => {
    const hour = new Date(i.created_at).getHours()
    hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1
  })

  return {
    averageResponseTime: Math.round(averageResponseTime),
    averageConfidence: Math.round(averageConfidence * 100) / 100,
    averageTokensUsed: Math.round(averageTokensUsed),
    totalCost: Math.round(totalCost * 100) / 100,
    successRate: Math.round(successRate * 100) / 100,
    popularQueries,
    modelUsage,
    hourlyDistribution
  }
}

// ============================================================================
// Cost Analysis Endpoint
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get cost data
    const timeRanges = {
      '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
      '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }

    const startTime = timeRanges[timeframe as keyof typeof timeRanges] || timeRanges['30d']

    const { data: interactions, error } = await supabase
      .from('ai_interactions')
      .select('tokens_used, model, created_at')
      .gte('created_at', startTime.toISOString())

    if (error) {
      throw error
    }

    // Calculate detailed cost analysis
    const costAnalysis = calculateCostAnalysis(interactions || [], timeframe)

    return NextResponse.json({
      success: true,
      data: costAnalysis
    })

  } catch (error) {
    console.error('Cost Analysis API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateCostAnalysis(interactions: any[], timeframe: string) {
  const costPerModel = {
    'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }
  }

  let totalCost = 0
  const dailyCosts: { [key: string]: number } = {}
  const modelCosts: { [key: string]: number } = {}

  interactions.forEach(interaction => {
    const model = interaction.model || 'gpt-3.5-turbo'
    const tokens = interaction.tokens_used || 0
    const costs = costPerModel[model as keyof typeof costPerModel] || costPerModel['gpt-3.5-turbo']
    
    // Estimate input/output split (70% input, 30% output)
    const cost = (tokens * 0.7 * costs.input + tokens * 0.3 * costs.output) / 1000
    
    totalCost += cost
    
    // Daily breakdown
    const date = new Date(interaction.created_at).toISOString().split('T')[0]
    dailyCosts[date] = (dailyCosts[date] || 0) + cost
    
    // Model breakdown
    modelCosts[model] = (modelCosts[model] || 0) + cost
  })

  // Calculate projections
  const daysInTimeframe = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30
  const dailyAverage = totalCost / daysInTimeframe
  const monthlyProjection = dailyAverage * 30
  const yearlyProjection = dailyAverage * 365

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    dailyAverage: Math.round(dailyAverage * 100) / 100,
    monthlyProjection: Math.round(monthlyProjection * 100) / 100,
    yearlyProjection: Math.round(yearlyProjection * 100) / 100,
    dailyBreakdown: Object.entries(dailyCosts).map(([date, cost]) => ({
      date,
      cost: Math.round(cost * 100) / 100
    })),
    modelBreakdown: Object.entries(modelCosts).map(([model, cost]) => ({
      model,
      cost: Math.round(cost * 100) / 100,
      percentage: Math.round((cost / totalCost) * 100)
    }))
  }
}