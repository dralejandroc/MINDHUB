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
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
};

module.exports = nextConfig;