'use client'

export default function InventoryLoading() {
  return (
    <div className="min-h-screen bg-surface-alt">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" aria-hidden="true" />
          <div className="h-9 w-28 bg-gray-200 rounded animate-pulse" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 bg-white border border-gray-200 rounded-md p-4">
              <div className="h-full w-full bg-gray-100 rounded animate-pulse" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}



