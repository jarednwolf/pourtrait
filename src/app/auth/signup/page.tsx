'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { PublicOnlyRoute } from '@/components/auth/ProtectedRoute'
import { track } from '@/lib/utils/track'

function SignUpContent() {
  const search = useSearchParams()
  const next = search?.get('next') || '/dashboard'
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Pourtrait</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your AI-powered wine cellar and sommelier
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <SignUpForm />
        <div className="mt-4 text-center" aria-label="Get started options">
          <a href={`/auth/signin?next=${encodeURIComponent(next)}`} className="text-blue-700 underline" aria-label="Already have an account? Sign in">
            Already have an account? Sign in
          </a>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <PublicOnlyRoute>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      }>
        <SignUpContent />
      </Suspense>
    </PublicOnlyRoute>
  )
}

// Metadata belongs in server components/layouts, not here.