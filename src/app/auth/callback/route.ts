import { NextRequest, NextResponse } from 'next/server'
import { createSSRServerClient } from '@/lib/supabase/clients.server'
import { AuthService } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createSSRServerClient()
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(new URL('/auth/signin?error=callback_error', request.url))
      }

      if (data.user) {
        // Check if user profile exists, create if not
        try {
          const existingProfile = await AuthService.getUserProfile(data.user.id)
          
          if (!existingProfile) {
            // Create profile for OAuth users
            await AuthService.createUserProfile(data.user.id, {
              name: data.user.user_metadata?.full_name || 
                    data.user.user_metadata?.name || 
                    data.user.email?.split('@')[0] || 
                    'User',
              experienceLevel: 'beginner', // Default for OAuth users
            })
          }
        } catch (profileError) {
          console.error('Profile creation error:', profileError)
          // Continue anyway - profile might be created by trigger
        }
      }

      // Redirect to finish page to complete onboarding/profile resume
      const finishUrl = `/auth/callback/finish?next=${encodeURIComponent(next)}`
      return NextResponse.redirect(new URL(finishUrl, request.url))
    } catch (error) {
      console.error('Session exchange error:', error)
      return NextResponse.redirect(new URL('/auth/signin?error=session_error', request.url))
    }
  }

  // No code provided
  return NextResponse.redirect(new URL('/auth/signin?error=no_code', request.url))
}