// next.config.ts
import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),

  eslint: { ignoreDuringBuilds: true },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'streakling.s3.ap-southeast-1.amazonaws.com',
        pathname: '/**'
      },
      { protocol: 'https', hostname: 'img.clerk.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.clerk.dev', pathname: '/**' }
    ],

    formats: ['image/avif', 'image/webp']
  }
};

export default nextConfig;
