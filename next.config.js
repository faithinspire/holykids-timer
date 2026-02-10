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
      // WebAuthn support headers
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(self), biometric=(self)',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
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
