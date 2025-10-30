'use client'

import * as React from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function AdminLlmPage() {
  const [digest, setDigest] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/metrics/llm-map-digest?days=7', { cache: 'no-store' })
        const json = await res.json()
        if (!cancelled) {
          if (json?.success) setDigest(json.data)
          else setError(json?.error || 'Failed to load metrics')
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load metrics')
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
        <h1 className="text-2xl font-bold">LLM Mapping Metrics</h1>
        {error && <div className="text-red-600">{error}</div>}
        {digest && (
          <>
            <Card>
              <CardHeader><CardTitle>Last {digest.days} days</CardTitle></CardHeader>
              <CardContent>
                <div className="text-sm text-gray-700">Total runs: {digest.total_runs}</div>
                <div className="text-sm text-gray-700">Avg latency: {digest.avg_latency_ms} ms</div>
                <div className="text-sm text-gray-700">Avg confidence: {digest.avg_confidence}</div>
                <div className="text-sm text-gray-700">Failure rate: {digest.failure_rate}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>By model</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-1">Model</th>
                      <th className="py-1">Runs</th>
                      <th className="py-1">Avg latency</th>
                      <th className="py-1">Avg confidence</th>
                      <th className="py-1">Failure rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(digest.models || []).map((m: any) => (
                      <tr key={m.model} className="border-t border-gray-200">
                        <td className="py-1">{m.model}</td>
                        <td className="py-1">{m.total}</td>
                        <td className="py-1">{m.avg_latency_ms} ms</td>
                        <td className="py-1">{m.avg_confidence}</td>
                        <td className="py-1">{m.failure_rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ProtectedRoute>
  )
}


