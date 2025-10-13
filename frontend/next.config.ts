// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // ✅ your S3 bucket
      {
        protocol: 'https',
        hostname: 'streakling.s3.ap-southeast-1.amazonaws.com',
        pathname: '/**'
      },

      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
        pathname: '/**'
      }
    ]
  }
};

export default nextConfig;
