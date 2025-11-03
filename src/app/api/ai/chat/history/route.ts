// AI Chat History API Route

import { NextRequest, NextResponse } from 'next/server'
import { createRlsClientFromRequest, getAccessTokenFromRequest } from '@/lib/supabase/api-auth'

// Configure as Edge Runtime for optimal performance
export const runtime = 'edge'

// ============================================================================
// Chat History Endpoint
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get user authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = getAccessTokenFromRequest(request)
    const supabase = token ? createRlsClientFromRequest(request)! : null
    if (!supabase) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token!)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    if (conversationId) {
      // Get specific conversation history
      const { data: history, error } = await supabase
        .from('chat_interactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        data: history
      })
    } else {
      // Get user's recent conversations
      const { data: conversations, error } = await supabase
        .rpc('get_user_conversations', {
          target_user_id: user.id,
          conversation_limit: limit
        })

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        data: conversations
      })
    }

  } catch (error) {
    console.error('Chat History API Error:', error)
    
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
// Delete Conversation History
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
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

    const token = getAccessTokenFromRequest(request)
    const supabase = token ? createRlsClientFromRequest(request)! : null
    if (!supabase) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token!)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Delete conversation and all related interactions
    const { error: deleteError } = await supabase
      .from('chat_interactions')
      .delete()
      .eq('user_id', user.id)
      .eq('conversation_id', conversationId)

    if (deleteError) {
      throw deleteError
    }

    // Also delete the conversation record
    await supabase
      .from('chat_conversations')
      .delete()
      .eq('user_id', user.id)
      .eq('id', conversationId)

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    })

  } catch (error) {
    console.error('Delete Conversation API Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}