import { Suspense } from 'react'
import { SignUpForm } from '@/components/auth/SignUpForm'
import { PublicOnlyRoute } from '@/components/auth/ProtectedRoute'

function SignUpContent() {
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

export const metadata = {
  title: 'Sign Up - Pourtrait',
  description: 'Create your Pourtrait wine cellar account',
}