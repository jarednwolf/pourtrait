'use client'

export default function ChatLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" aria-hidden="true" />
            <div>
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2" aria-hidden="true" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="h-[700px] rounded-md bg-white border border-gray-200 p-4">
              <div className="h-full w-full bg-gray-100 rounded animate-pulse" aria-hidden="true" />
            </div>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <div className="h-64 rounded-md bg-white border border-gray-200 p-4">
              <div className="h-full w-full bg-gray-100 rounded animate-pulse" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



