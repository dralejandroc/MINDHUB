/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Enable TypeScript checking during build
    ignoreBuildErrors: false,
  },
  eslint: {
    // Enable ESLint checking during build
    ignoreDuringBuilds: false,
  },
  env: {
    // Auth0 configuration from environment variables
    AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,
    AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
    AUTH0_SCOPE: process.env.AUTH0_SCOPE,
    AUTH0_CALLBACK_URL: process.env.AUTH0_CALLBACK_URL,
    AUTH0_LOGOUT_URL: process.env.AUTH0_LOGOUT_URL,
    // API configuration
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV || 'development',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.auth0.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  // Redirect configuration for Hub routing
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/hubs',
        permanent: true,
      },
      {
        source: '/app',
        destination: '/hubs',
        permanent: true,
      },
    ];
  },
  // Rewrite configuration for API proxy
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:8080'}/api/:path*`,
      },
    ];
  },
  // Bundle analyzer (optional)
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize PDFs and medical document handling
    config.module.rules.push({
      test: /\.pdf$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/files/',
          outputPath: 'static/files/',
        },
      },
    });

    return config;
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
};

module.exports = nextConfig;