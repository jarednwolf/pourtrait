'use client'

import React from 'react'

type PartialFlavor = {
  fruitiness?: number
  earthiness?: number
  oakiness?: number
  acidity?: number
  tannins?: number
  sweetness?: number
}

interface PalatePortraitProps {
  red?: PartialFlavor
  white?: PartialFlavor
  sparkling?: PartialFlavor
}

// Minimal dependency-free radar using SVG polygon
export function PalatePortrait({ red, white, sparkling }: PalatePortraitProps) {
  const axes = ['fruitiness', 'earthiness', 'oakiness', 'acidity', 'tannins', 'sweetness'] as const
  const toValue = (p: PartialFlavor | undefined, key: typeof axes[number]) => Math.max(0, Math.min(10, (p?.[key] ?? 0)))

  const radius = 80
  const center = { x: 100, y: 100 }
  const angleStep = (Math.PI * 2) / axes.length

  const buildPoints = (profile?: PartialFlavor, scale = 1) => {
    return axes.map((axis, i) => {
      const angle = -Math.PI / 2 + i * angleStep
      const v = (toValue(profile, axis) / 10) * radius * scale
      const x = center.x + v * Math.cos(angle)
      const y = center.y + v * Math.sin(angle)
      return `${x},${y}`
    }).join(' ')
  }

  return (
    <div className="w-full flex flex-col items-center">
      <svg width={200} height={220} role="img" aria-label="Palate portrait">
        {/* Axes */}
        {axes.map((axis, i) => {
          const angle = -Math.PI / 2 + i * angleStep
          const x = center.x + radius * Math.cos(angle)
          const y = center.y + radius * Math.sin(angle)
          return (
            <g key={axis}>
              <line x1={center.x} y1={center.y} x2={x} y2={y} stroke="#e5e7eb" />
              <text x={x} y={y} fontSize={10} textAnchor="middle" dy={y < center.y ? -4 : 12} fill="#6b7280">
                {axis}
              </text>
            </g>
          )
        })}

        {/* Rings */}
        {[0.25, 0.5, 0.75, 1].map((s, idx) => (
          <polygon
            key={idx}
            points={axes.map((_, i) => {
              const angle = -Math.PI / 2 + i * angleStep
              const x = center.x + radius * s * Math.cos(angle)
              const y = center.y + radius * s * Math.sin(angle)
              return `${x},${y}`
            }).join(' ')}
            fill="none"
            stroke="#f3f4f6"
          />
        ))}

        {/* Profiles */}
        {red && (
          <polygon points={buildPoints(red)} fill="rgba(220, 38, 38, 0.15)" stroke="#dc2626" />
        )}
        {white && (
          <polygon points={buildPoints(white, 0.95)} fill="rgba(234, 179, 8, 0.15)" stroke="#eab308" />
        )}
        {sparkling && (
          <polygon points={buildPoints(sparkling, 0.9)} fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" />
        )}
      </svg>
      <div className="text-xs text-gray-500 mt-2">Red / White / Sparkling profiles</div>
    </div>
  )
}


