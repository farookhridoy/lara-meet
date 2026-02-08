import type { NextConfig } from "next";

// @ts-ignore
const nextConfig: any = {
  reactStrictMode: false,
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
