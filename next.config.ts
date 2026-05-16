import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: [
        "appost-mn-d2026.vercel.app",
        "https://appost-mn-d2026.vercel.app",
        "localhost:3000"
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.api-sports.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
