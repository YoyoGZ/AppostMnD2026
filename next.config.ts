import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ["appost-mn-d2026.vercel.app", "localhost:3000"],
    },
  },
};

export default nextConfig;
