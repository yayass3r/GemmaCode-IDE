import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Performance & Production Optimizations */
  // SWC minification is enabled by default in Next.js 14+

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  /* Headers for security and caching */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  /* TypeScript config */
  typescript: {
    ignoreBuildErrors: false,
  },

  reactStrictMode: false,
};

export default nextConfig;
