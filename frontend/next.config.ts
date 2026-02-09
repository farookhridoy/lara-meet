import type { NextConfig } from "next";

// @ts-ignore
const nextConfig: any = {
  reactStrictMode: false,
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
