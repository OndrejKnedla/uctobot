/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable API routes
  poweredByHeader: false,
  generateEtags: true,
  compress: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  // Optimization for webhook reliability and SEO
  experimental: {
    serverMinification: false, // Prevent minification issues in dev
    // optimizeCss: true, // Disabled due to critters dependency issue
  },
  
  // Disable static generation to avoid client component issues
  output: 'standalone',
  // Faster builds in development
  // swcMinify deprecated in Next.js 13+
  // Better error handling
  onDemandEntries: {
    maxInactiveAge: 25 * 1000, // Keep pages in memory longer
    pagesBufferLength: 5,
  },
  
  // SEO friendly trailing slash
  trailingSlash: false,
  
  // Security and SEO headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  },

  // SEO redirects
  async redirects() {
    return [
      {
        source: '/cenik',
        destination: '/#pricing',
        permanent: true,
      },
    ]
  }
}

export default nextConfig
