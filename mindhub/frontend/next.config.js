const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://mindhub-production.up.railway.app',
    BACKEND_URL: process.env.BACKEND_URL || 'https://mindhub-production.up.railway.app',
  },
  // Force webpack to resolve @ paths correctly
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      '@/components': path.resolve(__dirname, 'components'),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/contexts': path.resolve(__dirname, 'contexts'),
      '@/hooks': path.resolve(__dirname, 'hooks'),
      '@/utils': path.resolve(__dirname, 'utils'),
      '@/styles': path.resolve(__dirname, 'styles'),
      '@/types': path.resolve(__dirname, 'types'),
    };
    return config;
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
            value: 'application/json',
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
};

module.exports = nextConfig;