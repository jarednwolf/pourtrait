import React from 'react'

interface BrandLogoProps {
  className?: string
}

export function BrandLogo({ className = '' }: BrandLogoProps) {
  return (
    <img
      src="/branding/wordmark.svg"
      alt="Pourtrait"
      className={['h-7 sm:h-8 w-auto', className].filter(Boolean).join(' ')}
      decoding="async"
      loading="eager"
    />
  )
}


