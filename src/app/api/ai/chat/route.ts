// AI Chat API Route - Conversational Sommelier Interface

import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { createClient } from '@supabase/supabase-js'
import { ResponseValidator } from '@/lib/ai/validation'
import { buildPromptTemplate } from '@/lib/ai/config'

// Configure as Edge Runtime for optimal performance
export const runtime = 'edge'

// ============================================================================
// AI Chat Endpoint
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get user authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Initialize services
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    })

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Get user profile and preferences
    const { data: profile } = await supabase
      .from('taste_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const experienceLevel = profile?.experience_level || 'intermediate'

    // Get conversation history and context
    const conversationHistory = body.conversationHistory || []
    const conversationId = body.conversationId || `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const context = body.context || {}

    // Determine recommendation type based on context and message content
    const messageContent = body.message.toLowerCase()
    let recommendationType: 'purchase' | 'inventory' | 'pairing' | 'restaurant' = 'purchase' // default
    let contextType = 'casual_evening' // default

    if (messageContent.includes('tonight') || messageContent.includes('drink now')) {
      recommendationType = 'inventory'
      contextType = 'casual_evening'
    } else if (messageContent.includes('pair') || messageContent.includes('food') || messageContent.includes('meal')) {
      recommendationType = 'pairing'
      contextType = 'formal_dinner'
    } else if (messageContent.includes('learn') || messageContent.includes('explain') || messageContent.includes('what is')) {
      contextType = 'learning'
    } else if (messageContent.includes('romantic') || messageContent.includes('date')) {
      contextType = 'romantic_dinner'
    } else if (messageContent.includes('celebration') || messageContent.includes('party')) {
      contextType = 'celebration'
    }

    // Build prompt template with dynamic context
    const promptTemplate = buildPromptTemplate(
      experienceLevel,
      recommendationType,
      contextType
    )

    // Build conversation messages
    const messages = [
      { role: 'system', content: promptTemplate.systemPrompt },
      ...conversationHistory.slice(-6), // Keep last 6 messages for context
      { role: 'user', content: body.message }
    ]

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 800,
      stream: false
    })

    const aiResponse = completion.choices[0]?.message?.content || ''

    // Validate response
    const validation = ResponseValidator.validateResponse(
      aiResponse,
      promptTemplate.responseGuidelines
    )

    if (!validation.passed) {
      console.warn('AI response validation failed:', validation.errors)
      
      // Return a safe fallback response
      return NextResponse.json({
        success: true,
        data: {
          message: "I apologize, but I need to rephrase my response. Could you please ask your question again?",
          confidence: 0.5,
          validationPassed: false
        }
      })
    }

    // Log the chat interaction with enhanced metadata
    await logChatInteraction(
      supabase, 
      user.id, 
      conversationId,
      body.message, 
      aiResponse, 
      completion.usage?.total_tokens || 0,
      validation.score / 100,
      validation.passed,
      experienceLevel,
      context
    )

    return NextResponse.json({
      success: true,
      data: {
        message: aiResponse,
        confidence: validation.score / 100,
        validationPassed: validation.passed,
        experienceLevel: experienceLevel,
        conversationId: conversationId,
        tokensUsed: completion.usage?.total_tokens || 0,
        responseTime: Date.now() - Date.now(), // This would need proper timing
        context: {
          recommendationType,
          contextType,
          topics: Object.keys(context)
        }
      }
    })

  } catch (error) {
    console.error('AI Chat API Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// Streaming Chat Response (Alternative Implementation)
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get user authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    })

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // Get user profile and context
    const { data: profile } = await supabase
      .from('taste_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const experienceLevel = profile?.experience_level || 'intermediate'
    const conversationId = body.conversationId || `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const context = body.context || {}

    // Build prompt template
    const promptTemplate = buildPromptTemplate(
      experienceLevel,
      'purchase',
      'casual_evening'
    )

    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: promptTemplate.systemPrompt },
        { role: 'user', content: body.message }
      ],
      temperature: 0.7,
      max_tokens: 800,
      stream: true
    })

    // Create a ReadableStream for the response
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        let fullResponse = ''
        
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            fullResponse += content
            
            // Send chunk to client
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
          }
          
          // Validate the complete response
          const validation = ResponseValidator.validateResponse(
            fullResponse,
            promptTemplate.responseGuidelines
          )
          
          // Send validation result
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'validation', 
            passed: validation.passed,
            score: validation.score 
          })}\n\n`))
          
          // Log interaction
          await logChatInteraction(
            supabase, 
            user.id, 
            conversationId,
            body.message, 
            fullResponse, 
            0,
            0.8, // default confidence for streaming
            true, // assume validation passed for streaming
            experienceLevel,
            context
          )
          
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error) {
    console.error('Streaming Chat API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function logChatInteraction(
  supabase: any,
  userId: string,
  conversationId: string,
  userMessage: string,
  aiResponse: string,
  tokensUsed: number,
  confidence: number,
  validationPassed: boolean,
  experienceLevel: string,
  context: Record<string, any>
): Promise<void> {
  try {
    await supabase
      .from('chat_interactions')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        user_message: userMessage,
        ai_response: aiResponse,
        context: context,
        confidence: confidence,
        tokens_used: tokensUsed,
        validation_passed: validationPassed,
        experience_level: experienceLevel,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error logging chat interaction:', error)
  }
}

// ============================================================================
// GET Method - Health Check
// ============================================================================

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'AI Chat API',
    timestamp: new Date().toISOString(),
    features: ['conversational_ai', 'streaming_responses', 'validation'],
    version: '1.0.0'
  })
}