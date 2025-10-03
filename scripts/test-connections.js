#!/usr/bin/env node

// Test script to verify Supabase and OpenAI connections
require('dotenv').config({ path: '.env.local' })

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...')
  
  try {
    const { createClient } = require('@supabase/supabase-js')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Test basic connection
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)

    if (error) {
      console.log('❌ Supabase connection failed:', error.message)
      return false
    }

    console.log('✅ Supabase connection successful!')
    
    // Test service role key
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: tables, error: tablesError } = await serviceSupabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5)

    if (tablesError) {
      console.log('⚠️  Service role key test failed:', tablesError.message)
    } else {
      console.log('✅ Service role key working!')
      console.log('📋 Found tables:', tables?.map(t => t.table_name).join(', '))
    }

    return true
  } catch (error) {
    console.log('❌ Supabase test error:', error.message)
    return false
  }
}

async function testOpenAIConnection() {
  console.log('\n🤖 Testing OpenAI connection...')
  
  try {
    const { OpenAI } = require('openai')
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    // Test with a simple completion
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Say "Hello from OpenAI!" in exactly those words.' }
      ],
      max_tokens: 10
    })

    const response = completion.choices[0]?.message?.content?.trim()
    
    if (response && response.includes('Hello from OpenAI!')) {
      console.log('✅ OpenAI connection successful!')
      console.log('🎯 Response:', response)
      console.log('📊 Tokens used:', completion.usage?.total_tokens)
      return true
    } else {
      console.log('⚠️  OpenAI responded but with unexpected content:', response)
      return false
    }
  } catch (error) {
    console.log('❌ OpenAI test error:', error.message)
    
    if (error.code === 'invalid_api_key') {
      console.log('🔑 Please check your OPENAI_API_KEY in .env.local')
    } else if (error.code === 'insufficient_quota') {
      console.log('💳 OpenAI API quota exceeded - please check your billing')
    }
    
    return false
  }
}

async function testPersonalizedRecommendations() {
  console.log('\n🍷 Testing personalized recommendations service...')
  
  try {
    // Import our service
    const { PersonalizedRecommendationService } = require('../src/lib/services/personalized-recommendations')
    
    console.log('✅ PersonalizedRecommendationService imported successfully!')
    
    // Test service instantiation
    const service = new PersonalizedRecommendationService()
    console.log('✅ Service instantiated successfully!')
    
    return true
  } catch (error) {
    console.log('❌ Personalized recommendations test error:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Starting connection tests...\n')
  
  const results = {
    supabase: await testSupabaseConnection(),
    openai: await testOpenAIConnection(),
    recommendations: await testPersonalizedRecommendations()
  }
  
  console.log('\n📊 Test Results Summary:')
  console.log('========================')
  console.log(`Supabase: ${results.supabase ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`OpenAI: ${results.openai ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Recommendations: ${results.recommendations ? '✅ PASS' : '❌ FAIL'}`)
  
  const allPassed = Object.values(results).every(Boolean)
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Your setup is ready to go!')
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.')
    process.exit(1)
  }
}

main().catch(console.error)