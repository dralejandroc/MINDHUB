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
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    BACKEND_URL: process.env.BACKEND_URL || process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app',
    NEXT_PUBLIC_DJANGO_API_URL: process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app',
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
  // Configure experimental features for better performance
  experimental: {
    // Remove the aggressive file exclusion that was breaking API route bundling
    serverComponentsExternalPackages: ['sharp', 'canvas'],
  },
  // Configure build settings
  generateBuildId: async () => {
    return process.env.BUILD_ID || 'production-build';
  },
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
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' https://*.supabase.co https://mindhub.cloud; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://mindhub.cloud; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://*.supabase.co https://jvbcpldzoyicefdtnwkd.supabase.co https://mindhub.cloud https://www.mindhub.cloud http://localhost:* ws://localhost:*; frame-src 'self' https://*.supabase.co; worker-src 'self' blob: 'unsafe-inline'"
          },
        ],
      },
      {
        source: '/icon-:path*.(png|svg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
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
  // Note: Frontend has its own API routes at /app/api/ 
  // No rewrites needed - frontend routes take precedence
  // Railway backend is called directly from frontend API routes
};

module.exports = nextConfig;