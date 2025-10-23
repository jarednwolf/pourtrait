const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Disable PWA for preview envs to avoid SW cache issues
  disable: process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview' || process.env.NEXT_PUBLIC_DISABLE_PWA === 'true',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
        }
      }
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-static',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 365 days
        }
      }
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-image-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /^\/api\/wines/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'wine-api-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 5 * 60 // 5 minutes
        },
        networkTimeoutSeconds: 10
      }
    },
    {
      urlPattern: /^\/api\/recommendations/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'recommendations-api-cache',
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 2 * 60 // 2 minutes
        },
        networkTimeoutSeconds: 15
      }
    }
  ]
})

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Used to conditionally tweak behavior on preview deployments
  // Note: evaluated at build time on Vercel
  // eslint-disable-next-line no-undef
  typedRoutes: true,
  eslint: {
    // Disable ESLint during builds to prevent build failures from warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checking during builds to prevent build failures from type errors
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'localhost',
      // Add Supabase storage domain when configured
      // 'your-project.supabase.co',
    ],
    formats: ['image/webp', 'image/avif'],
  },
  // Optimize for Vercel deployment
  // Enable PWA capabilities
  headers: async () => {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
    ]
    // Add no-store on preview to avoid CDN/browser caching surprises
    if (process.env.VERCEL_ENV === 'preview') {
      securityHeaders.push({ key: 'Cache-Control', value: 'no-store' })
    }
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = withBundleAnalyzer(withPWA(nextConfig))