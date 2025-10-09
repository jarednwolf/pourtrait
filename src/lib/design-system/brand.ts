// Brand design tokens for Pourtrait
// These tokens are framework-agnostic and can be consumed by Tailwind, CSS, or JS

export type BrandRadiusKey = 'sm' | 'md' | 'lg'

export const brand = {
  meta: {
    name: 'Pourtrait',
    tagline: 'Every bottle a brushstroke',
  },
  color: {
    // Primary palette (AA+ contrast targets)
    primary: '#6D28D9',
    primary600: '#5B21B6',
    primary700: '#4C1D95',
    accent: '#7C3AED',
    grape: '#5B2A86',
    blush: '#F3E8FF',
    success: '#16A34A',
    warning: '#F59E0B',
    error: '#DC2626',

    // Neutrals and surfaces
    surface: '#FFFFFF',
    surfaceAlt: '#F8F7FB',
    darkSurface: '#0B0B0E',
    darkSurfaceAlt: '#121218',
    outline: '#E5E7EB',
  },
  type: {
    heading: 'Playfair Display, Georgia, serif',
    body: 'Inter, system-ui, sans-serif',
    scale: {
      h1: { size: 48, line: 56 },
      h2: { size: 32, line: 40 },
      h3: { size: 24, line: 32 },
      body: { size: 16, line: 24 },
      caption: { size: 13, line: 20 },
    },
  },
  radius: {
    sm: '6px',
    md: '12px',
    lg: '20px',
  } as Record<BrandRadiusKey, string>,
  shadow: {
    xs: '0 1px 2px rgba(0,0,0,0.04)',
    sm: '0 2px 8px rgba(0,0,0,0.06)',
    md: '0 8px 24px rgba(0,0,0,0.08)',
  },
  motion: {
    duration: {
      150: '150ms',
      250: '250ms',
      350: '350ms',
    },
    easing: 'cubic-bezier(.2,.8,.2,1)',
  },
} as const

export type Brand = typeof brand



