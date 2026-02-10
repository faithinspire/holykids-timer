const { createNextBuild } = require("@netlify/next");

/**
 * @type {import('@netlify/next').NextConfig}
 */
const nextConfig = {
  // Using server mode for Netlify deployment
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['supabase.co', 'localhost'],
  },
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
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

exports.handler = createNextBuild({
  nextConfig,
});
