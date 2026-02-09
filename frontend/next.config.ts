import type { NextConfig } from "next";

// @ts-ignore
const nextConfig: any = {
  reactStrictMode: false,
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
