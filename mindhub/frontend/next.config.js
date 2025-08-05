/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Temporalmente para desarrollo
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporalmente para desarrollo
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://mindhub.cloud/api',
    BACKEND_URL: process.env.BACKEND_URL || 'https://mindhub.cloud/api',
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // Ensure public files are served correctly
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  // Handle redirects for authentication
  async redirects() {
    return [
      {
        source: '/api/auth/:path*',
        has: [
          {
            type: 'host',
            value: 'www.mindhub.cloud',
          },
        ],
        destination: 'https://mindhub.cloud/api/auth/:path*',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;