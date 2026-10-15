import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Frontend-only demo build: all images are local files in /public.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
