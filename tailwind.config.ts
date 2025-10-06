import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontSize: {
        // Typography scale tokens
        'display-1': ['3.75rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }], // 60px
        'display-2': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }], // 48px
        'heading-1': ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '-0.01em' }], // 36px
        'heading-2': ['1.875rem', { lineHeight: '2.375rem', letterSpacing: '-0.005em' }], // 30px
        'heading-3': ['1.5rem', { lineHeight: '2rem' }], // 24px
        'body-lg': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        'body': ['1rem', { lineHeight: '1.5rem' }], // 16px
        'caption': ['0.8125rem', { lineHeight: '1.25rem' }], // 13px
      },
      colors: {
        // Brand tokens
        primary: {
          DEFAULT: '#6D28D9',
          600: '#5B21B6',
          700: '#4C1D95',
        },
        accent: '#7C3AED',
        success: '#16A34A',
        warning: '#F59E0B',
        error: '#DC2626',
        // Accessible link tokens (AA+ on light surfaces)
        link: '#4C1D95', // primary-700
        'link-hover': '#5B21B6', // primary-600
        'link-visited': '#3B1683',
        surface: '#FFFFFF',
        'surface-alt': '#F8F7FB',
        'dark-surface': '#0B0B0E',
        'dark-surface-alt': '#121218',
        // Wine-inspired professional color palette
        wine: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        burgundy: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
      },
      borderRadius: {
        'brand-sm': '6px',
        'brand-md': '12px',
        'brand-lg': '20px',
      },
      boxShadow: {
        'brand-xs': '0 1px 2px rgba(0,0,0,0.04)',
        'brand-sm': '0 2px 8px rgba(0,0,0,0.06)',
        'brand-md': '0 8px 24px rgba(0,0,0,0.08)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      screens: {
        'xs': '475px',
      },
      transitionTimingFunction: {
        brand: 'cubic-bezier(.2,.8,.2,1)'
      },
      transitionDuration: {
        250: '250ms',
        350: '350ms'
      }
    },
  },
  plugins: [],
}
export default config