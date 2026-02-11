/** @type {import('next').NextConfig} */
const nextConfig = {
  // Using default server mode for local development
  // (remove output: 'export' for dev server compatibility)
  trailingSlash: true,
  // Allow Android device access from network IP
  allowedDevOrigins: ['10.143.107.234', 'http://10.143.107.234:3000'],
  images: {
    unoptimized: true,
    domains: ['supabase.co', 'localhost'],
  },
  // PWA Configuration
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      // Face-api.js model files - CRITICAL for facial recognition
      {
        source: '/models/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      // WebAuthn support headers
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(self), biometric=(self)',
          },
        ],
      },
    ];
  },
  // Disable TypeScript errors in production build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint errors in production build
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
